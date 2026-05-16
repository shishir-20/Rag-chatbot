# config.py — Production Configuration

CHROMA_PATH = "vectorstore/chroma_db"
COLLECTION_NAME = "rag_documents"

# Upgraded embedding model: better semantic resolution than all-MiniLM-L6-v2
# Swap to 'BAAI/bge-base-en-v1.5' for even better quality at slight speed cost
EMBEDDING_MODEL = "sentence-transformers/all-mpnet-base-v2"

OLLAMA_MODEL = "llama3.2:1b"


# Parent chunks: large enough for full context
PARENT_CHUNK_SIZE = 1500
PARENT_CHUNK_OVERLAP = 200

# Child chunks: small enough for precise retrieval
CHILD_CHUNK_SIZE = 400
CHILD_CHUNK_OVERLAP = 80

# Retrieval
TOP_K_DENSE = 10          # Dense results per query
TOP_K_BM25 = 10           # BM25 results per query
TOP_K_RERANK = 5          # Final docs sent to LLM after reranking
MULTI_QUERY_COUNT = 3     # Number of alternative queries to generate

# Reranker — only reject if score is deeply negative (truly irrelevant)
# ms-marco-MiniLM-L-6-v2 raw logit scale:
#   > 5  → strongly relevant
#   0–5  → moderately relevant
#   < -5 → likely irrelevant
# DO NOT set this above 0 — it causes false negatives
RERANKER_HARD_FLOOR = -5.0

# Conversation memory: how many past turns to include in context
MEMORY_WINDOW = 4
