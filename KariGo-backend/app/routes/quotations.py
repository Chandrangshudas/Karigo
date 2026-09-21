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
from app.models.buyer_requirement import BuyerRequirement
from app.models.quotation import Quotation

from app.schemas.quotation import (
    QuotationCreate,
    QuotationResponse
)


router = APIRouter(
    prefix="/api/quotations",
    tags=["Quotations"]
)


# --------------------------------------------------
# CREATE QUOTATION
# --------------------------------------------------

@router.post(
    "/",
    response_model=QuotationResponse
)
def create_quotation(
    request: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only buyers can create quotations
    if current_user.role != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can create quotations"
        )

    # Find product
    product = db.query(Product).filter(
        Product.id == request.product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Find buyer requirement
    requirement = db.query(
        BuyerRequirement
    ).filter(
        BuyerRequirement.id == request.requirement_id
    ).first()

    if not requirement:
        raise HTTPException(
            status_code=404,
            detail="Buyer requirement not found"
        )

    # Requirement must belong to current buyer
    if requirement.buyer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only use your own requirement"
        )

    # Quantity validation
    if request.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    # Price validation
    if request.unit_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Unit price must be greater than 0"
        )

    total_price = (
        request.quantity *
        request.unit_price
    )

    quotation = Quotation(
        buyer_id=current_user.id,
        artisan_id=product.artisan_id,

        product_id=product.id,
        requirement_id=requirement.id,

        quantity=request.quantity,
        unit_price=request.unit_price,
        total_price=total_price,

        status="PENDING"
    )

    db.add(quotation)
    db.commit()
    db.refresh(quotation)

    return quotation


# --------------------------------------------------
# BUYER: MY QUOTATIONS
# --------------------------------------------------

@router.get(
    "/buyer",
    response_model=list[QuotationResponse]
)
def get_buyer_quotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can view buyer quotations"
        )

    quotations = db.query(
        Quotation
    ).filter(
        Quotation.buyer_id == current_user.id
    ).all()

    return quotations


# --------------------------------------------------
# ARTISAN: RECEIVED QUOTATIONS
# --------------------------------------------------

@router.get(
    "/artisan",
    response_model=list[QuotationResponse]
)
def get_artisan_quotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can view received quotations"
        )

    quotations = db.query(
        Quotation
    ).filter(
        Quotation.artisan_id == current_user.id
    ).all()

    return quotations


# --------------------------------------------------
# GET SINGLE QUOTATION
# --------------------------------------------------

@router.get(
    "/{quotation_id}",
    response_model=QuotationResponse
)
def get_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    quotation = db.query(
        Quotation
    ).filter(
        Quotation.id == quotation_id
    ).first()

    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found"
        )

    # Buyer or artisan involved in quotation
    if (
        quotation.buyer_id != current_user.id
        and quotation.artisan_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You are not involved in this quotation"
        )

    return quotation


# --------------------------------------------------
# ACCEPT QUOTATION
# --------------------------------------------------

@router.post(
    "/{quotation_id}/accept"
)
def accept_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can accept quotations"
        )

    quotation = db.query(
        Quotation
    ).filter(
        Quotation.id == quotation_id
    ).first()

    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found"
        )

    if quotation.artisan_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only accept your own quotations"
        )

    if quotation.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Quotation has already been processed"
        )

    quotation.status = "ACCEPTED"

    db.commit()
    db.refresh(quotation)

    return {
        "message": "Quotation accepted",
        "quotation_id": quotation.id,
        "status": quotation.status
    }


# --------------------------------------------------
# REJECT QUOTATION
# --------------------------------------------------

@router.post(
    "/{quotation_id}/reject"
)
def reject_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can reject quotations"
        )

    quotation = db.query(
        Quotation
    ).filter(
        Quotation.id == quotation_id
    ).first()

    if not quotation:
        raise HTTPException(
            status_code=404,
            detail="Quotation not found"
        )

    if quotation.artisan_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only reject your own quotations"
        )

    if quotation.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Quotation has already been processed"
        )

    quotation.status = "REJECTED"

    db.commit()
    db.refresh(quotation)

    return {
        "message": "Quotation rejected",
        "quotation_id": quotation.id,
        "status": quotation.status
    }