from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.cart_item import CartItem
from app.schemas.cart import CartAddRequest, CartUpdateQtyRequest, CartItemResponse

router = APIRouter(prefix="/cart", tags=["cart"])


def _ensure_not_admin(user: User):
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot use cart")


@router.get("", response_model=list[CartItemResponse])
def get_my_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_not_admin(current_user)

    items = db.query(CartItem).filter(CartItem.customer_id == current_user.id).all()

    # join product names (nice for UI)
    product_ids = [i.product_id for i in items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all() if product_ids else []
    name_map = {p.id: p.name for p in products}

    return [
        CartItemResponse(
            id=str(i.id),
            product_id=str(i.product_id),
            qty=i.qty,
            product_name=name_map.get(i.product_id),
        )
        for i in items
    ]


@router.post("", response_model=CartItemResponse)
def add_to_cart(
    payload: CartAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_not_admin(current_user)

    # validate UUID
    try:
        pid = UUID(payload.product_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product_id format")

    product = db.query(Product).filter(Product.id == pid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # if already in cart -> increment qty
    existing = (
        db.query(CartItem)
        .filter(CartItem.customer_id == current_user.id, CartItem.product_id == pid)
        .first()
    )

    if existing:
        existing.qty += payload.qty
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return CartItemResponse(
            id=str(existing.id),
            product_id=str(existing.product_id),
            qty=existing.qty,
            product_name=product.name,
        )

    item = CartItem(
        customer_id=current_user.id,
        product_id=pid,
        qty=payload.qty,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return CartItemResponse(
        id=str(item.id),
        product_id=str(item.product_id),
        qty=item.qty,
        product_name=product.name,
    )


@router.patch("/{cart_item_id}", response_model=CartItemResponse)
def update_cart_item_qty(
    cart_item_id: str,
    payload: CartUpdateQtyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_not_admin(current_user)

    item = db.query(CartItem).filter(CartItem.id == cart_item_id).first()
    if not item or item.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    item.qty = payload.qty
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)

    product = db.query(Product).filter(Product.id == item.product_id).first()
    return CartItemResponse(
        id=str(item.id),
        product_id=str(item.product_id),
        qty=item.qty,
        product_name=product.name if product else None,
    )


@router.delete("/{cart_item_id}")
def delete_cart_item(
    cart_item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_not_admin(current_user)

    item = db.query(CartItem).filter(CartItem.id == cart_item_id).first()
    if not item or item.customer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()
    return {"ok": True}
