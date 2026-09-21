from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.buyer_requirement import BuyerRequirement
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/api/matching",
    tags=["Matching"]
)


@router.get("/requirement/{requirement_id}")
def match_products(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Find buyer requirement
    requirement = db.query(BuyerRequirement).filter(
        BuyerRequirement.id == requirement_id
    ).first()

    if not requirement:
        raise HTTPException(
            status_code=404,
            detail="Buyer requirement not found"
        )

    products = db.query(Product).all()

    matches = []

    for product in products:

        score = 0
        matched_fields = []

        # 1. Category match
        if (
            requirement.category
            and product.category
            and requirement.category.lower() == product.category.lower()
        ):
            score += 20
            matched_fields.append("category")

        # 2. Material match
        if (
            requirement.material
            and product.material
            and requirement.material.lower() == product.material.lower()
        ):
            score += 20
            matched_fields.append("material")

        # 3. Region match
        if (
            requirement.region
            and product.region
            and requirement.region.lower() == product.region.lower()
        ):
            score += 20
            matched_fields.append("region")

        # 4. Price match
        if product.price is not None:

            price_ok = True

            if (
                requirement.min_price is not None
                and product.price < requirement.min_price
            ):
                price_ok = False

            if (
                requirement.max_price is not None
                and product.price > requirement.max_price
            ):
                price_ok = False

            if price_ok:
                score += 20
                matched_fields.append("price")

        # 5. Quantity match
        if (
            requirement.quantity_required is not None
            and product.quantity is not None
            and product.quantity >= requirement.quantity_required
        ):
            score += 20
            matched_fields.append("quantity")

        # Only return products with at least one match
        if score > 0:

            matches.append({
                "product_id": product.id,
                "product_name": product.name,
                "match_score": score,
                "matched_fields": matched_fields
            })

    # Highest score first
    matches.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    return {
        "requirement_id": requirement.id,
        "requirement_title": requirement.title,
        "matches": matches
    }
