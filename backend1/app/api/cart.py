from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import require_customer
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


def _build_cart_item_response(ci: CartItem, p: Product) -> CartItemResponse:
    available_qty = int(p.available_quantity or 0)
    max_qty_allowed = available_qty
    is_available = available_qty > 0

    return CartItemResponse(
        id=str(ci.id),
        product_id=str(ci.product_id),
        qty=ci.qty,
        product_name=p.name,
        available_qty=available_qty,
        is_available=is_available,
        max_qty_allowed=max_qty_allowed,
    )


@router.get("", response_model=list[CartItemResponse])
def get_my_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    rows = (
        db.query(CartItem, Product)
        .join(Product, Product.id == CartItem.product_id)
        .filter(CartItem.customer_id == current_user.id)
        .order_by(CartItem.created_at.desc())
        .all()
    )

    result = []
    for (ci, p) in rows:
        available_qty, is_available, max_qty_allowed = _product_availability_payload(p)
        result.append(
            CartItemResponse(
                id=str(ci.id),
                product_id=str(ci.product_id),
                qty=ci.qty,
                product_name=p.name,
                price=float(p.price or 0.0),  # <--- הוספנו מחיר
                imageurl=p.imageurl,          # <--- הוספנו תמונה
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
    current_user: User = Depends(require_customer),
):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    available = int(product.available_quantity or 0)
    if available <= 0:
        raise HTTPException(status_code=409, detail="Product is not available")

    existing = (
        db.query(CartItem)
        .filter(
            and_(
                CartItem.customer_id == current_user.id,
                CartItem.product_id == payload.product_id,
            )
        )
        .first()
    )

    if existing:
        new_qty = existing.qty + payload.qty
        if new_qty > available:
            raise HTTPException(
                status_code=409,
                detail=f"Not enough stock. Requested {new_qty}, available {available}",
            )
        existing.qty = new_qty
        db.add(existing)
        db.commit()
        db.refresh(existing)

        available_qty, is_available, max_qty_allowed = _product_availability_payload(product)
        return CartItemResponse(
            id=str(existing.id),
            product_id=str(existing.product_id),
            qty=existing.qty,
            product_name=product.name,
            price=float(product.price or 0.0), # <--- כאן
            imageurl=product.imageurl,         # <--- וכאן
            available_qty=available_qty,
            is_available=is_available,
            max_qty_allowed=max_qty_allowed,
        )

    if payload.qty > available_qty:
        raise HTTPException(
            status_code=409,
            detail=f"Not enough stock. Requested {payload.qty}, available {available}",
        )

    row = CartItem(
        customer_id=current_user.id,
        product_id=payload.product_id,
        qty=payload.qty,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    available_qty, is_available, max_qty_allowed = _product_availability_payload(product)
    return CartItemResponse(
        id=str(row.id),
        product_id=str(row.product_id),
        qty=row.qty,
        product_name=product.name,
        price=float(product.price or 0.0), # <--- כאן
        imageurl=product.imageurl,         # <--- וכאן
        available_qty=available_qty,
        is_available=is_available,
        max_qty_allowed=max_qty_allowed,
    )


@router.patch("/{cart_item_id}", response_model=CartItemResponse)
def update_cart_item_qty(
    cart_item_id: UUID,
    payload: CartUpdateQtyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
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
    if available <= 0:
        raise HTTPException(status_code=409, detail="Product is not available")

    if payload.qty > available:
        raise HTTPException(
            status_code=409,
            detail=f"Not enough stock. Requested {payload.qty}, available {available}",
        )

    row.qty = payload.qty
    db.add(row)
    db.commit()
    db.refresh(row)

    available_qty, is_available, max_qty_allowed = _product_availability_payload(product)
    return CartItemResponse(
        id=str(row.id),
        product_id=str(row.product_id),
        qty=row.qty,
        product_name=product.name,
        price=float(product.price or 0.0), # <--- כאן
        imageurl=product.imageurl,         # <--- וכאן
        available_qty=available_qty,
        is_available=is_available,
        max_qty_allowed=max_qty_allowed,
    )


@router.delete("/{cart_item_id}")
def delete_cart_item(
    cart_item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
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
    current_user: User = Depends(require_customer),
):
    # 1) load cart
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

        available = int(p.available_quantity or 0)
        if available <= 0:
            raise HTTPException(status_code=409, detail=f"Product is not available: {p.name}")

        if ci.qty > available:
            raise HTTPException(
                status_code=409,
                detail=f"Not enough stock for {p.name}. Requested {ci.qty}, available {available}",
            )

    try:
        order = Order(customer_id=current_user.id, status="pending")
        db.add(order)
        db.flush()  # order.id

        items_rows: list[OrderItem] = []

        for ci in cart_rows:
            p = products_map[ci.product_id]

            p.available_quantity = int(p.available_quantity or 0) - ci.qty
            p.rented_quantity = int(p.rented_quantity or 0) + ci.qty

            oi = OrderItem(
                order_id=order.id,
                product_id=ci.product_id,
                qty=ci.qty,
                price_at_order=p.price, # <--- שומרים את המחיר האמיתי בהזמנה
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
                    price_at_order=float(r.price_at_order) if r.price_at_order is not None else 0.0,
                )
                for r in items_rows
            ],
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")