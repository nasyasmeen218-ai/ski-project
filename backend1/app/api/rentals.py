from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_admin
from app.db.session import get_db
from app.models.rental import Rental
from app.models.user import User

# ✅ חשוב: prefix כדי שלא יהיה path ריק
router = APIRouter(prefix="/rentals", tags=["rentals"])


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
