from pydantic import BaseModel, Field
from typing import Optional

class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str  # "clothing" | "equipment"
    gender: Optional[str] = None  # "male" | "female" | None
    type: str = Field(min_length=1, max_length=60)
    quantity: int = Field(ge=0)
    availableQuantity: int = Field(ge=0)
    rentedQuantity: int = Field(ge=0)
    imageurl: Optional[str] = None

class ProductCreate(BaseModel):
    """הגדרה מפורשת ליצירת מוצר - כולל הכל"""
    name: str = Field(min_length=1, max_length=120)
    category: str
    gender: Optional[str] = None
    type: str = Field(min_length=1, max_length=60)
    quantity: int = Field(ge=0)
    availableQuantity: int = Field(ge=0)
    rentedQuantity: int = Field(ge=0)
    imageurl: Optional[str] = None  # <--- הנה הוא כאן, מפורש לגמרי!

class ProductUpdate(BaseModel):
    """משמש לעדכון מוצר - כל השדות אופציונליים"""
    name: Optional[str] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    type: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=0)
    availableQuantity: Optional[int] = Field(default=None, ge=0)
    rentedQuantity: Optional[int] = Field(default=None, ge=0)
    imageurl: Optional[str] = None

class ProductOut(ProductBase):
    """משמש להחזרת נתונים מה-API - כולל ID"""
    id: str