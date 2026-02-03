from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


# -------------------------
# Requests
# -------------------------

class ProductCreate(BaseModel):
    """יצירת מוצר"""
    name: str = Field(min_length=1, max_length=120)
    category: str  # "clothing" | "equipment"
    gender: Optional[str] = None  # "male" | "female" | None
    type: str = Field(min_length=1, max_length=60)

    quantity: int = Field(ge=0)
    available_quantity: int = Field(ge=0)
    rented_quantity: int = Field(ge=0)

    imageurl: Optional[str] = None


class ProductUpdate(BaseModel):
    """עדכון מוצר - כל השדות אופציונליים"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    category: Optional[str] = None
    gender: Optional[str] = None
    type: Optional[str] = Field(default=None, min_length=1, max_length=60)

    quantity: Optional[int] = Field(default=None, ge=0)
    available_quantity: Optional[int] = Field(default=None, ge=0)
    rented_quantity: Optional[int] = Field(default=None, ge=0)

    imageurl: Optional[str] = None


# -------------------------
# Responses
# -------------------------

class ProductResponse(BaseModel):
    id: UUID
    name: str
    category: Optional[str] = None
    gender: Optional[str] = None
    type: Optional[str] = None

    quantity: int
    available_quantity: int
    rented_quantity: int

    imageurl: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # ✅ NEW (לפרונט)
    is_available: bool
    max_qty_allowed: int

    class Config:
        from_attributes = True
