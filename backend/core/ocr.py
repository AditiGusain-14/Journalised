from __future__ import annotations

from typing import Optional

import pytesseract
from PIL import Image


def extract_text_from_image(path: str) -> str:
    """
    Extract text from an image using Tesseract OCR.
    """
    image = Image.open(path)
    try:
        text: Optional[str] = pytesseract.image_to_string(image)
    finally:
        image.close()
    return (text or "").strip()

