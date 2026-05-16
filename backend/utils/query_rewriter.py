# query_rewriter.py — Production LLM-based query rewriting with spell correction

import re
import ollama
import logging
from memory import ConversationState
from config import OLLAMA_MODEL

logger = logging.getLogger(__name__)

# Spell checker — catches typos BEFORE LLM sees the query
try:
    from spellchecker import SpellChecker
    _spell = SpellChecker()
    _SPELL_AVAILABLE = True
except ImportError:
    logger.warning("pyspellchecker not installed. Run: pip install pyspellchecker")
    _SPELL_AVAILABLE = False

# Words to never "correct" — domain terms, numbers, article numbers
_PROTECTED = {"mqtt", "http", "iot", "api", "rag", "llm", "pdf", "21", "32", "19", "14", "22", "20"}


def _fix_spelling(text: str) -> str:
    """
    Fix obvious spelling mistakes using pyspellchecker.
    Skips protected domain terms and numbers.
    """
    if not _SPELL_AVAILABLE:
        return text

    words = text.split()
    corrected = []
    for word in words:
        clean = word.lower().strip(".,?!")
        if clean in _PROTECTED or clean.isdigit() or len(clean) <= 2:
            corrected.append(word)
        else:
            fixed = _spell.correction(clean)
            corrected.append(fixed if fixed else word)

    result = " ".join(corrected)
    if result != text:
        logger.debug(f"Spell fix: '{text}' → '{result}'")
    return result


def rewrite_query(question: str, state: ConversationState) -> str:
    """
    Rewrite a user question into a self-contained, retrieval-optimised query.

    Pipeline:
    1. Fix spelling with pyspellchecker (fast, no LLM needed)
    2. If standalone + no references → return spell-fixed query directly
    3. Otherwise → LLM rewrite for continuation/pronoun resolution
    """
    question = question.strip()

    # Step 1: Fix spelling ALWAYS — before anything else
    question = _fix_spelling(question)

    # Step 2: Fast-path — no LLM needed if conversation is empty and question is clear
    if state.is_empty() and not _has_reference_words(question):
        return _normalize(question)

    # Step 3: Fast-path for long self-contained questions with no references
    word_count = len(question.split())
    if word_count >= 6 and not _has_reference_words(question):
        return _normalize(question)

    # Step 4: Full LLM rewrite for continuation/reference resolution
    history_str = state.get_formatted_history(n=3)
    last_topic = state.get_last_topic() or ""

    prompt = f"""You are a search query optimizer for a document QA system.

Your job: Rewrite the user's latest question into a clear, self-contained search query.

Rules:
1. Fix any remaining spelling mistakes silently
2. If the question refers to previous context ("explain more", "what about that", "compare them"),
   incorporate the topic from conversation history into the query
3. Expand pronouns and references ("it", "that", "them") using history
4. Output ONLY the rewritten query — no explanation, no preamble, no quotes
5. If the question is already clear and self-contained, return it as-is
6. Never invent topics not mentioned by the user

Conversation history:
{history_str}

Last resolved topic: {last_topic}

User's latest question: {question}

Rewritten query:"""

    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.1},
        )
        rewritten = response["message"]["content"].strip()

        if not rewritten or len(rewritten) > 300:
            logger.warning(f"Query rewrite invalid, using spell-fixed: '{question}'")
            return question

        logger.debug(f"Query rewrite: '{question}' → '{rewritten}'")
        return rewritten

    except Exception as e:
        logger.error(f"Query rewriting failed: {e}. Using spell-fixed question.")
        return question


def _normalize(question: str) -> str:
    """Normalize whitespace."""
    return re.sub(r"\s+", " ", question).strip()


def _has_reference_words(question: str) -> bool:
    """Detect vague references that need LLM context resolution."""
    q = question.lower()
    signals = [
        "explain more", "tell me more", "more details", "elaborate",
        "go on", "continue", "expand",
        " it ", " its ", " they ", " them ", " their ",
        " that ", " those ", " this ", " these ",
        "the first", "the second", "the other", "both of",
        "what about", "and this", "and that", "what else",
        "what is it", "why is that", "how does it",
    ]
    return any(s in f" {q} " for s in signals)