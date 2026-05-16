import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "utils"))

import logging
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

from pdf_reader import read_pdf
from chunking import create_chunks
from embedding import create_vector_store
from bm25 import create_bm25_index
from retrieval import hybrid_retrieve
from query_rewriter import rewrite_query
from reranker import rerank_docs
from llm import get_answer
from memory import ConversationState

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)


# ─────────────────────────────────────────────
# Knowledge Base — encapsulates all RAG state
# ─────────────────────────────────────────────

class KnowledgeBase:
    """
    Holds all RAG state for the current session.
    In production with multiple users, instantiate one per user session.
    For this single-user local app, one instance is correct.
    """
    def __init__(self):
        self.vector_store = None
        self.bm25 = None
        self.chunks = None
        self.conversation = ConversationState()
        self.loaded = False

    def reset(self):
        """Called when new documents are uploaded."""
        self.vector_store = None
        self.bm25 = None
        self.chunks = None
        self.conversation.reset()
        self.loaded = False

    def load(self, vector_store, bm25, chunks):
        self.vector_store = vector_store
        self.bm25 = bm25
        self.chunks = chunks
        self.loaded = True


kb = KnowledgeBase()


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.route("/upload", methods=["POST"])
def upload_files():
    """
    Upload and index PDF documents.
    Resets all conversation history and rebuilds the full index.
    """
    files = request.files.getlist("files")
    if not files or all(f.filename == "" for f in files):
        return jsonify({"error": "No files uploaded"}), 400

    try:
        logger.info(f"Upload: processing {len(files)} file(s)")

        documents = read_pdf(files)
        logger.info(f"Upload: {len(documents)} pages extracted")

        chunks = create_chunks(documents)
        logger.info(f"Upload: {len(chunks)} chunks created")
        # Release old Chroma handles before creating new store (Windows file lock fix)
        # Release old Chroma handles before creating new store
        if kb.vector_store is not None:
            try:
                kb.vector_store._client.reset()
            except Exception:
                pass
            kb.vector_store = None
        vector_store = create_vector_store(chunks)
        bm25, chunk_list = create_bm25_index(chunks)

        kb.load(vector_store, bm25, chunk_list)
        logger.info("Upload: knowledge base ready")

        return jsonify({
            "message": "Knowledge base ready",
            "stats": {
                "pages": len(documents),
                "chunks": len(chunk_list),
            },
        })

    except ValueError as e:
        logger.warning(f"Upload validation error: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Upload failed: {traceback.format_exc()}")
        return jsonify({"error": "Failed to process documents. Check server logs."}), 500


@app.route("/chat", methods=["POST"])
def chat():
    """
    Answer a question using the current knowledge base.

    Pipeline:
        raw question
        → query rewriting (typo fix + continuation resolution)
        → hybrid retrieval (dense + BM25, multi-query, RRF fusion)
        → cross-encoder reranking
        → LLM answer generation with citations
        → return answer + sources
    """
    if not kb.loaded:
        return jsonify({"error": "Upload documents first"}), 400

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    question = (data.get("question") or "").strip()
    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        # Step 1: Rewrite query (resolve continuation, fix typos)
        rewritten = rewrite_query(question, kb.conversation)
        logger.info(f"Chat | Q: '{question}' | Rewritten: '{rewritten}'")

        # Step 2: Hybrid retrieval
        retrieved_docs = hybrid_retrieve(
            rewritten,
            kb.vector_store,
            kb.bm25,
            kb.chunks,
        )

        if not retrieved_docs:
            logger.warning(f"Chat | No documents retrieved for: '{rewritten}'")
            answer = "I could not find relevant information in the uploaded documents."
            sources = []
            kb.conversation.add_turn(question, answer, rewritten)
            return jsonify({"answer": answer, "sources": sources, "rewritten_query": rewritten})

        # Step 3: Rerank
        top_docs, best_score, is_relevant = rerank_docs(rewritten, retrieved_docs)
        logger.info(f"Chat | Reranker best score: {best_score:.3f}, relevant: {is_relevant}")

        # Step 4: Generate answer
        if not is_relevant:
            # Only triggered when best_score < -5.0 — deeply irrelevant results
            logger.info(f"Chat | Reranker hard floor triggered (score={best_score:.3f})")
            answer = "I could not find relevant information in the uploaded documents."
            sources = []
        else:
            history_str = kb.conversation.get_formatted_history()
            answer, sources = get_answer(rewritten, top_docs, history_str)

        # Step 5: Update conversation memory
        kb.conversation.add_turn(question, answer, rewritten)
        logger.info(f"Chat | Answer generated ({len(answer)} chars), {len(sources)} sources")

        return jsonify({
            "answer": answer,
            "sources": sources,
            "rewritten_query": rewritten,  # useful for frontend debugging
            "confidence": round(float(best_score), 3),
        })

    except Exception as e:
        logger.error(f"Chat failed: {traceback.format_exc()}")
        return jsonify({"error": "An error occurred. Check server logs."}), 500


@app.route("/reset", methods=["POST"])
def reset():
    """Clear conversation history without re-uploading documents."""
    kb.conversation.reset()
    return jsonify({"message": "Conversation history cleared"})


@app.route("/status", methods=["GET"])
def status():
    """Health check — useful for frontend to know if KB is loaded."""
    return jsonify({
        "loaded": kb.loaded,
        "chunks": len(kb.chunks) if kb.chunks else 0,
        "conversation_turns": len(kb.conversation),
    })


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
