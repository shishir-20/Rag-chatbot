# chunking.py — Production parent-child chunking
#
# KEY FIXES:
# - Parent_id stored as integer, not relying on string comparison for dedup
# - Content hash stored in metadata for fast deduplication downstream
# - Source + page metadata propagated from parent → child
# - Logging for visibility
# - Validation: warns if chunk count is suspiciously low

import hashlib
import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from config import PARENT_CHUNK_SIZE, PARENT_CHUNK_OVERLAP, CHILD_CHUNK_SIZE, CHILD_CHUNK_OVERLAP

logger = logging.getLogger(__name__)


def _content_hash(text: str) -> str:
    """Short MD5 hash of content — used for fast deduplication."""
    return hashlib.md5(text.encode("utf-8")).hexdigest()[:12]


def create_chunks(documents: list[Document]) -> list[Document]:
    """
    Two-level chunking strategy:
    - Parent chunks (1500 chars): stored in child metadata for context reconstruction
    - Child chunks (400 chars): what gets embedded and retrieved

    Each child carries:
        parent_id       → integer index into parent list
        parent_content  → full text of parent (for reconstruction)
        parent_hash     → MD5 hash of parent content (for deduplication)
        source          → original filename
        page            → original page number

    Returns child chunks (what goes into the vector store and BM25 index).
    """
    if not documents:
        raise ValueError("Cannot chunk empty document list.")

    parent_splitter = RecursiveCharacterTextSplitter(
        chunk_size=PARENT_CHUNK_SIZE,
        chunk_overlap=PARENT_CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    child_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHILD_CHUNK_SIZE,
        chunk_overlap=CHILD_CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    parent_chunks = parent_splitter.split_documents(documents)
    logger.info(f"Chunking: {len(documents)} pages → {len(parent_chunks)} parent chunks")

    child_chunks: list[Document] = []

    for parent_idx, parent in enumerate(parent_chunks):
        parent_hash = _content_hash(parent.page_content)
        children = child_splitter.split_documents([parent])

        for child in children:
            child.metadata.update({
                "parent_id": parent_idx,
                "parent_content": parent.page_content,
                "parent_hash": parent_hash,
                # Propagate source metadata explicitly
                "source": parent.metadata.get("source", "unknown"),
                "page": parent.metadata.get("page", 0),
            })
            child_chunks.append(child)

    logger.info(f"Chunking: {len(parent_chunks)} parents → {len(child_chunks)} child chunks")

    if len(child_chunks) < 5:
        logger.warning(
            f"Only {len(child_chunks)} chunks created from {len(documents)} pages. "
            "Check PDF quality / cleaning pipeline."
        )

    return child_chunks
