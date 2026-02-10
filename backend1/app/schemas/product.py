from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


# ===== Requests =====
class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str  # "clothing" | "equipment"
    gender: Optional[str] = None  # "male" | "female" | "unisex" | None
    type: str = Field(min_length=1, max_length=60)
    price: float = Field(ge=0)
    rental_price: Optional[float] = Field(default=0.0, ge=0)
    quantity: int = Field(ge=0)
    availableQuantity: int = Field(ge=0)
    rentedQuantity: int = Field(ge=0)

    imageurl: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    type: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    rental_price: Optional[float] = Field(default=None, ge=0)
    quantity: Optional[int] = Field(default=None, ge=0)
    availableQuantity: Optional[int] = Field(default=None, ge=0)
    rentedQuantity: Optional[int] = Field(default=None, ge=0)

    imageurl: Optional[str] = None


# ===== Response =====
class ProductResponse(BaseModel):
    id: UUID
    name: str
    category: str
    gender: Optional[str] = None
    type: str
    price: float
    rental_price: Optional[float] = 0.0
    quantity: int
    availableQuantity: int
    rentedQuantity: int
    imageurl: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    is_available: bool
    max_qty_allowed: int
