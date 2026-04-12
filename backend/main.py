from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.entry import router as entry_router
from api.ai import router as ai_router
from api.upload import router as upload_router
from api.insights import router as insights_router
from api.preferences import router as preferences_router
from api.auth import router as auth_router
from core.llm import ollama_health
from core.rag import _get_collection
import chromadb

def create_app() -> FastAPI:
    app = FastAPI(title="InsightJournal Backend")

    # Enable CORS for all origins (frontend on http://127.0.0.1:5173 or similar)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Create tables on startup (development)
    from database import engine, Base
    from models import User, Entry, File
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized")

    # Register routers with prefixes
    app.include_router(entry_router, prefix="/entry", tags=["entry"])
    app.include_router(ai_router, prefix="/ai", tags=["ai"])
    app.include_router(upload_router, prefix="/upload", tags=["upload"])
    app.include_router(insights_router, prefix="/insights", tags=["insights"])
    app.include_router(preferences_router, prefix="/preferences", tags=["preferences"])
    app.include_router(auth_router, prefix="/auth", tags=["auth"])

    return app


app = create_app()


@app.get("/")
async def root():
    return {"message": "InsightJournal backend is running"}


@app.get("/ai/health")
async def ai_health():
    return await ollama_health()


@app.get("/chroma/status")
async def chroma_status():
    try:
        client = chromadb.PersistentClient(path="chroma_store")
        coll = client.get_collection("insightjournal_docs")
        count = coll.count()
        sample = coll.get(limit=1, include=["documents"])
        return {
            "count": count,
            "sample_doc": sample["documents"][0] if sample["documents"] else None
        }
    except Exception as e:
        return {"error": str(e)}

