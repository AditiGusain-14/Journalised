# Backend Setup

1. Install deps: `pip install -r requirements.txt`
2. Ollama: Download, `ollama serve`, `ollama pull gemma2:2b`
3. Run: `uvicorn main:app --reload --port 8000`
4. Test: `curl http://localhost:8000/ai/health`

**Debug Logs:** Watch terminal for [RAG/LLM DEBUG]

Frontend: `npm run dev`

