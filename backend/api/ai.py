from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel

from core.llm import call_ollama, build_rag_prompt
from core.rag import query_documents

router = APIRouter()


class FormatEntryRequest(BaseModel):
    text: str


class FormatEntryResponse(BaseModel):
    formatted: str
    insights: List[str]
    suggestions: List[str]


class RAGQueryRequest(BaseModel):
    query: str


class RAGQueryResponse(BaseModel):
    answer: str
    contexts_used: int


def clean_markdown(text: str) -> str:
    """Clean LLM markdown output safely."""
    # Remove excessive stars
    text = text.replace("****", "")
    text = text.replace("***", "")
    
    # Fix malformed bold
    text = text.replace("**:", ":")
    
    # Fix only bullet patterns
    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Fix * bullets to - bullets
        if stripped.startswith("* "):
            line = line.replace("* ", "- ", 1)
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines).strip()


def _is_small_talk(query: str) -> bool:
    text = query.strip().lower()
    small_talk_terms = {
        "hi", "hello", "hey", "yo", "hola", "namaste",
        "good morning", "good evening", "how are you",
    }
    if text in small_talk_terms:
        return True
    return len(text.split()) <= 2 and any(term in text for term in ["hi", "hello", "hey"])


def _extract_json_object(raw: str) -> Dict[str, Any]:
    import json
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start : end + 1])
        raise


@router.post("/format_entry", response_model=FormatEntryResponse)
async def format_entry(payload: FormatEntryRequest) -> FormatEntryResponse:
    """
    Format journal entry with AI + clean markdown.
    """
    structured_text = payload.text.strip()
    
    insights = ["Review for key themes."]
    suggestions = ["Add timestamps", "Use bullet points"]
    
    try:
        prompt = f"""
Format the following content in STRICT CLEAN MARKDOWN.

Rules:
- Use ONLY ### for headings
- Use - for bullet points (NOT *)
- **text** for inline bold only (not headings)
- NO *, ***, **** randomly
- NO wrapping entire lines in **
- Blank line between sections
- Clean spacing

Example:
### Key Points

- Item 1: description
- Item 2: description

Content:
{payload.text[:1000]}
"""
        raw = await call_ollama(prompt, max_tokens=400, timeout_s=300.0)
        cleaned = clean_markdown(raw)
        structured_text = cleaned
    except Exception:
        pass
    
    return FormatEntryResponse(
        formatted=structured_text,
        insights=insights[:3],
        suggestions=suggestions[:3],
    )


@router.post("/rag_query", response_model=RAGQueryResponse)
async def rag_query(payload: RAGQueryRequest) -> RAGQueryResponse:
    """
    RAG over PDF.
    """
    if _is_small_talk(payload.query):
        return RAGQueryResponse(answer="Ask about your PDF!", contexts_used=0)

    contexts = query_documents(payload.query, n_results=5)
    
    if not contexts:
        return RAGQueryResponse(
            answer="No matching PDF content found.",
            contexts_used=0,
        )
    
    short_contexts = contexts[:2]
    prompt = f"""
Format in STRICT CLEAN MARKDOWN.

Rules:
- ### headings
- - bullets
- **inline bold** only

Context:
""" + '\n\n'.join([c[:300] + '...' for c in short_contexts]) + f"""

Question: {payload.query}

Answer:
"""
    
    try:
        raw = await call_ollama(prompt, max_tokens=400, timeout_s=300.0)
        cleaned = clean_markdown(raw)
        return RAGQueryResponse(answer=cleaned, contexts_used=len(short_contexts))
    except Exception:
        answer = "PDF Summary:\n\n" + '\n\n'.join([f'- {c[:400]}' for c in short_contexts])
        return RAGQueryResponse(answer=answer, contexts_used=len(short_contexts))


@router.get("/test")
async def test():
    return {"status": "AI endpoints ready"}
