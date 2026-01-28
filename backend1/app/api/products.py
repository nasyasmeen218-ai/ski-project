from datetime import datetime, timedelta, timezone
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.security import get_current_user, require_admin
from app.db.session import get_db
from app.models.product import Product
from app.models.rental import Rental
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.audit_service import log_action

router = APIRouter()


def to_product_out(p: Product) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "category": p.category,
        "gender": p.gender,
        "type": p.type,
        "quantity": p.quantity,
        "availableQuantity": p.available_quantity,
        "rentedQuantity": p.rented_quantity,
    }


# -------------------- Products CRUD --------------------

@router.get("")
def list_products(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    return [to_product_out(p) for p in products]


@router.post("")
def create_product(
    data: ProductCreate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if data.availableQuantity + data.rentedQuantity != data.quantity:
        raise HTTPException(status_code=400, detail="Total quantity must equal available + rented")

    # Optional pre-check (nice UX). Still keep IntegrityError handling as the source of truth.
    existing = db.query(Product).filter(Product.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Product already exists")

    product = Product(
        id=uuid.uuid4(),
        name=data.name,
        category=data.category,
        gender=data.gender,
        type=data.type,
        quantity=data.quantity,
        available_quantity=data.availableQuantity,
        rented_quantity=data.rentedQuantity,
    )

    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Product already exists")
    db.refresh(product)

    log_action(
        db=db,
        actor_user_id=str(admin.id),
        action="PRODUCT_CREATE",
        product_id=str(product.id),
        qty=product.quantity,
        meta={"name": product.name, "category": product.category, "type": product.type},
    )

    return to_product_out(product)


@router.put("/{product_id}")
def update_product(
    product_id: str,
    payload: ProductUpdate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.name is not None:
        existing = db.query(Product).filter(
            Product.name == payload.name,
            Product.id != product.id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Product name already exists")
        product.name = payload.name

    if payload.category is not None:
        product.category = payload.category
    if payload.gender is not None:
        product.gender = payload.gender
    if payload.type is not None:
        product.type = payload.type

    new_quantity = product.quantity if payload.quantity is None else payload.quantity
    new_available = product.available_quantity if payload.availableQuantity is None else payload.availableQuantity
    new_rented = product.rented_quantity if payload.rentedQuantity is None else payload.rentedQuantity

    if new_available + new_rented != new_quantity:
        raise HTTPException(status_code=400, detail="Total quantity must equal available + rented")

    product.quantity = new_quantity
    product.available_quantity = new_available
    product.rented_quantity = new_rented

    db.commit()
    db.refresh(product)
    return to_product_out(product)


@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    active_rental = (
        db.query(Rental)
        .filter(Rental.product_id == product.id, Rental.status == "ACTIVE")
        .first()
    )
    if active_rental:
        raise HTTPException(status_code=409, detail="Cannot delete product with ACTIVE rentals")

    db.delete(product)
    db.commit()
    return {"message": "deleted"}


# -------------------- Inventory Actions --------------------

class QtyRequest(BaseModel):
    qty: int = Field(default=1, ge=1, description="How many units", examples=[1])


class RentRequest(BaseModel):
    qty: int = Field(default=1, ge=1, description="How many units", examples=[1])
    days: int = Field(default=2, ge=1, description="Rental duration in days", examples=[2])


@router.post("/{product_id}/take")
def take_product(
    product_id: str,
    body: QtyRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.available_quantity < body.qty:
        raise HTTPException(status_code=409, detail="Not enough stock")

    product.available_quantity -= body.qty

    db.commit()
    db.refresh(product)

    log_action(
        db=db,
        actor_user_id=str(user.id),
        action="TAKE",
        product_id=str(product.id),
        qty=body.qty,
        meta={"name": product.name},
    )

    return to_product_out(product)


@router.post("/{product_id}/return-taken")
def return_taken_product(
    product_id: str,
    body: QtyRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    taken_out = product.quantity - product.available_quantity - product.rented_quantity
    if taken_out < body.qty:
        raise HTTPException(status_code=409, detail="Nothing to return (taken)")

    product.available_quantity += body.qty

    db.commit()
    db.refresh(product)

    log_action(
        db=db,
        actor_user_id=str(user.id),
        action="RETURN_TAKEN",
        product_id=str(product.id),
        qty=body.qty,
        meta={"name": product.name},
    )

    return to_product_out(product)


@router.post(
    "/{product_id}/rent",
    summary="Rent product",
    description="Rent a product for a number of days. Decreases availableQuantity, increases rentedQuantity, and creates a Rental record.",
)
def rent_product(
    product_id: str,
    body: RentRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.available_quantity < body.qty:
        raise HTTPException(status_code=409, detail="Not enough stock")

    product.available_quantity -= body.qty
    product.rented_quantity += body.qty

    start = datetime.now(timezone.utc)
    end = start + timedelta(days=body.days)

    rental = Rental(
        product_id=UUID(str(product.id)),
        user_id=UUID(str(user.id)),
        qty=body.qty,
        start_date=start,
        end_date=end,
        status="ACTIVE",
    )
    db.add(rental)

    db.commit()
    db.refresh(product)

    log_action(
        db=db,
        actor_user_id=str(user.id),
        action="RENT",
        product_id=str(product.id),
        qty=body.qty,
        meta={"name": product.name, "days": body.days, "rentalId": str(rental.id)},
    )

    return to_product_out(product)


@router.post(
    "/{product_id}/return-rented",
    summary="Return rented product",
    description="Return a rented product. Closes the latest ACTIVE rental for this user+product and updates inventory.",
)
def return_rented_product(
    product_id: str,
    body: QtyRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.rented_quantity < body.qty:
        raise HTTPException(status_code=409, detail="Not enough rented items to return")

    rental = (
        db.query(Rental)
        .filter(
            Rental.product_id == UUID(str(product.id)),
            Rental.user_id == UUID(str(user.id)),
            Rental.status == "ACTIVE",
            Rental.returned_at.is_(None),
        )
        .order_by(Rental.created_at.desc())
        .first()
    )
    if not rental:
        raise HTTPException(status_code=409, detail="No active rental found for this product")

    if rental.qty < body.qty:
        raise HTTPException(status_code=409, detail="Return qty exceeds active rental qty")

    product.rented_quantity -= body.qty
    product.available_quantity += body.qty

    rental.returned_at = datetime.now(timezone.utc)
    rental.status = "RETURNED"

    db.commit()
    db.refresh(product)

    log_action(
        db=db,
        actor_user_id=str(user.id),
        action="RETURN_RENTED",
        product_id=str(product.id),
        qty=body.qty,
        meta={"name": product.name, "rentalId": str(rental.id)},
    )

    return to_product_out(product)
