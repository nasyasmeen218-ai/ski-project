from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.order import OrderCreateRequest, OrderResponse, OrderItemResponse

router = APIRouter(prefix="/orders", tags=["orders"])


def _ensure_not_admin(user: User):
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot create orders")


@router.post("", response_model=OrderResponse)
def create_order(
    payload: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_not_admin(current_user)

    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must contain items")

    # validate product ids
    try:
        product_ids = [UUID(i.product_id) for i in payload.items]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product_id format")

    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    products_map = {str(p.id): p for p in products}

    for it in payload.items:
        if it.product_id not in products_map:
            raise HTTPException(status_code=404, detail=f"Product not found: {it.product_id}")

        p = products_map[it.product_id]

        # stock check: support both styles
        available = getattr(p, "available_quantity", None)
        if available is None:
            # some projects store availableQuantity under availableQuantity or availableQuantity-like
            available = getattr(p, "availableQuantity", None)

        total_qty = getattr(p, "quantity", None)

        if isinstance(available, int) and it.qty > available:
            raise HTTPException(status_code=409, detail=f"Not enough stock for product {it.product_id}")

        # fallback if only total quantity exists
        if available is None and isinstance(total_qty, int) and it.qty > total_qty:
            raise HTTPException(status_code=409, detail=f"Not enough stock for product {it.product_id}")

    order = Order(customer_id=current_user.id, status="pending")
    db.add(order)
    db.flush()  # generate order.id

    items_rows = []
    for it in payload.items:
        row = OrderItem(
            order_id=order.id,
            product_id=UUID(it.product_id),
            qty=it.qty,
            price_at_order=None,
        )
        db.add(row)
        items_rows.append(row)

    db.commit()
    db.refresh(order)

    return OrderResponse(
        id=str(order.id),
        customer_id=str(order.customer_id),
        status=order.status,
        created_at=order.created_at,
        items=[
            OrderItemResponse(
                id=str(r.id),
                product_id=str(r.product_id),
                qty=r.qty,
                price_at_order=float(r.price_at_order) if r.price_at_order is not None else None,
            )
            for r in items_rows
        ],
    )


@router.get("/my", response_model=List[OrderResponse])
def my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_not_admin(current_user)

    orders = (
        db.query(Order)
        .filter(Order.customer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    result: List[OrderResponse] = []
    for o in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        result.append(
            OrderResponse(
                id=str(o.id),
                customer_id=str(o.customer_id),
                status=o.status,
                created_at=o.created_at,
                items=[
                    OrderItemResponse(
                        id=str(i.id),
                        product_id=str(i.product_id),
                        qty=i.qty,
                        price_at_order=float(i.price_at_order) if i.price_at_order is not None else None,
                    )
                    for i in items
                ],
            )
        )

    return result

