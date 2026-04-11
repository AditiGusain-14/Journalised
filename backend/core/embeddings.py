from __future__ import annotations

from functools import lru_cache
from typing import List

import numpy as np
from sentence_transformers import SentenceTransformer


MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Compute embeddings for a list of texts.
    Returned as plain Python lists for compatibility with ChromaDB.
    """
    model = _get_model()
    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    if isinstance(embeddings, np.ndarray):
        return embeddings.astype(float).tolist()
    return [list(map(float, e)) for e in embeddings]

