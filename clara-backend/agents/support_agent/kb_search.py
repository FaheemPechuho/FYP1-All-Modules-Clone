"""
Knowledge Base Search Helper (Phase 2B.3)

This module:
- Uses the same embedding model (`all-MiniLM-L12-v2`) as the index builder
- Fetches all KB embeddings from Supabase (good enough for ~hundreds of chunks)
- Computes cosine similarity in Python
- Returns the top matching chunks with basic article info

Used by the "answer ticket" endpoint to retrieve relevant context.
"""

import os
import json
from typing import List, Dict, Any

# IMPORTANT: force Transformers/SentenceTransformers to use only PyTorch
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["USE_TF"] = "0"

import torch
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials not found in environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Same embedding model as in build_kb_index
EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L12-v2"
_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """Load the embedding model once (CPU-only is fine)."""
    global _model
    if _model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _model = SentenceTransformer(EMBED_MODEL_NAME, device=device)
    return _model


def _cosine_similarity(a: torch.Tensor, b: torch.Tensor) -> float:
    """Compute cosine similarity between two 1D tensors."""
    a_norm = a / (a.norm() + 1e-8)
    b_norm = b / (b.norm() + 1e-8)
    return float((a_norm * b_norm).sum().item())


def embed_question(text: str) -> torch.Tensor:
    """Embed the user question (or ticket text) as a single vector."""
    model = get_model()
    vec = model.encode([text], convert_to_tensor=True)[0]
    return vec


def fetch_all_embeddings() -> List[Dict[str, Any]]:
    """Fetch all kb_embeddings rows.

    For our small KB (tens/hundreds of chunks), it is OK to load all
    embeddings into memory and compute similarity in Python.
    """
    res = supabase.table("kb_embeddings").select("id, chunk_id, embedding, model").execute()
    return res.data or []


def fetch_chunks_by_ids(chunk_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """Fetch kb_chunks for the given IDs and return a dict[id] = row."""
    if not chunk_ids:
        return {}

    res = supabase.table("kb_chunks").select("id, article_id, content, order_idx").in_("id", chunk_ids).execute()
    rows = res.data or []
    return {row["id"]: row for row in rows}


def fetch_articles_by_ids(article_ids: List[str]) -> Dict[str, Dict[str, Any]]:
    """Fetch kb_articles for the given IDs and return a dict[id] = row."""
    if not article_ids:
        return {}

    res = supabase.table("kb_articles").select("id, title, category").in_("id", article_ids).execute()
    rows = res.data or []
    return {row["id"]: row for row in rows}


def search_kb(question: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Search the KB for the most relevant chunks.

    Returns a list of dicts with:
    - chunk_id
    - content
    - score
    - article_title
    - article_category
    """
    if not question.strip():
        return []

    q_vec = embed_question(question)

    all_embs = fetch_all_embeddings()
    if not all_embs:
        return []

    # Compute cosine similarity between question and every chunk embedding
    scored: List[Dict[str, Any]] = []
    for row in all_embs:
        raw_emb = row.get("embedding")
        if raw_emb is None:
            continue

        # Supabase may return the embedding in different formats
        # - as a Python list of floats
        # - as a list of strings
        # - as a JSON string like "[0.1, 0.2, ...]"
        try:
            if isinstance(raw_emb, str):
                # Try to parse JSON string
                emb_list = json.loads(raw_emb)
            else:
                emb_list = raw_emb

            # Ensure we have a list of floats
            emb_list = [float(x) for x in emb_list]
        except Exception:
            # Skip malformed embeddings instead of crashing
            continue

        emb_tensor = torch.tensor(emb_list, dtype=torch.float32)
        score = _cosine_similarity(q_vec, emb_tensor)
        scored.append({"chunk_id": row["chunk_id"], "score": score})

    # Sort by score descending and keep top_k
    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:top_k]

    chunk_ids = [x["chunk_id"] for x in top]
    chunks = fetch_chunks_by_ids(chunk_ids)
    article_ids = list({row["article_id"] for row in chunks.values()})
    articles = fetch_articles_by_ids(article_ids)

    results: List[Dict[str, Any]] = []
    for item in top:
        ch = chunks.get(item["chunk_id"])
        if not ch:
            continue
        art = articles.get(ch["article_id"], {})
        results.append(
            {
                "chunk_id": item["chunk_id"],
                "score": item["score"],
                "content": ch.get("content", ""),
                "article_title": art.get("title"),
                "article_category": art.get("category"),
            }
        )

    return results
