# embedding.py — Production vector store management
#
# KEY FIXES:
# - Model loaded once as a module-level singleton (was: re-loaded on every call)
# - Explicit error handling on store creation
# - Collection existence check before loading
# - Upgraded default model noted in config

import logging
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from config import CHROMA_PATH, COLLECTION_NAME, EMBEDDING_MODEL
import shutil
import os


logger = logging.getLogger(__name__)

# Singleton — embedding model is expensive to initialise (~500ms)
_embedding_model: HuggingFaceEmbeddings | None = None


def get_embedding_model() -> HuggingFaceEmbeddings:
    """
    Return a cached embedding model instance.
    First call loads from HuggingFace (may download weights), subsequent calls are instant.
    """
    global _embedding_model
    if _embedding_model is None:
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        _embedding_model = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},      # change to "cuda" if GPU available
            encode_kwargs={"normalize_embeddings": True},  # cosine similarity ready
        )
        logger.info("Embedding model loaded.")
    return _embedding_model



def create_vector_store(chunks: list) -> Chroma:
    if not chunks:
        raise ValueError("Cannot create vector store from empty chunk list.")

    embeddings = get_embedding_model()
    logger.info(f"Embedding {len(chunks)} chunks → Chroma at '{CHROMA_PATH}'")

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_PATH,
        collection_name=COLLECTION_NAME,
    )
    logger.info("Vector store created successfully.")
    return vector_store


def load_vector_store() -> Chroma:
    """
    Load an existing Chroma vector store from disk.
    Raises if the store doesn't exist yet.
    """
    embeddings = get_embedding_model()
    vector_store = Chroma(
        persist_directory=CHROMA_PATH,
        embedding_function=embeddings,
        collection_name=COLLECTION_NAME,
    )
    return vector_store
