# pdf_reader.py — Production PDF reader with document cleaning
#
# KEY FIXES:
# - Strips common PDF artifacts: page numbers, lone numbers, excessive whitespace
# - Preserves source + page metadata
# - Skips blank/near-blank pages (useless chunks otherwise)
# - Normalises unicode characters that confuse embeddings

import re
import os
import tempfile
import logging
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

# Patterns that indicate a line is likely a PDF artifact, not content
_ARTIFACT_PATTERNS = [
    r"^\s*\d+\s*$",                    # lone page number line
    r"^\s*page\s+\d+\s*(of\s+\d+)?\s*$",  # "Page 3" or "Page 3 of 10"
    r"^[\s\-_=]{0,5}$",               # blank or separator lines
]
_ARTIFACT_RE = re.compile("|".join(_ARTIFACT_PATTERNS), re.IGNORECASE)


def _clean_text(text: str) -> str:
    """
    Clean extracted PDF text without destroying content:
    1. Normalise unicode (smart quotes → straight, em-dash → hyphen, etc.)
    2. Remove artifact lines (page numbers, separators)
    3. Collapse runs of whitespace / blank lines
    4. Strip leading/trailing whitespace
    """
    # Normalise common unicode characters
    replacements = {
        "\u2018": "'", "\u2019": "'",   # smart single quotes
        "\u201c": '"', "\u201d": '"',   # smart double quotes
        "\u2014": "-", "\u2013": "-",   # em/en dash
        "\u00a0": " ",                  # non-breaking space
        "\u2022": "-",                  # bullet
        "\ufffd": "",                   # replacement character
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    # Filter artifact lines
    lines = text.split("\n")
    cleaned_lines = [line for line in lines if not _ARTIFACT_RE.match(line)]

    # Collapse 3+ consecutive blank lines → 2 (preserve paragraph breaks)
    text = "\n".join(cleaned_lines)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse multiple spaces
    text = re.sub(r"[ \t]{2,}", " ", text)

    return text.strip()


def read_pdf(pdf_files) -> list[Document]:
    """
    Load and clean a list of PDF file objects (from Flask request.files).

    Returns a flat list of Document objects, one per page, with metadata:
        - source: original filename
        - page: 0-based page number
    """
    documents = []

    for pdf in pdf_files:
        filename = getattr(pdf, "filename", getattr(pdf, "name", "unknown.pdf"))
        logger.info(f"Loading PDF: {filename}")

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(pdf.read())
                tmp_path = tmp.name

            loader = PyPDFLoader(tmp_path)
            raw_docs = loader.load()

        except Exception as e:
            logger.error(f"Failed to load {filename}: {e}")
            continue
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        skipped = 0
        for doc in raw_docs:
            cleaned = _clean_text(doc.page_content)

            # Skip pages with negligible content (< 50 chars after cleaning)
            if len(cleaned) < 50:
                skipped += 1
                continue

            doc.page_content = cleaned
            doc.metadata["source"] = filename
            # Ensure page key exists
            doc.metadata.setdefault("page", doc.metadata.get("page", 0))
            documents.append(doc)

        logger.info(
            f"Loaded {filename}: {len(raw_docs)} pages → "
            f"{len(raw_docs) - skipped} kept, {skipped} skipped (too short)"
        )

    if not documents:
        raise ValueError("No readable content found in uploaded PDFs.")

    return documents
