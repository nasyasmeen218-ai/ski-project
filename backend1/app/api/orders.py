from typing import List, Dict
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


def _ensure_customer(user: User):
    if user.role != "customer":
        raise HTTPException(status_code=403, detail="Customers only")


@router.post("", response_model=OrderResponse)
def create_order(
    payload: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_customer(current_user)

    if not payload.items:
        raise HTTPException(status_code=400, detail="Order must contain items")

    try:
        product_ids = [UUID(i.product_id) for i in payload.items]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product_id format")

    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    products_map = {str(p.id): p for p in products}

    for item in payload.items:
        if item.product_id not in products_map:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")

        product = products_map[item.product_id]
        if item.qty > int(product.available_quantity or 0):
            raise HTTPException(status_code=409, detail="Not enough stock")

    order = Order(customer_id=current_user.id, status="pending")
    db.add(order)
    db.flush()

    order_items = [
        OrderItem(
            order_id=order.id,
            product_id=UUID(item.product_id),
            qty=item.qty,
            price_at_order=None,
        )
        for item in payload.items
    ]
    db.add_all(order_items)

    db.commit()
    db.refresh(order)

    return OrderResponse(
        id=str(order.id),
        customer_id=str(order.customer_id),
        status=order.status,
        created_at=order.created_at,
        items=[
            OrderItemResponse(
                id=str(oi.id),
                product_id=str(oi.product_id),
                qty=oi.qty,
                price_at_order=oi.price_at_order,
            )
            for oi in order_items
        ],
    )


@router.get("/my", response_model=List[OrderResponse])
def my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_customer(current_user)

    orders = (
        db.query(Order)
        .filter(Order.customer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    if not orders:
        return []

    order_ids = [o.id for o in orders]
    items = db.query(OrderItem).filter(OrderItem.order_id.in_(order_ids)).all()

    items_map: Dict[UUID, list[OrderItem]] = {}
    for item in items:
        items_map.setdefault(item.order_id, []).append(item)

    return [
        OrderResponse(
            id=str(order.id),
            customer_id=str(order.customer_id),
            status=order.status,
            created_at=order.created_at,
            items=[
                OrderItemResponse(
                    id=str(i.id),
                    product_id=str(i.product_id),
                    qty=i.qty,
                    price_at_order=i.price_at_order,
                )
                for i in items_map.get(order.id, [])
            ],
        )
        for order in orders
    ]
