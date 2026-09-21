from pydantic import BaseModel


class OrderCreate(BaseModel):
    product_id: int
    requirement_id: int
    quantity: int
    unit_price: float


class OrderResponse(BaseModel):
    id: int
    buyer_id: int
    artisan_id: int
    product_id: int
    requirement_id: int
    quantity: int
    unit_price: float
    total_price: float
    status: str

    class Config:
        from_attributes = True