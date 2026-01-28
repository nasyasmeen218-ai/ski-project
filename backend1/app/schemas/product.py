from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str  # "clothing" | "equipment"
    gender: str | None = None  # "male" | "female" | None
    type: str = Field(min_length=1, max_length=60)
    quantity: int = Field(ge=0)
    availableQuantity: int = Field(ge=0)
    rentedQuantity: int = Field(ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    gender: str | None = None
    type: str | None = None
    quantity: int | None = Field(default=None, ge=0)
    availableQuantity: int | None = Field(default=None, ge=0)
    rentedQuantity: int | None = Field(default=None, ge=0)


class ProductOut(ProductBase):
    id: str

class ProductCreate(BaseModel):
    name: str
    category: str
    gender: str | None = None
    type: str
    quantity: int = Field(ge=0)
    availableQuantity: int = Field(ge=0)
    rentedQuantity: int = Field(ge=0)