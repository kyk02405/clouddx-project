import os
from typing import Optional
from google.cloud import vision


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    """
    Google Vision OCR: returns the full detected text.
    Requires GOOGLE_APPLICATION_CREDENTIALS to be set (service account JSON).
    """
    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=image_bytes)

    # document_text_detection is often better for screenshots/doc-like images
    res = client.document_text_detection(image=image)

    if res.error.message:
        raise RuntimeError(f"Vision API error: {res.error.message}")

    # Prefer fullTextAnnotation when available
    if res.full_text_annotation and res.full_text_annotation.text:
        return res.full_text_annotation.text

    # Fallback: join detected blocks
    texts = [t.description for t in (res.text_annotations or [])]
    return "\n".join(texts).strip()
