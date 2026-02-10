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
from app.models.product import Product

router = APIRouter(prefix="/rentals", tags=["rentals"])


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


@router.post("/", summary="Customer: create rental", response_model=RentalOut)
def create_rental(
    body: CreateRentalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == body.productId).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    available = int(getattr(product, "available_quantity", 0) or 0)
    if body.qty > available:
        raise HTTPException(status_code=400, detail=f"Not enough quantity. Requested {body.qty}, available {available}")

    start_dt = datetime.combine(body.startDate, datetime.min.time(), tzinfo=timezone.utc)
    end_dt = start_dt + timedelta(days=int(body.days))

    rental = Rental(
        user_id=current_user.id,
        product_id=product.id,
        qty=int(body.qty),
        start_date=start_dt,
        end_date=end_dt,
        status="ACTIVE",
    )

    # move stock: available--, rented++
    product.available_quantity = available - int(body.qty)
    if hasattr(product, "rented_quantity"):
        product.rented_quantity = int(getattr(product, "rented_quantity", 0) or 0) + int(body.qty)

    db.add(rental)
    db.commit()
    db.refresh(rental)

    return {
        "id": str(rental.id),
        "orderId": str(getattr(rental, "order_id", None)) if getattr(rental, "order_id", None) else None,
        "status": rental.status,
        "startDate": rental.start_date.isoformat() if rental.start_date else None,
        "endDate": rental.end_date.isoformat() if rental.end_date else None,
        "createdAt": rental.created_at.isoformat() if rental.created_at else None,
        "productId": str(rental.product_id) if getattr(rental, "product_id", None) else None,
        "qty": int(getattr(rental, "qty", 0) or 0),
    }


@router.get("/", summary="Admin: list all rentals (latest 50)")
def list_rentals(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    rentals = db.query(Rental).order_by(Rental.created_at.desc()).limit(50).all()
    return [
        {
            "id": str(r.id),
            "orderId": str(getattr(r, "order_id", None)) if getattr(r, "order_id", None) else None,
            "status": r.status,
            "startDate": r.start_date.isoformat() if r.start_date else None,
            "endDate": r.end_date.isoformat() if r.end_date else None,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
            "productId": str(getattr(r, "product_id", "")) if getattr(r, "product_id", None) else None,
            "qty": int(getattr(r, "qty", 0) or 0),
        }
        for r in rentals
    ]


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
            "orderId": str(getattr(r, "order_id", None)) if getattr(r, "order_id", None) else None,
            "status": r.status,
            "startDate": r.start_date.isoformat() if r.start_date else None,
            "endDate": r.end_date.isoformat() if r.end_date else None,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
            "productId": str(getattr(r, "product_id", "")) if getattr(r, "product_id", None) else None,
            "qty": int(getattr(r, "qty", 0) or 0),
        }
        for r in rentals
    ]
