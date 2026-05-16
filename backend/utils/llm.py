# llm.py — Production answer generation
#
# KEY FIXES:
# - compress_context() DELETED — it was silently killing recall
#   Full parent chunks (already selected by reranker) go directly to LLM
# - Answer style detection improved with more signal words
# - Comparison prompt redesigned to synthesize from separate facts
# - Default prompt enforces rich, multi-sentence answers (not one-liners)
# - Citations injected into prompt — LLM instructed to cite [Source, Page]
# - Conversation history injected for better continuation answers
# - Spurious "Answer not found" cleanup improved

import ollama
import logging
from config import OLLAMA_MODEL

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Answer style detection
# ─────────────────────────────────────────────

def _detect_answer_style(question: str) -> str:
    q = question.lower()

    comparison_words = [
        "compare", "comparison", "difference", "differ", "vs", "versus",
        "contrast", "distinguish", "similarities", "both", "either",
    ]
    detailed_words = [
        "explain", "elaborate", "detail", "in depth", "thoroughly",
        "tell me more", "explain more", "more details", "describe",
        "how does", "why does", "what is the reason",
    ]
    list_words = [
        "list", "enumerate", "what are the", "give me all",
        "what types", "what kinds", "examples of",
    ]

    if any(w in q for w in comparison_words):
        return "comparison"
    if any(w in q for w in detailed_words):
        return "detailed"
    if any(w in q for w in list_words):
        return "list"
    return "normal"


# ─────────────────────────────────────────────
# Context formatting
# ─────────────────────────────────────────────

def _format_context(docs: list) -> str:
    """
    Format retrieved documents into a numbered context block with source labels.
    The LLM is instructed to cite these numbers inline.
    """
    parts = []
    for i, doc in enumerate(docs, start=1):
        source = doc.metadata.get("source", "Unknown")
        page = doc.metadata.get("page", "?")
        # Display page as 1-based (PyPDF returns 0-based)
        try:
            page_display = int(page) + 1
        except (ValueError, TypeError):
            page_display = page

        parts.append(
            f"[{i}] (Source: {source}, Page {page_display})\n{doc.page_content}"
        )

    return "\n\n---\n\n".join(parts)


# ─────────────────────────────────────────────
# Style-specific instructions
# ─────────────────────────────────────────────

_STYLE_INSTRUCTIONS = {
    "normal": """
Answer the question clearly and completely.
- Write at least 3-5 sentences
- Cover the key aspects of the topic
- Cite sources inline as [1], [2] etc. matching the context numbers
- Use plain prose (no bullet points unless listing items)
""",

    "detailed": """
Provide a thorough, well-structured explanation.
- Write 5-8 sentences or more
- Explain the concept, its significance, and any nuances present in the context
- Cite sources inline as [1], [2] etc.
- Use clear paragraphs or bullet points where appropriate
""",

    "comparison": """
Synthesize a clear comparison even if no direct comparison text exists in the context.
Structure your answer as follows:
1. Brief intro identifying both concepts
2. Key similarities (if any)
3. Key differences (point by point)
4. When/why you'd use each (if determinable from context)
Cite sources inline as [1], [2] etc.
Important: If the context contains information about each concept separately,
synthesize the comparison yourself — do not say "no comparison found."
""",

    "list": """
Provide a structured list answer.
- Use a numbered or bulleted list
- Each item should be a complete thought, not just a word
- Cite sources inline as [1], [2] etc.
- Include a brief intro sentence before the list
""",
}


# ─────────────────────────────────────────────
# Main answer function
# ─────────────────────────────────────────────

def get_answer(question: str, docs: list, history_str: str = "") -> tuple[str, list]:
    """
    Generate a grounded answer from retrieved documents.

    Args:
        question    — the rewritten query
        docs        — reranked documents (parent chunks)
        history_str — formatted conversation history string (from ConversationState)

    Returns:
        (answer_text, source_citations)
        source_citations is a list of {source, page} dicts for the frontend
    """
    if not docs:
        return "I could not find relevant information in the uploaded documents.", []

    context = _format_context(docs)
    answer_style = _detect_answer_style(question)
    style_instruction = _STYLE_INSTRUCTIONS[answer_style]

    history_block = ""
    if history_str:
        history_block = f"""
Recent conversation (for context only — do not repeat this, use it to understand references):
{history_str}
"""

    prompt = f"""You are a precise document question-answering assistant.

STRICT RULES:
1. Answer ONLY from the provided context below
2. NEVER use outside knowledge
3. If context clearly lacks information to answer: reply exactly "Answer not found in document."
4. NEVER combine a partial answer with the fallback phrase — do one or the other
5. Cite sources inline using [1], [2] etc. matching the context block numbers
6. For comparisons: synthesize from separate facts if needed — don't say "not found" just because a side-by-side comparison sentence doesn't exist
{history_block}
{style_instruction}

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""

    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.2},  # low temp for factual grounding
        )
        answer = response["message"]["content"].strip()
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return "An error occurred while generating the answer. Please try again.", []

    # Clean up accidental hybrid responses (answer + fallback phrase)
    if "Answer not found in document" in answer and len(answer) > 50:
        answer = answer.replace("Answer not found in document.", "").strip()
        answer = answer.strip("- \n")

    # Build structured source list for frontend
    sources = []
    seen_sources = set()
    for doc in docs:
        source = doc.metadata.get("source", "Unknown")
        try:
            page = int(doc.metadata.get("page", 0)) + 1
        except (ValueError, TypeError):
            page = doc.metadata.get("page", "Unknown")

        key = f"{source}:{page}"
        if key not in seen_sources:
            seen_sources.add(key)
            sources.append({"source": source, "page": page})

    return answer, sources
