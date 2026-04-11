from __future__ import annotations

from typing import List

import fitz  # PyMuPDF
import pytesseract
from PIL import Image


def extract_text_from_pdf(path: str) -> str:
    """
    Extract text from a PDF file using PyMuPDF.
    Falls back to OCR for scanned PDFs.
    """
    doc = fitz.open(path)
    texts: List[str] = []
    try:
        for page_num, page in enumerate(doc):
            page_text = page.get_text("text")
            if page_text and page_text.strip():
                texts.append(page_text)
            else:
                try:
                    pix = page.get_pixmap(dpi=200)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    ocr_text = pytesseract.image_to_string(img)
                    if ocr_text and ocr_text.strip():
                        texts.append(ocr_text)
                except Exception:
                    pass
    finally:
        doc.close()
    
    result = "\n".join(texts).strip()
    if not result:
        raise ValueError("No text could be extracted from PDF (both text extraction and OCR failed)")
    return result

