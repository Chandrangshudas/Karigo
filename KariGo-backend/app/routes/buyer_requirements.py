from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models.user import User
from app.models.buyer_requirement import BuyerRequirement

from app.schemas.buyer_requirement import (
    BuyerRequirementCreate,
    BuyerRequirementResponse
)


router = APIRouter(
    prefix="/api/buyer-requirements",
    tags=["Buyer Requirements"]
)


# CREATE REQUIREMENT
@router.post(
    "/",
    response_model=BuyerRequirementResponse
)
def create_requirement(
    requirement: BuyerRequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only buyers can create buyer requirements
    if current_user.role != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can create requirements"
        )

    # Validate price
    if (
        requirement.min_price is not None
        and requirement.max_price is not None
        and requirement.min_price > requirement.max_price
    ):
        raise HTTPException(
            status_code=400,
            detail="Minimum price cannot be greater than maximum price"
        )

    # Validate quantity
    if (
        requirement.quantity_required is not None
        and requirement.quantity_required <= 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    new_requirement = BuyerRequirement(
        buyer_id=current_user.id,

        title=requirement.title,
        description=requirement.description,

        category=requirement.category,
        material=requirement.material,
        region=requirement.region,

        min_price=requirement.min_price,
        max_price=requirement.max_price,

        quantity_required=requirement.quantity_required,

        status="OPEN"
    )

    db.add(new_requirement)
    db.commit()
    db.refresh(new_requirement)

    return new_requirement


# GET MY REQUIREMENTS
@router.get(
    "/my",
    response_model=list[BuyerRequirementResponse]
)
def get_my_requirements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can view buyer requirements"
        )

    requirements = db.query(
        BuyerRequirement
    ).filter(
        BuyerRequirement.buyer_id == current_user.id
    ).all()

    return requirements


# GET OPEN REQUIREMENTS
@router.get(
    "/open",
    response_model=list[BuyerRequirementResponse]
)
def get_open_requirements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    requirements = db.query(
        BuyerRequirement
    ).filter(
        BuyerRequirement.status == "OPEN"
    ).all()

    return requirements


# GET SINGLE REQUIREMENT
@router.get(
    "/{requirement_id}",
    response_model=BuyerRequirementResponse
)
def get_requirement(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    requirement = db.query(
        BuyerRequirement
    ).filter(
        BuyerRequirement.id == requirement_id
    ).first()

    if not requirement:
        raise HTTPException(
            status_code=404,
            detail="Buyer requirement not found"
        )

    return requirement


# DELETE REQUIREMENT
@router.delete("/{requirement_id}")
def delete_requirement(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    requirement = db.query(
        BuyerRequirement
    ).filter(
        BuyerRequirement.id == requirement_id
    ).first()

    if not requirement:
        raise HTTPException(
            status_code=404,
            detail="Buyer requirement not found"
        )

    if requirement.buyer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own requirements"
        )

    db.delete(requirement)
    db.commit()

    return {
        "message": "Buyer requirement deleted successfully"
    }