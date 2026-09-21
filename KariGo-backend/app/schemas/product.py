from pydantic import BaseModel
from typing import Optional


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    material: Optional[str] = None
    region: Optional[str] = None
    price: Optional[float] = None
    quantity: int = 1
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    artisan_id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    material: Optional[str]
    region: Optional[str]
    price: Optional[float]
    quantity: int
    image_url: Optional[str]

    class Config:
        from_attributes = True

class ProductStockUpdate(BaseModel):
    quantity: int