from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductStockUpdate
)
from app.dependencies import get_current_user
from pydantic import BaseModel

class StockUpdate(BaseModel):
    quantity: int

router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)

@router.patch("/{product_id}/stock", response_model=ProductResponse)
def update_product_stock(
    product_id: int,
    stock_data: ProductStockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can update stock"
        )

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product.artisan_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own products"
        )

    if stock_data.quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity cannot be negative"
        )

    product.quantity = stock_data.quantity

    db.commit()
    db.refresh(product)

    return product

# CREATE PRODUCT
@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can create products"
        )

    new_product = Product(
        artisan_id=current_user.id,
        name=product.name,
        description=product.description,
        category=product.category,
        material=product.material,
        region=product.region,
        price=product.price,
        quantity=product.quantity,
        image_url=product.image_url
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# GET ALL PRODUCTS
@router.get("/", response_model=list[ProductResponse])
def get_products(
    db: Session = Depends(get_db)
):
    products = db.query(Product).all()
    return products


@router.get("/mine", response_model=list[ProductResponse])
def get_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "artisan":
        raise HTTPException(status_code=403, detail="Only artisans can view their products")

    return db.query(Product).filter(Product.artisan_id == current_user.id).all()


# GET ONE PRODUCT
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# UPDATE PRODUCT
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can update products"
        )

    existing_product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not existing_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if existing_product.artisan_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own products"
        )

    existing_product.name = product.name
    existing_product.description = product.description
    existing_product.category = product.category
    existing_product.material = product.material
    existing_product.region = product.region
    existing_product.price = product.price
    existing_product.quantity = product.quantity
    existing_product.image_url = product.image_url

    db.commit()
    db.refresh(existing_product)

    return existing_product


# DELETE PRODUCT
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can delete products"
        )

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Ownership check
    if product.artisan_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own products"
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }
