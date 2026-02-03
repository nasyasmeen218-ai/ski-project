from pydantic import BaseModel, Field
from uuid import UUID


class CartAddRequest(BaseModel):
    product_id: UUID
    qty: int = Field(gt=0)


class CartUpdateQtyRequest(BaseModel):
    qty: int = Field(gt=0)


class CartItemResponse(BaseModel):
    id: str
    product_id: str
    qty: int
    product_name: str

    # NEW - כדי לפרונט יהיה קל
    available_qty: int
    is_available: bool
    max_qty_allowed: int
