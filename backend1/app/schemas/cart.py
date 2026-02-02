from pydantic import BaseModel, Field
from typing import Optional


class CartAddRequest(BaseModel):
    product_id: str
    qty: int = Field(..., gt=0)


class CartUpdateQtyRequest(BaseModel):
    qty: int = Field(..., gt=0)


class CartItemResponse(BaseModel):
    id: str
    product_id: str
    qty: int
    product_name: Optional[str] = None
