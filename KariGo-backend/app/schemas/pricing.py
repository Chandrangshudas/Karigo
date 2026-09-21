from pydantic import BaseModel


class PricingRequest(BaseModel):
    product_id: int
    material_cost: float
    labour_cost: float
    other_cost: float = 0


class PricingResponse(BaseModel):
    product_id: int
    total_cost: float
    suggested_min_price: float
    suggested_max_price: float
    message: str