import os
import json
import tempfile
import time

from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(
    api_key=GEMINI_API_KEY
)


def generate_catalogue(
    voice_text: str,
    image_bytes: bytes | None = None,
    image_filename: str | None = None
):

    prompt = f"""
You are KariGo AI, an AI catalogue assistant
for Indian artisans.

The artisan has provided a product photo and
a description of the product.

Artisan description:
{voice_text}

Analyze the product image carefully.

Create a professional catalogue entry.

Return ONLY valid JSON:

{{
    "name": "short product name",
    "description": "professional product description",
    "category": "product category",
    "material": "main material or null",
    "region": "region if supported by the information or null",
    "tags": ["tag1", "tag2", "tag3"]
}}

Rules:

1. Do not invent specific facts.
2. Do not claim a material unless supported by the image
   or artisan description.
3. Do not claim a region unless supported.
4. Keep the product name concise.
5. Make the description suitable for an online marketplace.
6. Generate 3 to 6 useful search tags.
7. If image and description disagree, prefer cautious
   wording rather than inventing information.
"""

    contents = [prompt]

    temp_path = None

    try:

        # -----------------------------------------
        # Upload product image
        # -----------------------------------------

        if image_bytes:

            suffix = ".jpg"

            if image_filename:
                extension = os.path.splitext(
                    image_filename
                )[1].lower()

                if extension in [
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp"
                ]:
                    suffix = extension

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=suffix
            ) as temp_file:

                temp_file.write(image_bytes)
                temp_path = temp_file.name

            uploaded_file = client.files.upload(
                file=temp_path
            )

            contents = [
                uploaded_file,
                prompt
            ]

        # -----------------------------------------
        # Try Gemini 3.6 Flash
        # -----------------------------------------

        models_to_try = [
            "gemini-3.6-flash",
            "gemini-3.5-flash-lite"
        ]

        response = None

        for model_name in models_to_try:

            try:

                print(
                    f"Trying Gemini model: {model_name}"
                )

                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config={
                        "response_mime_type": "application/json"
                    }
                )

                print(
                    f"Gemini model succeeded: {model_name}"
                )

                break

            except Exception as e:

                error_message = str(e)

                print(
                    f"Gemini error from {model_name}: "
                    f"{error_message}"
                )

                # Only fall back for temporary
                # service availability problems.
                if "503" in error_message:

                    print(
                        f"{model_name} temporarily unavailable."
                    )

                    time.sleep(2)

                    continue

                # Do not hide other errors.
                raise

        if response is None:
            raise Exception(
                "All Gemini models are temporarily unavailable."
            )

        # -----------------------------------------
        # Read Gemini response
        # -----------------------------------------

        result = response.text.strip()

        # Remove markdown fences if Gemini adds them
        if result.startswith("```"):

            result = result.replace(
                "```json",
                ""
            )

            result = result.replace(
                "```",
                ""
            )

            result = result.strip()

        # -----------------------------------------
        # Convert JSON string to Python dictionary
        # -----------------------------------------

        return json.loads(result)

    finally:

        # -----------------------------------------
        # Delete temporary image
        # -----------------------------------------

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)