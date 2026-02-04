from typing import Optional
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
    product_name: Optional[str] = "Unknown Product" 
    price: float = 0.0                            
    imageurl: Optional[str] = None
    available_qty: int = 0
    is_available: bool = False
    max_qty_allowed: int = 0

    class Config:
        from_attributes = True