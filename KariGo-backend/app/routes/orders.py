from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models.user import User
from app.models.product import Product
from app.models.buyer_requirement import BuyerRequirement
from app.models.quotation import Quotation
from app.models.order import Order

from app.schemas.order import OrderCreate, OrderResponse


router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"]
)


@router.post(
    "/",
    response_model=OrderResponse
)
def create_order(
    request: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only buyers can create orders
    if current_user.role != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can create orders"
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

    # Find requirement
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

    # Requirement ownership
    if requirement.buyer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only use your own requirement"
        )

    # Find accepted quotation
    quotation = db.query(
        Quotation
    ).filter(
        Quotation.product_id == request.product_id,
        Quotation.requirement_id == request.requirement_id,
        Quotation.buyer_id == current_user.id,
        Quotation.status == "ACCEPTED"
    ).first()

    if not quotation:
        raise HTTPException(
            status_code=400,
            detail="Only accepted quotations can create orders"
        )

    # Check stock
    if product.quantity < request.quantity:
        raise HTTPException(
            status_code=400,
            detail="Insufficient product quantity"
        )

    # Prevent duplicate order
    existing_order = db.query(Order).filter(
        Order.quotation_id == quotation.id
    ).first()

    if existing_order:
        raise HTTPException(
            status_code=400,
            detail="An order already exists for this quotation"
        )

    # Calculate total
    total_price = (
        request.quantity *
        quotation.unit_price
    )

    # Create order
    order = Order(
        buyer_id=current_user.id,
        artisan_id=product.artisan_id,
        product_id=product.id,
        requirement_id=requirement.id,
        quotation_id=quotation.id,
        quantity=request.quantity,
        unit_price=quotation.unit_price,
        total_price=total_price,
        status="PENDING"
    )

    # Reduce stock
    product.quantity -= request.quantity

    db.add(order)
    db.commit()
    db.refresh(order)

    return order