from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.core.security import get_current_user

from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem

router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])


def _ensure_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")


@router.get("/top-products")
def top_products(
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)

    rows = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.coalesce(func.sum(OrderItem.qty), 0).label("total_qty"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderItem.qty).desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "product_id": str(r.product_id),
            "product_name": r.product_name,
            "total_qty": int(r.total_qty or 0),
        }
        for r in rows
    ]


@router.get("/customers-orders")
def customers_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_admin(current_user)

    customers = db.query(User).filter(User.role != "admin").order_by(User.created_at.desc()).all()

    result = []
    for c in customers:
        orders = (
            db.query(Order)
            .filter(Order.customer_id == c.id)
            .order_by(Order.created_at.desc())
            .all()
        )

        orders_out = []
        for o in orders:
            items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
            orders_out.append(
                {
                    "id": str(o.id),
                    "status": o.status,
                    "created_at": o.created_at,
                    "items": [
                        {
                            "id": str(i.id),
                            "product_id": str(i.product_id),
                            "qty": i.qty,
                            "price_at_order": float(i.price_at_order) if i.price_at_order is not None else None,
                        }
                        for i in items
                    ],
                }
            )

        result.append(
            {
                "customer_id": str(c.id),
                "username": c.username,
                "is_active": getattr(c, "is_active", True),
                "orders": orders_out,
            }
        )

    return result
