from datetime import datetime, timedelta, timezone
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.socket_manager import sio  
from app.core.security import get_current_user, require_admin
from app.db.session import get_db
from app.models.product import Product
from app.models.rental import Rental
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.audit_service import log_action

router = APIRouter(prefix="/products", tags=["products"])

def to_product_out(p: Product) -> dict:
    """הופך את אובייקט המוצר מה-DB ל-JSON עבור הפרונטנד"""
    available = int(p.available_quantity or 0)

    # כאן היה החוסר! הוספתי את rental_price כדי שהפרונטנד יזהה אותו
    return {
        "id": str(p.id),
        "name": p.name,
        "category": p.category,
        "gender": p.gender,
        "type": p.type,
        "price": float(p.price or 0.0),
        "rental_price": float(p.rental_price or 0.0),  # השורה הקריטית שתוקנה
        "quantity": int(p.quantity or 0),
        "availableQuantity": available,
        "rentedQuantity": int(p.rented_quantity or 0),
        "imageurl": p.imageurl,
        "is_available": available > 0,
        "max_qty_allowed": max(available, 0),
    }

@router.get("")
def list_products(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    return [to_product_out(p) for p in products]

@router.post("")
async def create_product(
    data: ProductCreate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if data.availableQuantity + data.rentedQuantity != data.quantity:
        raise HTTPException(status_code=400, detail="Total quantity must equal available + rented")

    existing = db.query(Product).filter(Product.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Product already exists")

    # הוספת rental_price ביצירה
    product = Product(
        id=uuid.uuid4(),
        name=data.name,
        category=data.category,
        gender=data.gender,
        type=data.type,
        price=data.price,
        rental_price=getattr(data, 'rental_price', 0.0), # וידוא תמיכה במחיר השכרה
        quantity=data.quantity,
        available_quantity=data.availableQuantity,
        rented_quantity=data.rentedQuantity,
        imageurl=data.imageurl,
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

    product_data = to_product_out(product)
    await sio.emit("product_updated", product_data)
    return product_data

@router.put("/{product_id}")
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        pid = UUID(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product_id format")

    product = db.query(Product).filter(Product.id == pid).first()
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
    if payload.imageurl is not None:
        product.imageurl = payload.imageurl
    if payload.price is not None:
        product.price = payload.price
    # עדכון מחיר השכרה אם קיים ב-Payload
    if hasattr(payload, 'rental_price') and payload.rental_price is not None:
        product.rental_price = payload.rental_price

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

    product_data = to_product_out(product)
    await sio.emit("product_updated", product_data)
    return product_data

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        pid = UUID(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product_id format")

    product = db.query(Product).filter(Product.id == pid).first()
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

    await sio.emit("product_updated", {"id": product_id, "action": "deleted"})
    return {"message": "deleted"}

class QtyRequest(BaseModel):
    qty: int = Field(default=1, ge=1, description="How many units")

class RentRequest(BaseModel):
    qty: int = Field(default=1, ge=1, description="How many units")
    days: int = Field(default=2, ge=1, description="Rental duration in days")

@router.post("/{product_id}/take")
async def take_product(
    product_id: str,
    body: QtyRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        pid = UUID(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product_id format")

    product = db.query(Product).filter(Product.id == pid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.available_quantity < body.qty:
        raise HTTPException(status_code=409, detail="Not enough stock")

    product.available_quantity -= body.qty
    db.commit()
    db.refresh(product)

    log_action(
        db=db, actor_user_id=str(user.id), action="TAKE",
        product_id=str(product.id), qty=body.qty, meta={"name": product.name},
    )

    product_data = to_product_out(product)
    await sio.emit("product_updated", product_data)
    return product_data

@router.post("/{product_id}/rent")
async def rent_product(
    product_id: str,
    body: RentRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        pid = UUID(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product_id format")

    product = db.query(Product).filter(Product.id == pid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.available_quantity < body.qty:
        raise HTTPException(status_code=409, detail="Not enough stock")

    product.available_quantity -= body.qty
    product.rented_quantity += body.qty

    start = datetime.now(timezone.utc)
    end = start + timedelta(days=body.days)

    rental = Rental(
        product_id=product.id,
        user_id=user.id,
        qty=body.qty,
        start_date=start,
        end_date=end,
        status="open",
    )
    db.add(rental)
    db.commit()
    db.refresh(product)

    log_action(
        db=db, actor_user_id=str(user.id), action="RENT",
        product_id=str(product.id), qty=body.qty,
        meta={"name": product.name, "days": body.days, "rentalId": str(rental.id)},
    )

    product_data = to_product_out(product)
    await sio.emit("product_updated", product_data)
    return product_data

@router.post("/{product_id}/return-rented")
async def return_rented_product(
    product_id: str,
    body: QtyRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        pid = UUID(product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product_id format")

    product = db.query(Product).filter(Product.id == pid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.rented_quantity < body.qty:
        raise HTTPException(status_code=409, detail="Not enough rented items to return")

    rental = db.query(Rental).filter(
        Rental.product_id == product.id,
        Rental.user_id == user.id,
        Rental.status == "ACTIVE",
        Rental.returned_at.is_(None),
    ).order_by(Rental.created_at.desc()).first()

    if not rental:
        raise HTTPException(status_code=409, detail="No active rental found")

    product.rented_quantity -= body.qty
    product.available_quantity += body.qty
    rental.returned_at = datetime.now(timezone.utc)
    rental.status = "returned"

    db.commit()
    db.refresh(product)

    product_data = to_product_out(product)
    await sio.emit("product_updated", product_data)
    return product_data