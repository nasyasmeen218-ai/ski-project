from __future__ import annotations

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

from app.schemas.cart import (
    CartAddRequest,
    CartUpdateQtyRequest,
    CartItemResponse,
)
from app.schemas.order import OrderResponse, OrderItemResponse

router = APIRouter(prefix="/cart", tags=["cart"])


def _product_availability_payload(p: Product):
    available_qty = int(p.available_quantity or 0)
    is_available = available_qty > 0
    max_qty_allowed = max(available_qty, 0)
    return available_qty, is_available, max_qty_allowed


def _ensure_customer(user: User) -> User:
    role = getattr(user, "role", None)
    if role != "customer":
        raise HTTPException(
            status_code=403,
            detail=f"Cart is available for customers only. Your role: {role}",
        )
    return user


def _safe_uuid(val) -> UUID:
    try:
        return val if isinstance(val, UUID) else UUID(str(val))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product_id format")


def _cart_item_display_price(ci: CartItem, p: Product) -> float:
    if bool(getattr(ci, "is_rental", False)):
        days = int(getattr(ci, "rental_days", 1) or 1)
        return float(p.rental_price or 0.0) * days
    return float(p.price or 0.0)


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
        .order_by(CartItem.created_at.desc())
        .all()
    )

    result: list[CartItemResponse] = []
    for (ci, p) in rows:
        available_qty, is_available, max_qty_allowed = _product_availability_payload(p)

        result.append(
            CartItemResponse(
                id=str(ci.id),
                product_id=str(ci.product_id),
                qty=int(ci.qty or 0),
                product_name=p.name,
                price=_cart_item_display_price(ci, p),
                rental_price=float(p.rental_price or 0.0),
                is_rental=bool(getattr(ci, "is_rental", False)),
                rental_days=int(getattr(ci, "rental_days", 1) or 1),
                imageurl=p.imageurl,
                available_qty=available_qty,
                is_available=is_available,
                max_qty_allowed=max_qty_allowed,
            )
        )
    return result


