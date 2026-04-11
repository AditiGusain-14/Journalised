from __future__ import annotations

import os
import uuid
from typing import Dict, List

from fastapi import APIRouter, UploadFile, File, HTTPException

from core.ocr import extract_text_from_image
from core.pdf import extract_text_from_pdf
from core.rag import add_documents, clear_documents


router = APIRouter()

BASE_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
IMAGE_UPLOAD_DIR = os.path.join(BASE_UPLOAD_DIR, "images")
PDF_UPLOAD_DIR = os.path.join(BASE_UPLOAD_DIR, "pdfs")

os.makedirs(IMAGE_UPLOAD_DIR, exist_ok=True)
os.makedirs(PDF_UPLOAD_DIR, exist_ok=True)


def _chunk_text(text: str, max_chars: int = 2000) -> List[str]:  # ~8 pages / 500 chunks

    """
    Naive text chunking by character count, preserving sentence boundaries when possible.
    """
    text = text.strip()
    if not text:
        return []

    chunks: List[str] = []
    current: List[str] = []
    current_len = 0

    sentences = [s.strip() for s in text.replace("\n", " ").split(". ") if s.strip()]
    for sentence in sentences:
        sentence_with_dot = sentence if sentence.endswith(".") else sentence + "."
        if current_len + len(sentence_with_dot) > max_chars and current:
            chunks.append(" ".join(current).strip())
            current = [sentence_with_dot]
            current_len = len(sentence_with_dot)
        else:
            current.append(sentence_with_dot)
            current_len += len(sentence_with_dot)

    if current:
        chunks.append(" ".join(current).strip())

    return chunks


@router.post("/image")
async def upload_image(file: UploadFile = File(...)) -> Dict[str, str]:
    """
    Accept an image file, run OCR, store extracted text into the vector DB.
    """
    extension = os.path.splitext(file.filename or "")[1] or ".png"
    file_id = str(uuid.uuid4())
    dest_path = os.path.join(IMAGE_UPLOAD_DIR, f"{file_id}{extension}")

    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    text = extract_text_from_image(dest_path)
    if not text:
        raise HTTPException(status_code=400, detail="No text could be extracted from the image.")

    chunks = _chunk_text(text)
    metadatas = [{"source": "image", "file_id": file_id, "chunk_index": i} for i in range(len(chunks))]
    ids = [f"image-{file_id}-{i}" for i in range(len(chunks))]
    add_documents(chunks, metadatas=metadatas, ids=ids)

    return {
        "status": "ok",
        "file_id": file_id,
        "chunks_stored": str(len(chunks)),
    }


@router.post("/pdf")
async def upload_pdf(file: UploadFile = File(...)) -> Dict[str, str]:
    """
    Accept a PDF file, extract text, store in vector DB.
    """
    extension = os.path.splitext(file.filename or "")[1] or ".pdf"
    file_id = str(uuid.uuid4())
    dest_path = os.path.join(PDF_UPLOAD_DIR, f"{file_id}{extension}")

    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    text = extract_text_from_pdf(dest_path)
    if not text:
        raise HTTPException(status_code=400, detail="No text could be extracted from the PDF.")

    chunks = _chunk_text(text)
    metadatas = [{"source": "pdf", "file_id": file_id, "chunk_index": i} for i in range(len(chunks))]
    ids = [f"pdf-{file_id}-{i}" for i in range(len(chunks))]
    add_documents(chunks, metadatas=metadatas, ids=ids)

    return {
        "status": "ok",
        "file_id": file_id,
        "chunks_stored": str(len(chunks)),
    }


@router.post("/clear")
async def clear_uploaded_context() -> Dict[str, str]:
    """
    Clear indexed RAG documents and remove uploaded files.
    """
    clear_documents()

    for folder in (IMAGE_UPLOAD_DIR, PDF_UPLOAD_DIR):
        for filename in os.listdir(folder):
            path = os.path.join(folder, filename)
            if os.path.isfile(path):
                try:
                    os.remove(path)
                except OSError:
                    pass

    return {"status": "ok", "message": "Uploaded context cleared."}

