from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from uuid import UUID

from app.db.session import get_db
from app.core.security import get_current_user

from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.cart_item import CartItem

from app.schemas.cart import (
    CartAddRequest,
    CartUpdateQtyRequest,
    CartItemResponse,
)
from app.schemas.order import OrderResponse, OrderItemResponse

router = APIRouter(prefix="/cart", tags=["cart"])


def _ensure_not_admin(user: User):
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot use cart")


def _availability_fields(p: Product, requested_qty: int | None = None):
    """
    מחזיר:
    - available_qty: כמה יש בפועל
    - is_available: האם ניתן להזמין בכלל
    - max_qty_allowed: מה המקסימום המותר (0 אם אין מלאי)
    """
    available_qty = int(getattr(p, "available_quantity", 0) or 0)
    is_available = available_qty > 0
    max_qty_allowed = available_qty if is_available else 0

    # אם המשתמש כבר ביקש כמות, אפשר להחזיר גם "עד כמה מותר" ביחס לבקשה
    # אבל בפועל אנחנו מחזירים תמיד לפי המלאי
    return available_qty, is_available, max_qty_allowed


@router.get("", response_model=list[CartItemResponse])
def get_my_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_not_admin(current_user)

    rows = (
        db.query(CartItem, Product)
        .join(Product, Product.id == CartItem.product_id)
        .filter(CartItem.customer_id == current_user.id)
        .order_by(CartItem.created_at.desc())
        .all()
    )

    result: list[CartItemResponse] = []
    for (ci, p) in rows:
        available_qty, is_available, max_qty_allowed = _availability_fields(p)
        result.append(
            CartItemResponse(
                id=str(ci.id),
                product_id=str(ci.product_id),
                qty=ci.qty,
                product_name=p.name,
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
    _ensure_not_admin(current_user)

    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    available_qty, is_available, max_qty_allowed = _availability_fields(product)

    # ✅ אם אין מלאי בכלל — לא מאפשרים להוסיף לעגלה
    if not is_available:
        raise HTTPException(status_code=409, detail="Product is not available")

    # אם כבר קיים אותו מוצר בעגלה - upsert
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

    new_qty = payload.qty + (existing.qty if existing else 0)

    # ✅ לא מאפשרים לעבור את המלאי
    if new_qty > max_qty_allowed:
        raise HTTPException(
            status_code=409,
            detail=f"Not enough stock. Max allowed: {max_qty_allowed}",
        )

    if existing:
        existing.qty = new_qty
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return CartItemResponse(
            id=str(existing.id),
            product_id=str(existing.product_id),
            qty=existing.qty,
            product_name=product.name,
            available_qty=available_qty,
            is_available=is_available,
            max_qty_allowed=max_qty_allowed,
        )

    row = CartItem(
        customer_id=current_user.id,
        product_id=payload.product_id,
        qty=payload.qty,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    return CartItemResponse(
        id=str(row.id),
        product_id=str(row.product_id),
        qty=row.qty,
        product_name=product.name,
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
    _ensure_not_admin(current_user)

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

    available_qty, is_available, max_qty_allowed = _availability_fields(product)

    # ✅ אם המוצר לא זמין — לא מאפשרים לשנות כמות
    if not is_available:
        raise HTTPException(status_code=409, detail="Product is not available")

    if payload.qty > max_qty_allowed:
        raise HTTPException(status_code=409, detail=f"Not enough stock. Max allowed: {max_qty_allowed}")

    row.qty = payload.qty
    db.add(row)
    db.commit()
    db.refresh(row)

    return CartItemResponse(
        id=str(row.id),
        product_id=str(row.product_id),
        qty=row.qty,
        product_name=product.name,
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
    _ensure_not_admin(current_user)

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
    _ensure_not_admin(current_user)

    cart_rows = db.query(CartItem).filter(CartItem.customer_id == current_user.id).all()
    if not cart_rows:
        raise HTTPException(status_code=400, detail="Cart is empty")

    try:
        product_ids = [r.product_id for r in cart_rows]

        # ✅ נועלים את המוצרים כדי שלא יהיו בעיות במקביל
        products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids))
            .with_for_update()
            .all()
        )
        products_map = {str(p.id): p for p in products}

        # ✅ בדיקת מלאי לפני טרנזקציה
        for ci in cart_rows:
            p = products_map.get(str(ci.product_id))
            if not p:
                raise HTTPException(status_code=404, detail=f"Product not found: {ci.product_id}")

            available_qty = int(getattr(p, "available_quantity", 0) or 0)
            if available_qty <= 0:
                raise HTTPException(status_code=409, detail=f"Product is not available: {p.name}")

            if ci.qty > available_qty:
                raise HTTPException(
                    status_code=409,
                    detail=f"Not enough stock for {p.name}. Requested {ci.qty}, available {available_qty}",
                )

        # ✅ יצירת הזמנה
        order = Order(customer_id=current_user.id, status="pending")
        db.add(order)
        db.flush()

        items_rows: list[OrderItem] = []

        for ci in cart_rows:
            p = products_map[str(ci.product_id)]

            # ✅ כאן התיקון של ה-CHECK:
            # quantity = available_quantity + rented_quantity
            # אז לא נוגעים ב-quantity בכלל.
            p.available_quantity = int(p.available_quantity) - ci.qty
            p.rented_quantity = int(p.rented_quantity) + ci.qty

            oi = OrderItem(
                order_id=order.id,
                product_id=ci.product_id,
                qty=ci.qty,
                price_at_order=None,
            )
            db.add(oi)
            items_rows.append(oi)

        # ניקוי עגלה
        db.query(CartItem).filter(CartItem.customer_id == current_user.id).delete()

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

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")
