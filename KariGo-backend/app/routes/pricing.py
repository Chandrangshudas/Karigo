from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.pricing import PricingSuggestion
from app.schemas.pricing import (
    PricingRequest,
    PricingResponse
)


router = APIRouter(
    prefix="/api/pricing",
    tags=["AI Pricing"]
)


@router.post(
    "/suggest",
    response_model=PricingResponse
)
def suggest_price(
    request: PricingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can use pricing assistant"
        )

    product = db.query(Product).filter(
        Product.id == request.product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product.artisan_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only price your own products"
        )

    if request.material_cost < 0:
        raise HTTPException(
            status_code=400,
            detail="Material cost cannot be negative"
        )

    if request.labour_cost < 0:
        raise HTTPException(
            status_code=400,
            detail="Labour cost cannot be negative"
        )

    if request.other_cost < 0:
        raise HTTPException(
            status_code=400,
            detail="Other cost cannot be negative"
        )

    total_cost = (
        request.material_cost
        + request.labour_cost
        + request.other_cost
    )

    # Simple MVP pricing model
    suggested_min = total_cost * 1.20
    suggested_max = total_cost * 1.50

    suggestion = PricingSuggestion(
        product_id=product.id,
        artisan_id=current_user.id,
        material_cost=request.material_cost,
        labour_cost=request.labour_cost,
        other_cost=request.other_cost,
        total_cost=total_cost,
        suggested_min_price=suggested_min,
        suggested_max_price=suggested_max,
        status="SUGGESTED"
    )

    db.add(suggestion)
    db.commit()
    db.refresh(suggestion)

    return {
        "product_id": product.id,
        "total_cost": total_cost,
        "suggested_min_price": round(
            suggested_min, 2
        ),
        "suggested_max_price": round(
            suggested_max, 2
        ),
        "message": "Price suggestion generated. Artisan decides the final price."
    }