from __future__ import annotations

import httpx
from typing import List, Dict, Any

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma2:2b"

async def ollama_health() -> Dict[str, Any]:
    """Check Ollama service and available models."""
    tags_url = "http://localhost:11434/api/tags"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(tags_url)
            resp.raise_for_status()
            tags = resp.json()
            models = [m["name"] for m in tags.get("models", [])]
            has_model = OLLAMA_MODEL in models
            return {
                "status": "healthy" if has_model else "service_ok_model_missing",
                "models": models,
                "recommended": OLLAMA_MODEL,
            }
    except httpx.HTTPError:
        return {"status": "service_down"}

async def call_ollama(
    prompt: str,
    *,
    temperature: float = 0.2,
    max_tokens: int = 512,
    timeout_s: float = 120.0,
) -> str:
    """
    Call the local Ollama LLM and return the generated text.
    """
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
        },
    }

    # Quick health check
    health = await ollama_health()
    if health["status"] == "service_down":
        raise RuntimeError(
            f"Ollama not responding at {OLLAMA_URL}. Install Ollama and run 'ollama serve'."
        )
    if health["status"] == "service_ok_model_missing":
        raise RuntimeError(
            f"Ollama running but missing model '{OLLAMA_MODEL}'. Run: ollama pull {OLLAMA_MODEL}"
        )
    
    print(f"[LLM DEBUG] Prompt length: {len(prompt)} chars")
    
    try:
        async with httpx.AsyncClient(timeout=timeout_s) as client:
            response = await client.post(OLLAMA_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            result = data.get("response", "").strip()
            print(f"[LLM DEBUG] Response length: {len(result)} chars")
            print(f"[LLM DEBUG] Response preview: {result[:200]}...")
            return result
    except httpx.ConnectError as exc:
        raise RuntimeError(
            f"Cannot connect to Ollama at {OLLAMA_URL}. "
            "Start Ollama with 'ollama serve' and load model with 'ollama run gemma2:2b'."
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(f"Ollama returned HTTP {exc.response.status_code}. Make sure the gemma2:2b model is installed.") from exc
    except httpx.HTTPError as exc:
        raise RuntimeError(f"Ollama request failed: {exc}") from exc

def build_insight_prompt(text: str) -> str:
    """
    Build a prompt that forces the model to generate insights rather than
    echoing the original text.
    """
    return (
        "You are an assistant helping a user reflect on their personal journal entry.\n"
        "You MUST NOT repeat the original text verbatim.\n"
        "Instead, provide:\n"
        "1) Key insights\n"
        "2) Identified problems or emotional patterns\n"
        "3) Concrete, actionable suggestions for next steps.\n\n"
        "Return ONLY valid JSON: {\"insights\": [\"item1\", \"item2\"], \"problems\": [\"item1\"], \"actions\": [\"item1\"]}. "
        "No markdown, explanations or extra text. Arrays even if empty.\n\n"
        f"Journal entry:\n'''{text}'''\n\n"
        "JSON response:"
    )


def build_rag_prompt(query: str, contexts: List[str]) -> str:
    """
    Build a prompt that uses retrieved RAG context plus the user's question.
    """
    joined_context = "\n\n---\n\n".join(contexts) if contexts else "No external documents were retrieved."
    return (
        "You are an assistant for a journaling and knowledge app called InsightJournal.\n"
        "You have access to snippets extracted from the user's uploaded PDFs and images.\n"
        "Use these snippets as supporting context to answer the question.\n"
        "Do NOT copy the snippets verbatim unless necessary.\n"
        "Synthesize them into a helpful, insightful answer.\n\n"
        "Context snippets:\n"
        f"{joined_context}\n\n"
        "User question:\n"
        f"{query}\n\n"
        "Provide a thoughtful, concise answer that references the context when useful."
    )

