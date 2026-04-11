# 🧠 Journalised — Personal Intelligence System

Journalised is a full-stack AI-powered journaling platform that transforms daily thoughts, documents, and data into structured insights.
It is designed to act not just as a note-taking tool, but as a **personal intelligence system** that helps users understand patterns, make decisions, and reflect meaningfully.

---

# 🚀 Why Journalised?

In today’s world, people collect massive amounts of information:

* Notes
* PDFs
* Images
* Daily logs

However, most tools only **store information** — they do not help users **understand it**.

### ❌ The Problem

* Fragmented knowledge across tools
* No system to extract insights
* Loss of long-term patterns
* Over-reliance on generic AI (not personalized)
* Privacy concerns with cloud-based AI

---

### ✅ The Solution

Journalised bridges this gap by:

* Converting unstructured inputs → structured insights
* Using AI to analyze personal data (not generic prompts)
* Creating a **context-aware intelligence layer**
* Running AI locally to ensure **data privacy**

---

# 🧠 Core Features

### ✍️ Smart Journal Editor

* Write freely in natural language
* Convert raw text into structured insights
* Supports markdown formatting

---

### 🤖 AI Assistant (RAG-based)

* Ask questions about your entries
* Get contextual answers based on your data
* Not generic — grounded in your history

---

### 📎 Document Intelligence

* Upload PDFs and images
* Extract text using OCR (Tesseract)
* Process and store for semantic search

---

### 📊 Monthly Insights

* Analyze trends across days
* Detect patterns and highlights
* Compare performance across time

---

### 🎨 Minimal + Personal UI

* Clean, distraction-free interface
* Theme switching (Light / Dark / Beige)
* Smooth, minimal interactions

---

# ⚙️ Tech Stack

---

## 🟣 Frontend

* React + TypeScript (Vite)
* Tailwind CSS + shadcn/ui
* React Router
* Motion (animations)

---

## 🔵 Backend

* FastAPI (Python)
* REST APIs:

  * `/entry` → journal entries
  * `/ai` → AI processing
  * `/upload` → file handling
  * `/insights` → analytics

---

## 🗄️ Database

* PostgreSQL (planned / scalable)
* Stores:

  * Users
  * Entries (daily logs)
  * Attachments

---

## 🧠 AI & Data Layer

* **Ollama (Local LLM)** → reasoning & generation
* **ChromaDB** → vector database (semantic search)
* **Sentence Transformers** → embeddings
* **PyMuPDF** → PDF parsing
* **Tesseract OCR** → image text extraction

---

# 🔄 How It Works

---

### 1. Writing an Entry

User writes → Stored in DB
→ Embedded → Stored in vector database

---

### 2. AI Query (RAG Pipeline)

User asks question →
→ Query embedded →
→ Relevant data retrieved →
→ LLM generates contextual answer

---

### 3. File Upload

PDF/Image →
→ Extract text →
→ Chunk & embed →
→ Stored for retrieval

---

### 4. Insights Generation

Entries →
→ Aggregated →
→ AI analyzes trends →
→ Structured insights returned

---

# 🧩 System Architecture

```plaintext
Frontend (React)
        ↓
FastAPI Backend
        ↓
----------------------------------
| PostgreSQL (structured data)   |
| ChromaDB (vector memory)       |
----------------------------------
        ↓
Ollama (Local LLM)
```

---

# 🔐 Privacy-First Design

Journalised is built with **local-first AI principles**:

* No sensitive data sent to cloud
* LLM runs locally via Ollama
* Full control over data

---

# 🎯 Use Cases

---

### 👩‍💼 Business

* Track KPIs
* Analyze decisions
* Identify trends

---

### 🎓 Students

* Track learning
* Summarize notes
* Improve retention

---

### 🧑‍💻 Professionals

* Reflect daily work
* Improve productivity

---

### 🎨 Creators

* Capture ideas
* Discover creative patterns

---

# 🚀 Getting Started

---

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Frontend

```bash
cd Insightjournal
npm install
npm run dev
```

---

## Run AI (Ollama)

```bash
ollama serve
ollama pull gemma
```

---

# 💡 Future Improvements

* PostgreSQL full integration
* Authentication system (JWT)
* Real-time AI streaming
* Notion-style editor
* Advanced analytics dashboard

---

# 🧠 Vision

Journalised is not just a journaling app.

It is designed to become:

> 🔥 A Personal Intelligence Infrastructure
> 🔥 A Thinking Companion
> 🔥 A Decision Support System

---

# 👨‍💻 Author

Built as a full-stack AI system integrating:

* Frontend engineering
* Backend APIs
* AI pipelines (RAG + LLM)

---

# ⭐ Final Thought

> “We don’t need more tools to store information.
> We need systems that help us understand it.”

Journalised is a step in that direction.
