import re
import logging
from rank_bm25 import BM25Okapi

try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.stem import PorterStemmer
    nltk.download("stopwords", quiet=True)
    STOP_WORDS = set(stopwords.words("english"))
    _stemmer = PorterStemmer()
    _USE_NLTK = True
except ImportError:
    logging.warning("NLTK not available. Install with: pip install nltk. Falling back to basic tokenization.")
    STOP_WORDS = set()
    _stemmer = None
    _USE_NLTK = False

logger = logging.getLogger(__name__)


def _tokenize(text: str) -> list[str]:
    """
    Shared tokenizer for both indexing and querying.
    Must be identical in both places — asymmetric tokenization silently kills BM25.

    Pipeline:
    1. Lowercase
    2. Strip non-alphanumeric (handles punctuation, hyphens, slashes)
    3. Split on whitespace
    4. Remove stopwords
    5. Stem (reduces 'protects'→'protect', 'protection'→'protect')
    6. Drop single-character tokens
    """
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = text.split()

    if _USE_NLTK:
        tokens = [
            _stemmer.stem(t)
            for t in tokens
            if t not in STOP_WORDS and len(t) > 1
        ]
    else:
        tokens = [t for t in tokens if len(t) > 1]

    return tokens


def create_bm25_index(chunks: list) -> tuple:
    """
    Build a BM25Okapi index over the provided document chunks.

    Returns:
        (bm25_index, chunks) — chunks returned to ensure index↔chunk alignment
    """
    if not chunks:
        raise ValueError("Cannot build BM25 index from empty chunk list.")

    texts = [doc.page_content for doc in chunks]
    tokenized = [_tokenize(text) for text in texts]

    # Warn about empty token lists (e.g. very short or symbol-heavy chunks)
    empty_count = sum(1 for t in tokenized if not t)
    if empty_count:
        logger.warning(f"BM25: {empty_count}/{len(chunks)} chunks produced empty token lists.")

    bm25 = BM25Okapi(tokenized)
    logger.info(f"BM25 index built: {len(chunks)} chunks, vocab size ≈ {len(bm25.idf)}")
    return bm25, chunks


def bm25_search(query: str, bm25, chunks: list, top_k: int = 10) -> list:
    """
    Run BM25 keyword retrieval.

    Returns top_k chunks with score > 0 (zero-score = no term overlap = noise).
    """
    tokenized_query = _tokenize(query)

    if not tokenized_query:
        logger.warning(f"BM25: query '{query}' produced empty token list after normalization.")
        return []

    scores = bm25.get_scores(tokenized_query)

    # Sort descending, filter zero scores to avoid returning random noise
    ranked = sorted(
        enumerate(scores),
        key=lambda x: x[1],
        reverse=True
    )

    results = [
        chunks[idx]
        for idx, score in ranked[:top_k]
        if score > 0.0
    ]

    logger.debug(f"BM25: query='{query}' → {len(results)} results (top score: {ranked[0][1]:.3f})")
    return results
