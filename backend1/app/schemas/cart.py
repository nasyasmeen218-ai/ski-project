from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID

class CartAddRequest(BaseModel):
    product_id: UUID
    qty: int = Field(gt=0)
    is_rental: bool = False
    rental_days: Optional[int] = 1

class CartUpdateQtyRequest(BaseModel):
    qty: int = Field(gt=0)

class CartItemResponse(BaseModel):
    id: str
    product_id: str
    qty: int
    product_name: str
    # השארתי את אלו בלי ברירת מחדל כדי להבטיח שהחישוב מה-API יעבור
    price: float
    rental_price: float
    is_rental: bool
    rental_days: int
    imageurl: Optional[str] = None
    available_qty: int
    is_available: bool
    max_qty_allowed: int

    class Config:
        from_attributes = True