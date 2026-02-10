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




# =========================
# Helpers
# =========================
def to_product_out(p: Product) -> dict:
    available = int(p.available_quantity or 0)
    rented = int(p.rented_quantity or 0)
    taken = int(getattr(p, "taken_quantity", 0) or 0)


    return {
        "id": str(p.id),
        "name": p.name,
        "category": p.category,
        "gender": p.gender,
        "type": p.type,
        "price": float(p.price or 0.0),
        "rental_price": float(getattr(p, "rental_price", 0.0) or 0.0),
        "quantity": int(p.quantity or 0),
        "availableQuantity": available,
        "rentedQuantity": rented,
        "takenQuantity": taken,
        "imageurl": p.imageurl,
        "is_available": available > 0,
        "max_qty_allowed": max(available, 0),
    }




def normalize_product_totals(product: Product) -> bool:
    quantity = int(product.quantity or 0)
    available = int(product.available_quantity or 0)
    rented = int(product.rented_quantity or 0)
    taken = int(getattr(product, "taken_quantity", 0) or 0)


    changed = False


    if quantity < 0:
        quantity = 0
        changed = True
    if rented < 0:
        rented = 0
        changed = True
    if taken < 0:
        taken = 0
        changed = True


    if quantity < rented + taken:
        quantity = rented + taken
        changed = True


    expected_available = quantity - rented - taken
    if available != expected_available:
        available = expected_available
        changed = True


    if changed:
        product.quantity = quantity
        product.available_quantity = available
        product.rented_quantity = rented
        product.taken_quantity = taken


    return changed






def validate_totals(quantity: int, available: int, rented: int, taken: int) -> None:
    if quantity < 0 or available < 0 or rented < 0 or taken < 0:
        raise HTTPException(status_code=400, detail="Quantities cannot be negative")
    if available + rented + taken != quantity:
        raise HTTPException(
            status_code=400,
            detail="Total quantity must equal available + rented + taken",
        )




