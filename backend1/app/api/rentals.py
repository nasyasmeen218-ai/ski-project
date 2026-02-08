from datetime import datetime, timedelta, timezone, date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.db.session import get_db
from app.models.rental import Rental
from app.models.user import User
from app.models.product import Product  # ✅ צריך כדי לבדוק מלאי ולחבר מוצר


router = APIRouter(prefix="/rentals", tags=["rentals"])


# =========================
# Schemas (inline)
# =========================
class CreateRentalRequest(BaseModel):
    productId: UUID
    startDate: date
    days: int = Field(ge=1, le=30)
    qty: int = Field(default=1, ge=1)


class RentalOut(BaseModel):
    id: str
    orderId: Optional[str] = None
    status: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    createdAt: Optional[str] = None
    productId: Optional[str] = None
    qty: Optional[int] = None


# =========================
# Create rental (Customer)
# =========================
@router.post("/", summary="Customer: create rental", response_model=RentalOut)
def create_rental(
    body: CreateRentalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1) product exists?
    product = db.query(Product).filter(Product.id == body.productId).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2) available quantity check
    # תומך בשני שמות שדה נפוצים: available_quantity / availableQuantity
    available = None
    if hasattr(product, "available_quantity"):
        available = int(product.available_quantity or 0)
    elif hasattr(product, "availableQuantity"):
        available = int(getattr(product, "availableQuantity") or 0)
    else:
        available = 0

    if body.qty > available:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough quantity. Requested {body.qty}, available {available}",
        )

    # 3) compute start/end
    start_dt = datetime.combine(body.startDate, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = start_dt + timedelta(days=body.days)

    # 4) create Rental (status must match DB constraint: open/returned)
    rental = Rental(
        user_id=current_user.id,
        product_id=product.id,
        qty=body.qty,
        start_date=start_dt,
        end_date=end_dt,
        status="open",
    )

    # 5) reduce inventory
    new_available = available - body.qty
    if hasattr(product, "available_quantity"):
        product.available_quantity = new_available
    elif hasattr(product, "availableQuantity"):
        setattr(product, "availableQuantity", new_available)

    db.add(rental)
    db.commit()
    db.refresh(rental)

    return {
        "id": str(rental.id),
        "orderId": str(rental.order_id) if getattr(rental, "order_id", None) else None,
        "status": rental.status,
        "startDate": rental.start_date.isoformat() if rental.start_date else None,
        "endDate": rental.end_date.isoformat() if rental.end_date else None,
        "createdAt": rental.created_at.isoformat() if rental.created_at else None,
        "productId": str(rental.product_id) if getattr(rental, "product_id", None) else None,
        "qty": int(getattr(rental, "qty", 0) or 0),
    }


# =========================
# List rentals (Admin)
# =========================
@router.get("/", summary="Admin: list all rentals (latest 50)")
def list_rentals(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rentals = (
        db.query(Rental)
        .order_by(Rental.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": str(r.id),
            "orderId": str(r.order_id) if getattr(r, "order_id", None) else None,
            "status": r.status,
            "startDate": r.start_date.isoformat() if r.start_date else None,
            "endDate": r.end_date.isoformat() if r.end_date else None,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rentals
    ]


# =========================
# My rentals (Customer)
# =========================
@router.get("/my", summary="Customer: list my rentals")
def my_rentals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rentals = (
        db.query(Rental)
        .filter(Rental.user_id == current_user.id)
        .order_by(Rental.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(r.id),
            "orderId": str(r.order_id) if getattr(r, "order_id", None) else None,
            "status": r.status,
            "startDate": r.start_date.isoformat() if r.start_date else None,
            "endDate": r.end_date.isoformat() if r.end_date else None,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rentals
    ]
