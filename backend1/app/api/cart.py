from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.cart_item import CartItem
from app.models.order import Order
from app.models.order_item import OrderItem

from app.schemas.cart import CartAddRequest, CartUpdateQtyRequest, CartItemResponse
from app.schemas.order import OrderResponse, OrderItemResponse

router = APIRouter(prefix="/cart", tags=["cart"])


def _ensure_customer(user: User):
    if user.role != "customer":
        raise HTTPException(status_code=403, detail="Customers only")
    return user


def _get_product_availability(product: Product):
    available_quantity = int(product.available_quantity or 0)
    return (
        available_quantity,
        available_quantity > 0,
        max(available_quantity, 0),
    )


def _calculate_cart_price(cart_item: CartItem, product: Product) -> float:
    if cart_item.is_rental:
        days = int(cart_item.rental_days or 1)
        return float(product.rental_price or 0) * days
    return float(product.price or 0)


@router.get("", response_model=list[CartItemResponse])
def get_my_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user = _ensure_customer(current_user)

    rows = (
        db.query(CartItem, Product)
        .join(Product, Product.id == CartItem.product_id)
        .filter(CartItem.customer_id == current_user.id)
        .all()
    )

    result = []
    for cart_item, product in rows:
        available_qty, is_available, max_qty = _get_product_availability(product)

        result.append(
            CartItemResponse(
                id=str(cart_item.id),
                product_id=str(cart_item.product_id),
                qty=cart_item.qty,
                product_name=product.name,
                price=_calculate_cart_price(cart_item, product),
                rental_price=float(product.rental_price or 0),
                is_rental=cart_item.is_rental,
                rental_days=cart_item.rental_days,
                imageurl=product.imageurl,
                available_qty=available_qty,
                is_available=is_available,
                max_qty_allowed=max_qty,
            )
        )

    return result


@router.post("/checkout", response_model=OrderResponse)
def checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user = _ensure_customer(current_user)

    cart_items = db.query(CartItem).filter(CartItem.customer_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    product_ids = [ci.product_id for ci in cart_items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    products_map = {p.id: p for p in products}

    order = Order(customer_id=current_user.id, status="pending")
    db.add(order)
    db.flush()

    order_items = []

    for ci in cart_items:
        product = products_map.get(ci.product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        if ci.qty > int(product.available_quantity or 0):
            raise HTTPException(status_code=409, detail="Not enough stock")

        product.available_quantity -= ci.qty

        price = (
            float(product.rental_price or 0) * ci.rental_days
            if ci.is_rental
            else float(product.price or 0)
        )

        order_items.append(
            OrderItem(
                order_id=order.id,
                product_id=ci.product_id,
                qty=ci.qty,
                price_at_order=price,
                is_rental=ci.is_rental,
                rental_days=ci.rental_days,
            )
        )

    db.add_all(order_items)

    for ci in cart_items:
        db.delete(ci)

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
                is_rental=oi.is_rental,
                rental_days=oi.rental_days,
            )
            for oi in order_items
        ],
    )
