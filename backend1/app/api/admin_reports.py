from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.session import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product

from app.schemas.reports import (
    ReportKpiResponse,
    TopProductsResponse,
    TopProductRow,
    CustomersReportResponse,
    CustomerRow,
)

router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])


def _parse_date(d: Optional[str]) -> Optional[datetime]:
    """
    Expect ISO string, e.g. 2026-02-03 or 2026-02-03T12:00:00
    """
    if not d:
        return None
    try:
        return datetime.fromisoformat(d)
    except Exception:
        return None


def _apply_date_filter(query, model_dt_col, from_date: Optional[datetime], to_date: Optional[datetime]):
    if from_date:
        query = query.filter(model_dt_col >= from_date)
    if to_date:
        query = query.filter(model_dt_col <= to_date)
    return query


@router.get("/kpi", response_model=ReportKpiResponse)
def report_kpi(
    from_date: Optional[str] = Query(default=None, description="ISO date/time"),
    to_date: Optional[str] = Query(default=None, description="ISO date/time"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    f = _parse_date(from_date)
    t = _parse_date(to_date)

    orders_q = db.query(Order.id, Order.customer_id).select_from(Order)
    orders_q = _apply_date_filter(orders_q, Order.created_at, f, t)

    orders_sub = orders_q.subquery()

    orders_count = db.query(func.count(orders_sub.c.id)).scalar() or 0
    unique_customers = db.query(func.count(func.distinct(orders_sub.c.customer_id))).scalar() or 0

    items_q = (
        db.query(func.coalesce(func.sum(OrderItem.qty), 0))
        .select_from(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
    )
    items_q = _apply_date_filter(items_q, Order.created_at, f, t)
    items_count = items_q.scalar() or 0

    return ReportKpiResponse(
        from_date=f,
        to_date=t,
        orders_count=int(orders_count),
        items_count=int(items_count),
        unique_customers=int(unique_customers),
    )


@router.get("/top-products", response_model=TopProductsResponse)
def top_products(
    limit: int = Query(default=10, ge=1, le=100),
    from_date: Optional[str] = Query(default=None),
    to_date: Optional[str] = Query(default=None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    f = _parse_date(from_date)
    t = _parse_date(to_date)

    q = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            Product.category.label("category"),
            Product.type.label("type"),
            func.coalesce(func.sum(OrderItem.qty), 0).label("total_qty"),
        )
        .select_from(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Product, Product.id == OrderItem.product_id)
    )

    q = _apply_date_filter(q, Order.created_at, f, t)

    q = (
        q.group_by(Product.id, Product.name, Product.category, Product.type)
        .order_by(desc("total_qty"))
        .limit(limit)
    )

    rows = q.all()

    return TopProductsResponse(
        from_date=f,
        to_date=t,
        rows=[
            TopProductRow(
                product_id=str(r.product_id),
                product_name=r.product_name,
                category=r.category,
                type=r.type,
                total_qty=int(r.total_qty or 0),
            )
            for r in rows
        ],
    )


@router.get("/customers", response_model=CustomersReportResponse)
def customers_report(
    limit: int = Query(default=25, ge=1, le=200),
    from_date: Optional[str] = Query(default=None),
    to_date: Optional[str] = Query(default=None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    f = _parse_date(from_date)
    t = _parse_date(to_date)

    # orders per customer
    orders_q = (
        db.query(
            Order.customer_id.label("customer_id"),
            func.count(Order.id).label("orders_count"),
        )
        .select_from(Order)
    )
    orders_q = _apply_date_filter(orders_q, Order.created_at, f, t)
    orders_q = orders_q.group_by(Order.customer_id).subquery()

    # items per customer
    items_q = (
        db.query(
            Order.customer_id.label("customer_id"),
            func.coalesce(func.sum(OrderItem.qty), 0).label("items_count"),
        )
        .select_from(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
    )
    items_q = _apply_date_filter(items_q, Order.created_at, f, t)
    items_q = items_q.group_by(Order.customer_id).subquery()

    # join with user
    q = (
        db.query(
            User.id.label("customer_id"),
            User.username.label("username"),
            func.coalesce(orders_q.c.orders_count, 0).label("orders_count"),
            func.coalesce(items_q.c.items_count, 0).label("items_count"),
        )
        .select_from(User)
        .join(orders_q, orders_q.c.customer_id == User.id, isouter=True)
        .join(items_q, items_q.c.customer_id == User.id, isouter=True)
        .filter(User.role != "admin")
        .order_by(desc("orders_count"), desc("items_count"), User.username.asc())
        .limit(limit)
    )

    rows = q.all()

    return CustomersReportResponse(
        from_date=f,
        to_date=t,
        rows=[
            CustomerRow(
                customer_id=str(r.customer_id),
                username=r.username,
                orders_count=int(r.orders_count or 0),
                items_count=int(r.items_count or 0),
            )
            for r in rows
        ],
    )
