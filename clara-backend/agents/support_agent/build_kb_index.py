"""
Build Knowledge Base Index (Phase 2B.2)

This script:
- Reads published articles from `kb_articles`
- Splits each article into smaller text chunks
- Uses `all-MiniLM-L12-v2` to create embeddings for each chunk
- Stores chunks in `kb_chunks` and `kb_embeddings`

Run from clara-backend folder:
    python -m agents.support_agent.build_kb_index
"""

import os
from typing import List, Dict, Tuple

# IMPORTANT: tell transformers / sentence-transformers to use ONLY PyTorch
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["USE_TF"] = "0"

from dotenv import load_dotenv
import torch
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials not found in environment")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Embedding model (384-dim, good quality)
EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L12-v2"
_model: SentenceTransformer | None = None


def get_model() -> SentenceTransformer:
    """Load the sentence-transformer model once (CPU or GPU)."""
    global _model
    if _model is None:
        # Use GPU only if PyTorch reports that CUDA is actually available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _model = SentenceTransformer(EMBED_MODEL_NAME, device=device)
    return _model


def fetch_published_articles() -> List[Dict]:
    """Fetch published kb_articles from Supabase."""
    res = supabase.table("kb_articles").select("id, title, content, state").eq("state", "published").execute()
    return res.data or []


def split_into_chunks(text: str, max_chars: int = 600) -> List[str]:
    """Split long article text into smaller chunks.

    We keep this logic very simple and easy to understand:
    - First split by blank lines (paragraphs)
    - Then group paragraphs together until we reach ~max_chars
    """

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        if not current:
            current = para
            continue

        # If adding the next paragraph would make the chunk too long,
        # start a new chunk.
        if len(current) + 2 + len(para) > max_chars:
            chunks.append(current)
            current = para
        else:
            current = current + "\n\n" + para

    if current:
        chunks.append(current)

    return chunks


def embed_chunks(article_id: str, chunks: List[str]) -> None:
    """Store chunks + embeddings for a single article."""

    if not chunks:
        return

    model = get_model()

    # Compute embeddings (returns a list of 384-dim vectors)
    embeddings = model.encode(chunks, show_progress_bar=False).tolist()

    # Insert chunks and embeddings one by one (simple, clear logic)
    for order_idx, (chunk_text, emb) in enumerate(zip(chunks, embeddings)):
        chunk_payload = {
            "article_id": article_id,
            "content": chunk_text,
            "order_idx": order_idx,
        }

        chunk_res = supabase.table("kb_chunks").insert(chunk_payload).execute()
        if not chunk_res.data:
            continue

        chunk_id = chunk_res.data[0]["id"]

        embed_payload = {
            "chunk_id": chunk_id,
            "embedding": emb,
            "model": EMBED_MODEL_NAME,
        }
        supabase.table("kb_embeddings").insert(embed_payload).execute()


def clear_existing_index() -> None:
    """Optional: clear old chunks + embeddings before rebuilding.

    We call this once at the beginning so the index matches current articles.
    """

    supabase.table("kb_embeddings").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    supabase.table("kb_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()


def main() -> None:
    print("Fetching published articles...")
    articles = fetch_published_articles()
    print(f"Found {len(articles)} articles.")

    if not articles:
        print("No published kb_articles found. Run seed_kb_faqs first.")
        return

    print("Clearing existing KB index (chunks + embeddings)...")
    clear_existing_index()

    processed_articles = 0
    total_chunks = 0

    for art in articles:
        article_id = art["id"]
        title = art.get("title", "(no title)")
        content = art.get("content") or ""

        chunks = split_into_chunks(content)
        embed_chunks(article_id, chunks)

        processed_articles += 1
        total_chunks += len(chunks)
        print(f"Indexed '{title}' with {len(chunks)} chunks.")

    print(f"Done. Processed {processed_articles} articles and created {total_chunks} chunks.")


if __name__ == "__main__":
    main()
