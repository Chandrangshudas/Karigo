from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    HTTPException
)

from app.services.cloudinary_service import upload_image
import app.cloudinary_config
from app.dependencies import get_current_user
from app.models.user import User
from app.models.catalogue_draft import CatalogueDraft
from app.database import get_db
from app.schemas.ai_catalogue import CatalogueResponse
from app.ai.catalogue import generate_catalogue
from app.models.product import Product
from sqlalchemy.orm import Session


router = APIRouter(
    prefix="/api/catalogue",
    tags=["AI Catalogue"]
)


@router.post(
    "/generate",
    response_model=CatalogueResponse
)
async def generate_product_catalogue(

    voice_text: str = Form(...),

    image: UploadFile = File(...),

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db)
):

    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can use the catalogue generator"
        )

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed"
        )

    image_bytes = await image.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image must be smaller than 10 MB"
        )
    image_url = upload_image(image_bytes)

    # Send image + description to Gemini
    result = generate_catalogue(
        voice_text=voice_text,
        image_bytes=image_bytes,
        image_filename=image.filename
    )

    # Convert tags list into database-friendly text
    tags_text = ", ".join(result.get("tags", []))

    # Create catalogue draft
    draft = CatalogueDraft(
    artisan_id=current_user.id,
    name=result["name"],
    description=result["description"],
    category=result["category"],
    material=result.get("material"),
    region=result.get("region"),
    tags=tags_text,
    image_url=image_url,
    status="DRAFT"
    )

    db.add(draft)
    db.commit()
    db.refresh(draft)

    return {
        "name": draft.name,
        "description": draft.description,
        "category": draft.category,
        "material": draft.material,
        "region": draft.region,
        "tags": result.get("tags", [])
    }
@router.get("/drafts")
def get_my_drafts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    drafts = db.query(CatalogueDraft).filter(
        CatalogueDraft.artisan_id == current_user.id
    ).all()

    return drafts
@router.post("/drafts/{draft_id}/approve")
def approve_catalogue_draft(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can approve catalogue drafts"
        )

    draft = db.query(CatalogueDraft).filter(
        CatalogueDraft.id == draft_id
    ).first()

    if not draft:
        raise HTTPException(
            status_code=404,
            detail="Catalogue draft not found"
        )

    if draft.artisan_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only approve your own drafts"
        )

    if draft.status != "DRAFT":
        raise HTTPException(
            status_code=400,
            detail="Draft has already been processed"
        )

    # Convert tags from database text to list
    tags = [
        tag.strip()
        for tag in draft.tags.split(",")
        if tag.strip()
    ]

    # Create actual product
    product = Product(
        artisan_id=current_user.id,
        name=draft.name,
        description=draft.description,
        category=draft.category,
        material=draft.material,
        region=draft.region,
        price=None,
        quantity=0,
        image_url=draft.image_url
    )

    db.add(product)

    # Mark draft as approved
    draft.status = "APPROVED"

    db.commit()
    db.refresh(product)

    return {
        "message": "Catalogue approved successfully",
        "product_id": product.id,
        "product": {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "category": product.category,
            "material": product.material,
            "region": product.region
        }
    }