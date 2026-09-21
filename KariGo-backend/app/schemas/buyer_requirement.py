from pydantic import BaseModel
from typing import Optional


class BuyerRequirementCreate(BaseModel):
    title: str
    description: Optional[str] = None

    category: Optional[str] = None
    material: Optional[str] = None
    region: Optional[str] = None

    min_price: Optional[float] = None
    max_price: Optional[float] = None

    quantity_required: Optional[int] = None


class BuyerRequirementResponse(BaseModel):
    id: int
    buyer_id: int

    title: str
    description: Optional[str] = None

    category: Optional[str] = None
    material: Optional[str] = None
    region: Optional[str] = None

    min_price: Optional[float] = None
    max_price: Optional[float] = None

    quantity_required: Optional[int] = None
    status: str

    class Config:
        from_attributes = True