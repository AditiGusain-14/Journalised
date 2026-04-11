from __future__ import annotations

import os
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings

from .embeddings import embed_texts

PERSIST_DIRECTORY = os.path.join(os.path.dirname(__file__), "..", "chroma_store")
COLLECTION_NAME = "insightjournal_docs"

def _get_client() -> chromadb.Client:
    os.makedirs(PERSIST_DIRECTORY, exist_ok=True)
    client = chromadb.PersistentClient(path=PERSIST_DIRECTORY, settings=Settings(allow_reset=False))
    return client

def _get_collection():
    client = _get_client()
    return client.get_or_create_collection(name=COLLECTION_NAME)

def add_documents(
    texts: List[str],
    metadatas: Optional[List[Dict[str, Any]]] = None,
    ids: Optional[List[str]] = None,
) -> None:
    """
    Add multiple text chunks to the vector store.
    """
    if not texts:
        return

    collection = _get_collection()
    embeddings = embed_texts(texts)

    if ids is None:
        ids = [f"doc-{collection.count()}-{i}" for i in range(len(texts))]

    # Ensure metadatas has correct length
    if metadatas is None:
        metadatas = [{} for _ in texts]

    collection.add(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
    )
    print(f"[RAG DEBUG] Added {len(texts)} chunks. Total count: {collection.count()}")

def query_documents(query: str, n_results: int = 5) -> List[str]:
    """
    Retrieve top relevant text chunks for the given query.
    """
    collection = _get_collection()
    query_embedding = embed_texts([query])[0]

    count = collection.count()
    if count == 0:
        print("[RAG DEBUG] No documents in collection")
        return []

    result = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "distances", "metadatas"],
    )

    docs = (result.get("documents") or [[]])[0]
    distances = (result.get("distances") or [[]])[0]
    metas = (result.get("metadatas") or [[]])[0]

    print(f"[RAG DEBUG] Queried '{query}'. Found {len(docs)} results, collection has {count} docs")

    # Always return top semantic matches (relaxed)
    semantic_docs = []
    for idx, doc in enumerate(docs):
        if not isinstance(doc, str):
            continue
        distance = float(distances[idx]) if idx < len(distances) else 0.0
        meta = metas[idx] if idx < len(metas) else {}
        print(f"[RAG DEBUG] Doc {idx}: distance={distance:.2f}, source={meta.get('source', 'unknown')}")
        if distance > 2.5:  # Very loose
            continue
        semantic_docs.append(doc)

    if semantic_docs:
        print(f"[RAG DEBUG] Returning {len(semantic_docs)} semantic matches")
        return semantic_docs[:n_results]

    # Fallback to top docs if no good matches
    print("[RAG DEBUG] No semantic matches, returning top docs")
    return [d for d in docs if isinstance(d, str)][:n_results]

def clear_documents() -> None:
    """
    Clear the current document collection.
    """
    client = _get_client()
    try:
        client.delete_collection(name=COLLECTION_NAME)
        print("[RAG DEBUG] Cleared collection")
    except Exception:
        # Collection may not exist yet.
        pass

