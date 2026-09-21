import cloudinary.uploader


def upload_image(file):
    result = cloudinary.uploader.upload(
        file,
        folder="karigo/products"
    )

    return result["secure_url"]