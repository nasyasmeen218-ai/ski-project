from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional


from app.core.security import get_current_user
from app.db.session import get_db
from app.models.rental import Rental
from app.models.product import Product
from app.core.security import get_current_user, require_admin


router = APIRouter()


@router.get("/my")
def my_rentals(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rentals = (
        db.query(Rental)
        .filter(Rental.user_id == user.id)
        .order_by(Rental.created_at.desc())
        .limit(200)
        .all()
    )

    # כדי להחזיר גם שם מוצר/סוג בלי JOIN מורכב
    product_ids = list({r.product_id for r in rentals})
    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .all()
        if product_ids
        else []
    )
    product_map = {p.id: p for p in products}

    return [
        {
            "id": str(r.id),
            "productId": str(r.product_id),
            "productName": product_map.get(r.product_id).name if product_map.get(r.product_id) else None,
            "qty": r.qty,
            "status": r.status,
            "startDate": r.start_date.isoformat(),
            "endDate": r.end_date.isoformat(),
            "returnedAt": r.returned_at.isoformat() if r.returned_at else None,
            "createdAt": r.created_at.isoformat(),
        }
        for r in rentals
    ]
@router.get("")
def list_rentals(
    status: str | None = None,      # ACTIVE / RETURNED
    userId: str | None = None,
    productId: str | None = None,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    q = db.query(Rental)

    if status:
        q = q.filter(Rental.status == status)
    if userId:
        q = q.filter(Rental.user_id == userId)
    if productId:
        q = q.filter(Rental.product_id == productId)

    rentals = q.order_by(Rental.created_at.desc()).limit(500).all()

    # bring product names (optional nice-to-have)
    product_ids = list({r.product_id for r in rentals})
    products = db.query(Product).filter(Product.id.in_(product_ids)).all() if product_ids else []
    product_map = {p.id: p for p in products}

    return [
        {
            "id": str(r.id),
            "userId": str(r.user_id),
            "productId": str(r.product_id),
            "productName": product_map.get(r.product_id).name if product_map.get(r.product_id) else None,
            "qty": r.qty,
            "status": r.status,
            "startDate": r.start_date.isoformat(),
            "endDate": r.end_date.isoformat(),
            "returnedAt": r.returned_at.isoformat() if r.returned_at else None,
            "createdAt": r.created_at.isoformat(),
        }
        for r in rentals
    ]

