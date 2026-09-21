from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from app.dependencies import get_current_user
from app.models.user import User

from app.services.cloudinary_service import upload_image

router = APIRouter(
    prefix="/api/upload",
    tags=["Image Upload"]
)


@router.post("/image")
async def upload_product_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "artisan":
        raise HTTPException(
            status_code=403,
            detail="Only artisans can upload product images"
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

    return {
        "success": True,
        "image_url": image_url
    }