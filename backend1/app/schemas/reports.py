from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ReportKpiResponse(BaseModel):
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    orders_count: int
    items_count: int
    unique_customers: int


class TopProductRow(BaseModel):
    product_id: str
    product_name: str
    category: Optional[str] = None
    type: Optional[str] = None
    total_qty: int


class TopProductsResponse(BaseModel):
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    rows: List[TopProductRow]


class CustomerRow(BaseModel):
    customer_id: str
    username: str
    orders_count: int
    items_count: int


class CustomersReportResponse(BaseModel):
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    rows: List[CustomerRow]
