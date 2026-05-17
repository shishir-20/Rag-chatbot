# 🧠 DocMind — Advanced RAG Chatbot

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Ollama](https://img.shields.io/badge/Ollama-llama3.2-FF6B35?style=flat)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-FF4B4B?style=flat)
![HuggingFace](https://img.shields.io/badge/HuggingFace-Embeddings-FFD21E?style=flat&logo=huggingface&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat)

> A production-grade, fully local AI-powered document question-answering system. Upload any PDF — ask anything. Every answer is grounded in your document with source citations. No external API required.

---

## 📌 What Is This?

DocMind is a full-stack **Retrieval-Augmented Generation (RAG)** chatbot built from scratch. It combines state-of-the-art NLP retrieval techniques with a local LLM to let you have intelligent, cited conversations with your PDF documents — entirely on your own machine.

Unlike simple RAG demos, this project implements production-level techniques used in real AI systems:
- **Reciprocal Rank Fusion** for combining search results
- **Cross-encoder reranking** for precision retrieval
- **Parent-child chunking** for context-aware answers
- **LLM-based query rewriting** with spell correction
- **Conversational memory** for multi-turn dialogue

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 PDF Upload | Drag-and-drop or browse to upload single or multiple PDFs |
| 🔍 Hybrid Retrieval | Dense semantic search + BM25 keyword search combined |
| 🔀 RRF Fusion | Reciprocal Rank Fusion merges ranked results across search methods |
| 🎯 Cross-Encoder Reranking | Neural reranker scores query-document pairs for precision |
| 👨‍👧 Parent-Child Chunking | Small chunks for retrieval, full parent context for answering |
| 🔄 Multi-Query Expansion | LLM generates alternative queries to improve recall |
| ✏️ Spell Correction | pyspellchecker fixes typos before retrieval |
| 🧠 Query Rewriting | LLM resolves follow-ups and vague references automatically |
| 💬 Conversational Memory | Multi-turn dialogue with context carry-over |
| 📎 Source Citations | Every answer cites the source document and page number |
| 🏠 Fully Local | Runs on your machine — no OpenAI, no external APIs, no data leaves your PC |
| ⚡ GPU Acceleration | Uses CUDA via Ollama if available, falls back to CPU |

---

## 🏗️ Architecture

```
User Question
      │
      ▼
┌─────────────────┐
│  Spell Correction│  ← pyspellchecker fixes typos instantly
│  Query Rewriting │  ← LLM resolves follow-ups & references
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Multi-Query Expansion        │  ← LLM generates 3 alternative queries
└──────────┬──────────────────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌─────────┐  ┌─────────┐
│  Dense  │  │  BM25   │  ← Hybrid retrieval (semantic + keyword)
│ Chroma  │  │ Keyword │
└─────────┘  └─────────┘
     │            │
     └─────┬──────┘
           ▼
┌─────────────────┐
│   RRF Fusion    │  ← Rank-based score merging (immune to scale differences)
└────────┬────────┘
         ▼
┌─────────────────┐
│ Parent Reconstruct│ ← Swap child chunks → full parent context
└────────┬────────┘
         ▼
┌─────────────────┐
│ Cross-Encoder   │  ← Neural reranker scores every (query, doc) pair
│   Reranking     │
└────────┬────────┘
         ▼
┌─────────────────┐
│  LLM Answer     │  ← llama3.2 generates grounded answer with citations
│  Generation     │
└────────┬────────┘
         ▼
  Answer + Sources [1][2][3]
```

---

## 🛠️ Tech Stack

### Backend
| Component | Technology |
|---|---|
| API Server | Flask + Flask-CORS |
| LLM Inference | Ollama (llama3.2:1b) |
| Vector Store | ChromaDB |
| Embeddings | sentence-transformers/all-mpnet-base-v2 |
| Keyword Search | BM25 (rank-bm25) |
| Reranker | cross-encoder/ms-marco-MiniLM-L-6-v2 |
| PDF Parsing | LangChain + PyPDF |
| NLP | NLTK (stemming + stopwords) |
| Spell Check | pyspellchecker |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 18 |
| HTTP Client | Axios |
| Markdown | react-markdown |
| Styling | Inline styles (warm scholarly theme) |

---

## 📁 Folder Structure

```
Rag-chatbot/
│
├── backend/
│   ├── app.py                  # Flask API — all endpoints
│   ├── utils/
│   │   ├── config.py           # Central configuration
│   │   ├── pdf_reader.py       # PDF loading + cleaning
│   │   ├── chunking.py         # Parent-child chunking
│   │   ├── embedding.py        # Vector store management
│   │   ├── bm25.py             # BM25 keyword index
│   │   ├── retrieval.py        # Hybrid retrieval + RRF fusion
│   │   ├── reranker.py         # Cross-encoder reranking
│   │   ├── query_rewriter.py   # Spell correction + LLM rewriting
│   │   ├── multi_query.py      # Query expansion
│   │   ├── memory.py           # Conversation state management
│   │   └── llm.py              # Answer generation + prompts
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React component
│   │   ├── App.css
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.com/download) installed
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/shishir-20/Rag-chatbot.git
cd Rag-chatbot
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download NLTK data (one time)
python -c "import nltk; nltk.download('stopwords')"
```

---

### 3. Ollama Setup

```bash
# Pull the LLM model
ollama pull llama3.2:1b

# Start Ollama server (keep this running)
ollama serve
```

> **Note:** If you have a GPU with sufficient VRAM (6GB+), you can use `llama3.2` (3b) instead for better answer quality. Update `OLLAMA_MODEL` in `backend/utils/config.py`.

---

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

---

## 🚀 Running the Project

You need **3 terminals** running simultaneously:

**Terminal 1 — Ollama:**
```bash
ollama serve
```

**Terminal 2 — Flask Backend:**
```bash
cd backend
python app.py
```

**Terminal 3 — React Frontend:**
```bash
cd frontend
npm run dev
```

Then open your browser at:
```
http://localhost:5173
```

---

## 💡 How to Use

1. **Upload** — Click "Choose Files" or drag and drop your PDF(s)
2. **Index** — Click "Index Documents" and wait for "READY" status
3. **Ask** — Type any question in the input box and press Enter
4. **Explore** — Source citations appear below each answer showing the exact document and page

### Example Questions
```
What is Article 21?
Compare Article 21 and Article 32
What are the fundamental rights in the Indian Constitution?
explain more about that          ← follow-up remembered automatically
wht is artcle 21                 ← typos corrected automatically
```

---

## 🔧 Configuration

All key settings are in `backend/utils/config.py`:

```python
OLLAMA_MODEL = "llama3.2:1b"          # LLM model
EMBEDDING_MODEL = "sentence-transformers/all-mpnet-base-v2"
TOP_K_DENSE = 10                       # Dense retrieval results per query
TOP_K_BM25 = 10                        # BM25 results per query
TOP_K_RERANK = 5                       # Final docs after reranking
MULTI_QUERY_COUNT = 3                  # Alternative queries to generate
RERANKER_HARD_FLOOR = -5.0            # Only reject deeply irrelevant results
MEMORY_WINDOW = 4                      # Conversation turns to remember
```

---

## 🖼️ Screenshots

### Before Upload
![Before Upload](screenshots/Beforeupload.png)

### After Upload / Indexed State
![After Upload](screenshots/Afterupload.png)

### Question Answering
![Question Answering](screenshots/QA.png)

### Clear Chat
![Clear Chat](screenshots/Clearchat.png)

---


## 🚧 Known Limitations

- **Single user only** — global state means multiple users would interfere with each other
- **PDF only** — DOCX, TXT, web pages not yet supported
- **Local only** — requires Ollama running locally; not deployed to cloud
- **VRAM sensitive** — llama3.2 3b requires ~3GB VRAM; use 1b model on 4GB GPUs
- **No streaming** — answer appears all at once after full generation
- **English only** — spell correction and BM25 tokenization tuned for English

---

## 🔮 Future Improvements

- [ ] Streaming responses (word-by-word answer display)
- [ ] DOCX and TXT file support
- [ ] Deploy backend to Render with Groq API replacing Ollama
- [ ] Multi-user session isolation
- [ ] Document management (list, delete individual docs)
- [ ] Answer confidence score displayed in UI
- [ ] Dark/light mode toggle
- [ ] Export chat history as PDF

---

## 👨‍💻 Author

**Shishir**
- GitHub: [@shishir-20](https://github.com/shishir-20)


---

