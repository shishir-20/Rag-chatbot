# multi_query.py — Production multi-query expansion
#
# KEY FIXES:
# - Returns MULTI_QUERY_COUNT from config (was hardcoded 4)
# - Parses output more robustly (strips numbering, bullets, blank lines)
# - Temperature set explicitly for reproducibility
# - Always includes original query as first query (dedup handled downstream)
# - Catches and logs Ollama failures gracefully

import ollama
import re
import logging
from config import OLLAMA_MODEL, MULTI_QUERY_COUNT

logger = logging.getLogger(__name__)

_LIST_PREFIX = re.compile(r"^[\d\-\*\•\.\)]+[\s\.]+")


def generate_multi_queries(question: str) -> list[str]:
    """
    Generate alternative search queries for the given question.

    Why: Different phrasings retrieve different chunks. Combining them
    improves recall, especially for questions where the answer uses
    different terminology than the question.

    Example:
        "What does Article 21 say about privacy?"
        → "Article 21 right to privacy"
        → "personal liberty privacy constitutional provision"
        → "privacy rights fundamental rights India"

    Returns a deduplicated list starting with the original question.
    """
    prompt = f"""Generate {MULTI_QUERY_COUNT} alternative search queries for retrieving document passages relevant to this question.

Rules:
- One query per line
- Each query should use different words/synonyms from the original
- Keep queries concise (under 12 words each)
- No numbering, no bullets, no explanations
- No quotation marks

Question: {question}

Alternative queries:"""

    try:
        response = ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.3},
        )
        raw = response["message"]["content"].strip()
        lines = raw.split("\n")

        queries = []
        for line in lines:
            # Strip list prefixes like "1.", "-", "•", "1)"
            cleaned = _LIST_PREFIX.sub("", line).strip()
            if cleaned and len(cleaned) > 3:
                queries.append(cleaned)

        # Deduplicate while preserving order
        seen = set()
        unique_queries = []
        for q in queries:
            if q.lower() not in seen:
                seen.add(q.lower())
                unique_queries.append(q)

        # Always include the original question first
        final = [question] + [q for q in unique_queries if q.lower() != question.lower()]
        final = final[:MULTI_QUERY_COUNT + 1]  # original + N alternatives

        logger.debug(f"Multi-query expansion: {len(final)} queries for '{question}'")
        return final

    except Exception as e:
        logger.error(f"Multi-query generation failed: {e}. Using original question only.")
        return [question]