# =========================
# CRUD
# =========================
@router.get("")
def list_products(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    products = db.query(Product).order_by(Product.created_at.desc()).all()


    changed = False
    for product in products:
        changed = normalize_product_totals(product) or changed


    if changed:
        db.commit()


    return [to_product_out(p) for p in products]




@router.post("")
async def create_product(
    data: ProductCreate,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    taken = 0


    validate_totals(
        quantity=int(data.quantity),
        available=int(data.availableQuantity),
        rented=int(data.rentedQuantity),
        taken=int(taken),
    )


    existing = db.query(Product).filter(Product.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Product already exists")


    product = Product(
        id=uuid.uuid4(),
        name=data.name,
        category=data.category,
        gender=data.gender,
        type=data.type,
        price=data.price,
        rental_price=data.rental_price if data.rental_price is not None else 0.0,
        quantity=data.quantity,
        available_quantity=data.availableQuantity,
        rented_quantity=data.rentedQuantity,
        taken_quantity=taken,
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
    db.commit()


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


    if normalize_product_totals(product):
        db.commit()
        db.refresh(product)


    if payload.name is not None:
        existing = db.query(Product).filter(
            Product.name == payload.name,
            Product.id != product.id,
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
    if payload.rental_price is not None:
        product.rental_price = payload.rental_price


    new_quantity = int(product.quantity if payload.quantity is None else payload.quantity)
    new_available = int(product.available_quantity if payload.availableQuantity is None else payload.availableQuantity)
    new_rented = int(product.rented_quantity if payload.rentedQuantity is None else payload.rentedQuantity)
    new_taken = int(getattr(product, "taken_quantity", 0) or 0)


    validate_totals(new_quantity, new_available, new_rented, new_taken)


    product.quantity = new_quantity
    product.available_quantity = new_available
    product.rented_quantity = new_rented
    product.taken_quantity = new_taken


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


    if normalize_product_totals(product):
        db.commit()
        db.refresh(product)


    active_rental = (
        db.query(Rental)
        .filter(
            Rental.product_id == product.id,
            Rental.status == "ACTIVE",
            Rental.returned_at.is_(None),
        )
        .first()
    )
    if active_rental:
        raise HTTPException(status_code=409, detail="Cannot delete product with ACTIVE rentals")


    db.delete(product)
    db.commit()


    await sio.emit("product_updated", {"id": product_id, "action": "deleted"})
    return {"message": "deleted"}




# =========================
# Stock / Rental actions
# =========================
class QtyRequest(BaseModel):
    qty: int = Field(default=1, ge=1, description="How many units")




class RentRequest(BaseModel):
    qty: int = Field(default=1, ge=1, description="How many units")
    days: int = Field(default=2, ge=1, le=30, description="Rental duration in days")






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


    if normalize_product_totals(product):
        db.commit()
        db.refresh(product)


    available = int(product.available_quantity or 0)
    if available < body.qty:
        raise HTTPException(status_code=409, detail="Not enough stock")


    product.available_quantity = available - body.qty
    product.taken_quantity = int(getattr(product, "taken_quantity", 0) or 0) + body.qty


    validate_totals(
        int(product.quantity or 0),
        int(product.available_quantity or 0),
        int(product.rented_quantity or 0),
        int(product.taken_quantity or 0),
    )


    log_action(
        db=db,
        actor_user_id=str(user.id),
        action="TAKE",
        product_id=str(product.id),
        qty=body.qty,
        meta={"name": product.name},
    )


    db.commit()
    db.refresh(product)


    product_data = to_product_out(product)
    await sio.emit("product_updated", product_data)
    return product_data








@router.post("/{product_id}/return-taken")
async def return_taken_product(
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


    if normalize_product_totals(product):
        db.commit()
        db.refresh(product)


    taken = int(getattr(product, "taken_quantity", 0) or 0)
    if taken < body.qty:
        raise HTTPException(status_code=409, detail="Nothing to return (taken)")


    product.taken_quantity = taken - body.qty
    product.available_quantity = int(product.available_quantity or 0) + body.qty


    validate_totals(
        int(product.quantity or 0),
        int(product.available_quantity or 0),
        int(product.rented_quantity or 0),
        int(product.taken_quantity or 0),
    )


    log_action(
        db=db,
        actor_user_id=str(user.id),
        action="RETURN_TAKEN",
        product_id=str(product.id),
        qty=body.qty,
        meta={"name": product.name},
    )


    db.commit()
    db.refresh(product)


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


    if normalize_product_totals(product):
        db.commit()
        db.refresh(product)


    available = int(product.available_quantity or 0)
    if available < body.qty:
        raise HTTPException(status_code=409, detail="Not enough stock")


    product.available_quantity = available - body.qty
    product.rented_quantity = int(product.rented_quantity or 0) + body.qty


    start = datetime.now(timezone.utc)
    end = start + timedelta(days=int(body.days))


    rental = Rental(
        product_id=product.id,
        user_id=user.id,
        qty=body.qty,
        start_date=start,
        end_date=end,
        status="ACTIVE",
    )
    db.add(rental)


    validate_totals(
        int(product.quantity or 0),
        int(product.available_quantity or 0),
        int(product.rented_quantity or 0),
        int(getattr(product, "taken_quantity", 0) or 0),
    )


    log_action(
        db=db,
        actor_user_id=str(user.id),
        action="RENT",
        product_id=str(product.id),
        qty=body.qty,
        meta={"name": product.name, "days": int(body.days), "rentalId": str(rental.id)},
    )


    db.commit()
    db.refresh(product)


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


    if normalize_product_totals(product):
        db.commit()
        db.refresh(product)


    rented = int(product.rented_quantity or 0)
    if rented < body.qty:
        raise HTTPException(status_code=409, detail="Not enough rented items to return")


    q = (
        db.query(Rental)
        .filter(
            Rental.product_id == product.id,
            Rental.status == "ACTIVE",
            Rental.returned_at.is_(None),
        )
        .order_by(Rental.created_at.desc())
    )


    # ✅ employee/admin can return any active rental
    # ✅ customer can return only his own rentals
    if getattr(user, "role", None) == "customer":
        q = q.filter(Rental.user_id == user.id)


    rental = q.first()
    if not rental:
        raise HTTPException(status_code=409, detail="No active rental found for this product")


    if int(rental.qty or 0) < body.qty:
        raise HTTPException(status_code=409, detail="Return qty exceeds active rental qty")


    product.rented_quantity = rented - body.qty
    product.available_quantity = int(product.available_quantity or 0) + body.qty


    # if returning partial qty, keep rental ACTIVE with reduced qty
    if int(rental.qty) > body.qty:
        rental.qty = int(rental.qty) - body.qty
    else:
        rental.returned_at = datetime.now(timezone.utc)
        rental.status = "RETURNED"


    validate_totals(
        int(product.quantity or 0),
        int(product.available_quantity or 0),
        int(product.rented_quantity or 0),
        int(getattr(product, "taken_quantity", 0) or 0),
    )


    log_action(
        db=db,
        actor_user_id=str(user.id),
        action="RETURN_RENTED",
        product_id=str(product.id),
        qty=body.qty,
        meta={"name": product.name, "rentalId": str(rental.id)},
    )


    db.commit()
    db.refresh(product)


    product_data = to_product_out(product)
    await sio.emit("product_updated", product_data)
    return product_data



