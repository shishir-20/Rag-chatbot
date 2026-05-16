# retrieval.py — Production hybrid retrieval with Reciprocal Rank Fusion (RRF)
#
# KEY FIXES:
# - Reciprocal Rank Fusion (RRF) replaces naive concatenation
#   Why: BM25 scores and dense scores live in completely different ranges.
#   Naive concat gives equal weight to whatever shows up more. RRF is
#   rank-based, so it's immune to score scale differences.
# - Deduplication by parent_hash (fast) instead of string equality (slow)
# - Dense retrieval returns scores for RRF ranking
# - Proper logging of retrieval stats

import logging
from bm25 import bm25_search
from multi_query import generate_multi_queries
from config import TOP_K_DENSE, TOP_K_BM25

logger = logging.getLogger(__name__)

# RRF constant — controls influence of lower-ranked documents
# Standard value is 60. Lower = more top-heavy. Don't tune this without data.
_RRF_K = 60


def _reciprocal_rank_fusion(ranked_lists: list[list]) -> list:
    """
    Merge multiple ranked document lists using Reciprocal Rank Fusion.

    For each document d across all lists:
        RRF_score(d) = Σ 1 / (k + rank(d, list_i))

    Where rank is 1-based position in each list.
    Documents not in a list contribute 0 for that list.

    This is the gold standard for combining heterogeneous ranked lists.
    """
    scores: dict[str, float] = {}
    doc_map: dict[str, object] = {}

    for ranked_list in ranked_lists:
        for rank, doc in enumerate(ranked_list, start=1):
            # Use parent_hash as stable identity key
            doc_id = doc.metadata.get("parent_hash") or hash(doc.page_content)
            doc_id = str(doc_id)

            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (_RRF_K + rank)
            doc_map[doc_id] = doc

    # Sort by descending RRF score
    sorted_ids = sorted(scores, key=lambda k: scores[k], reverse=True)
    return [doc_map[doc_id] for doc_id in sorted_ids]


def dense_search(query: str, vector_store, top_k: int = TOP_K_DENSE) -> list:
    """Dense semantic retrieval — returns ranked list of child chunks."""
    try:
        docs_with_scores = vector_store.similarity_search_with_score(query, k=top_k)
        # similarity_search_with_score returns (doc, distance) — lower distance = better
        # Sort ascending on distance to get ranked list
        docs_with_scores.sort(key=lambda x: x[1])
        return [doc for doc, _ in docs_with_scores]
    except Exception as e:
        logger.error(f"Dense search failed for query '{query}': {e}")
        return []


def _reconstruct_parents(docs: list) -> list:
    """
    Replace child chunk content with parent content (parent-child reconstruction).
    Deduplicates by parent_hash to avoid passing the same parent multiple times.
    """
    seen_hashes = set()
    parent_docs = []

    for doc in docs:
        parent_hash = doc.metadata.get("parent_hash")
        parent_content = doc.metadata.get("parent_content")

        if parent_hash and parent_hash not in seen_hashes and parent_content:
            seen_hashes.add(parent_hash)
            # Mutate a copy — don't modify the original chunk
            from langchain_core.documents import Document
            parent_doc = Document(
                page_content=parent_content,
                metadata={**doc.metadata},
            )
            parent_docs.append(parent_doc)
        elif not parent_content:
            # No parent available — use child as-is
            if doc.page_content not in seen_hashes:
                seen_hashes.add(doc.page_content)
                parent_docs.append(doc)

    return parent_docs


def hybrid_retrieve(
    query: str,
    vector_store,
    bm25,
    chunks: list,
) -> list:
    """
    Full hybrid retrieval pipeline:
    1. Generate multi-query variants
    2. For each variant: run dense + BM25 retrieval
    3. Merge all ranked lists with RRF
    4. Reconstruct parent chunks (deduplicated)

    Returns parent-level documents ready for reranking.
    """
    queries = generate_multi_queries(query)
    logger.debug(f"Hybrid retrieve: {len(queries)} queries")

    all_ranked_lists = []

    for q in queries:
        dense_docs = dense_search(q, vector_store, top_k=TOP_K_DENSE)
        bm25_docs = bm25_search(q, bm25, chunks, top_k=TOP_K_BM25)

        if dense_docs:
            all_ranked_lists.append(dense_docs)
        if bm25_docs:
            all_ranked_lists.append(bm25_docs)

    if not all_ranked_lists:
        logger.warning(f"Hybrid retrieve: no results for query '{query}'")
        return []

    # Fuse all ranked lists with RRF
    fused = _reciprocal_rank_fusion(all_ranked_lists)
    logger.debug(f"RRF fusion: {sum(len(l) for l in all_ranked_lists)} total → {len(fused)} unique child chunks")

    # Reconstruct parent chunks
    parents = _reconstruct_parents(fused)
    logger.info(f"Hybrid retrieve: {len(parents)} unique parent chunks returned")

    return parents
