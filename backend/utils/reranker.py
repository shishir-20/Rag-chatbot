# reranker.py — Production cross-encoder reranker
#
# KEY FIXES:
# - Model loaded once as module-level singleton
# - Threshold is a hard FLOOR at deeply negative logits only (-5.0)
#   Why: ms-marco-MiniLM-L-6-v2 outputs raw logits. Score of 0.2 is
#   NOT "20% confidence" — it's a logit. Most genuinely relevant pairs
#   score between -2 and +10. The old 0.2 threshold was blocking real results.
# - Returns all scores, not just best — lets caller make decisions
# - Handles empty doc list explicitly

import logging
from sentence_transformers import CrossEncoder
from config import TOP_K_RERANK, RERANKER_HARD_FLOOR

logger = logging.getLogger(__name__)

# Singleton — CrossEncoder loads a neural network; don't reload per request
_reranker: CrossEncoder | None = None


def _get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        logger.info("Loading cross-encoder reranker...")
        _reranker = CrossEncoder(
            "cross-encoder/ms-marco-MiniLM-L-6-v2",
            max_length=512,
        )
        logger.info("Reranker loaded.")
    return _reranker


def rerank_docs(query: str, docs: list, top_k: int = TOP_K_RERANK) -> tuple[list, float, bool]:
    """
    Rerank retrieved documents using cross-encoder.

    Returns:
        top_docs    — top_k documents after reranking
        best_score  — raw logit of the best document (for logging/debugging only)
        is_relevant — True if best_score > RERANKER_HARD_FLOOR
                      (only False when ALL results are deeply irrelevant)

    IMPORTANT: Do NOT gate answers on `best_score` alone.
    The cross-encoder score is a logit, not a calibrated probability.
    Let the LLM decide whether context is sufficient — it's better at it.
    Only use `is_relevant=False` as a last-resort safety net.
    """
    if not docs:
        return [], float("-inf"), False

    reranker = _get_reranker()

    pairs = [(query, doc.page_content) for doc in docs]

    try:
        scores = reranker.predict(pairs)
    except Exception as e:
        logger.error(f"Reranker prediction failed: {e}. Returning docs in original order.")
        return docs[:top_k], 0.0, True

    scored_docs = sorted(zip(scores, docs), key=lambda x: x[0], reverse=True)

    best_score = float(scored_docs[0][0]) if scored_docs else float("-inf")

    # Only reject if the best result is deeply, unambiguously irrelevant
    is_relevant = best_score > RERANKER_HARD_FLOOR

    top_docs = [doc for _, doc in scored_docs[:top_k]]

    logger.debug(
        f"Reranker: {len(docs)} docs → top {len(top_docs)}, "
        f"best score: {best_score:.3f}, relevant: {is_relevant}"
    )

    return top_docs, best_score, is_relevant
