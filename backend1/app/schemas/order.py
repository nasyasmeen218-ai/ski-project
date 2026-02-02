from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional


class OrderItemCreate(BaseModel):
    product_id: str
    qty: int = Field(..., gt=0)


class OrderCreateRequest(BaseModel):
    items: List[OrderItemCreate]


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    qty: int
    price_at_order: Optional[float] = None


class OrderResponse(BaseModel):
    id: str
    customer_id: str
    status: str
    created_at: datetime
    items: List[OrderItemResponse]