@router.post("", response_model=CartItemResponse)
def add_to_cart(
    payload: CartAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user = _ensure_customer(current_user)

    product_id = _safe_uuid(payload.product_id)

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    available = int(product.available_quantity or 0)
    if available <= 0:
        raise HTTPException(status_code=409, detail="Product is not available")

    req_qty = int(payload.qty or 0)
    if req_qty <= 0:
        raise HTTPException(status_code=400, detail="qty must be >= 1")

    is_rental = bool(payload.is_rental)
    rental_days = int(payload.rental_days or 1)
    if rental_days < 1:
        rental_days = 1

    # הפרדה בין השכרה לקנייה
    existing = (
        db.query(CartItem)
        .filter(
            and_(
                CartItem.customer_id == current_user.id,
                CartItem.product_id == product_id,
                CartItem.is_rental == is_rental,
            )
        )
        .first()
    )

    if existing:
        new_qty = int(existing.qty or 0) + req_qty
        if new_qty > available:
            raise HTTPException(
                status_code=409,
                detail=f"Not enough stock. Requested {new_qty}, available {available}",
            )
        existing.qty = new_qty
        existing.is_rental = is_rental
        existing.rental_days = rental_days

        # ✅ חשוב: לא להשאיר NULL בעמודה rental_price (אם קיימת והיא NOT NULL)
        existing.rental_price = float(product.rental_price or 0.0)

        db.add(existing)
        db.commit()
        db.refresh(existing)
        row_to_return = existing

    else:
        if req_qty > available:
            raise HTTPException(
                status_code=409,
                detail=f"Not enough stock. Requested {req_qty}, available {available}",
            )

        row_to_return = CartItem(
            customer_id=current_user.id,
            product_id=product_id,
            qty=req_qty,
            is_rental=is_rental,
            rental_days=rental_days,
            # ✅ חשוב: לא להשאיר NULL
            rental_price=float(product.rental_price or 0.0),
        )
        db.add(row_to_return)
        db.commit()
        db.refresh(row_to_return)

    available_qty, is_available, max_qty_allowed = _product_availability_payload(product)

    return CartItemResponse(
        id=str(row_to_return.id),
        product_id=str(row_to_return.product_id),
        qty=int(row_to_return.qty or 0),
        product_name=product.name,
        price=_cart_item_display_price(row_to_return, product),
        rental_price=float(product.rental_price or 0.0),
        is_rental=bool(getattr(row_to_return, "is_rental", False)),
        rental_days=int(getattr(row_to_return, "rental_days", 1) or 1),
        imageurl=product.imageurl,
        available_qty=available_qty,
        is_available=is_available,
        max_qty_allowed=max_qty_allowed,
    )


@router.patch("/{cart_item_id}", response_model=CartItemResponse)
def update_cart_item_qty(
    cart_item_id: UUID,
    payload: CartUpdateQtyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user = _ensure_customer(current_user)

    row = (
        db.query(CartItem)
        .filter(and_(CartItem.id == cart_item_id, CartItem.customer_id == current_user.id))
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Cart item not found")

    product = db.query(Product).filter(Product.id == row.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    available = int(product.available_quantity or 0)
    new_qty = int(payload.qty or 0)
    if new_qty <= 0:
        raise HTTPException(status_code=400, detail="qty must be >= 1")

    if new_qty > available:
        raise HTTPException(
            status_code=409,
            detail=f"Not enough stock. Requested {new_qty}, available {available}",
        )

    row.qty = new_qty

    # ✅ גם כאן: לוודא rental_price לא NULL אם יש NOT NULL בטבלה
    if hasattr(row, "rental_price"):
        row.rental_price = float(product.rental_price or 0.0)

    db.add(row)
    db.commit()
    db.refresh(row)

    available_qty, is_available, max_qty_allowed = _product_availability_payload(product)

    return CartItemResponse(
        id=str(row.id),
        product_id=str(row.product_id),
        qty=int(row.qty or 0),
        product_name=product.name,
        price=_cart_item_display_price(row, product),
        rental_price=float(product.rental_price or 0.0),
        is_rental=bool(getattr(row, "is_rental", False)),
        rental_days=int(getattr(row, "rental_days", 1) or 1),
        imageurl=product.imageurl,
        available_qty=available_qty,
        is_available=is_available,
        max_qty_allowed=max_qty_allowed,
    )


@router.delete("/{cart_item_id}")
def delete_cart_item(
    cart_item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user = _ensure_customer(current_user)

    row = (
        db.query(CartItem)
        .filter(and_(CartItem.id == cart_item_id, CartItem.customer_id == current_user.id))
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(row)
    db.commit()
    return {"ok": True}


@router.post("/checkout", response_model=OrderResponse)
def checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user = _ensure_customer(current_user)

    cart_rows = db.query(CartItem).filter(CartItem.customer_id == current_user.id).all()
    if not cart_rows:
        raise HTTPException(status_code=400, detail="Cart is empty")

    product_ids = [r.product_id for r in cart_rows]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    products_map = {p.id: p for p in products}

    for ci in cart_rows:
        p = products_map.get(ci.product_id)
        if not p:
            raise HTTPException(status_code=404, detail=f"Product not found: {ci.product_id}")
        if int(p.available_quantity or 0) < int(ci.qty or 0):
            raise HTTPException(status_code=409, detail=f"Not enough stock for {p.name}")

    try:
        order = Order(customer_id=current_user.id, status="pending")
        db.add(order)
        db.flush()

        items_rows: list[OrderItem] = []
        for ci in cart_rows:
            p = products_map[ci.product_id]
            qty = int(ci.qty or 0)

            p.available_quantity = int(p.available_quantity or 0) - qty

            if bool(getattr(ci, "is_rental", False)):
                p.rented_quantity = int(p.rented_quantity or 0) + qty
                days = int(getattr(ci, "rental_days", 1) or 1)
                final_item_price = float(p.rental_price or 0.0) * days
            else:
                final_item_price = float(p.price or 0.0)

            oi = OrderItem(
                order_id=order.id,
                product_id=ci.product_id,
                qty=qty,
                price_at_order=final_item_price,
                is_rental=bool(getattr(ci, "is_rental", False)),
                rental_days=int(getattr(ci, "rental_days", 1) or 1),
            )
            db.add(oi)
            items_rows.append(oi)

        for ci in cart_rows:
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
                    id=str(r.id),
                    product_id=str(r.product_id),
                    qty=r.qty,
                    price_at_order=float(r.price_at_order or 0.0),
                    is_rental=bool(r.is_rental),
                    rental_days=r.rental_days,
                )
                for r in items_rows
            ],
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")
