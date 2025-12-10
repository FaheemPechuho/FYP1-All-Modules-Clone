"""
Knowledge Base API - Support Agent
Husnain's Implementation
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from .kb_search import search_kb

load_dotenv()

router = APIRouter(prefix="/api/kb", tags=["Knowledge Base"])

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if supabase_url and supabase_key:
    supabase: Client = create_client(supabase_url, supabase_key)
else:
    supabase = None


# ─────────────────────────────────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────────────────────────────────

class KBArticle(BaseModel):
    id: str
    title: str
    content: Optional[str] = None
    category: Optional[str] = None
    state: str = "published"  # DB column is 'state' not 'status'
    view_count: int = 0  # DB column is 'view_count' not 'views_count'
    helpful_count: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class KBCategory(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    articles_count: int = 0
    is_active: bool = True


class KBSearchResult(BaseModel):
    chunk_id: str
    score: float
    content: str
    article_title: Optional[str]
    article_category: Optional[str]


# ─────────────────────────────────────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────

@router.get("/articles", response_model=List[KBArticle])
async def list_articles(
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query("published", description="Filter by state"),
    limit: int = Query(50, le=100, description="Number of articles")
):
    """List knowledge base articles with optional filters"""
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        query = supabase.table("kb_articles").select("*")
        
        if category:
            query = query.eq("category", category)
        
        if status:
            query = query.eq("state", status)  # Use 'state' column
        
        query = query.order("created_at", desc=True).limit(limit)
        
        response = query.execute()
        
        articles = []
        for a in response.data or []:
            articles.append(KBArticle(
                id=str(a["id"]),
                title=a.get("title", ""),
                content=a.get("content"),
                category=a.get("category"),
                state=a.get("state", "published"),  # Use 'state' column
                view_count=a.get("view_count", 0),  # Use 'view_count' column
                helpful_count=a.get("helpful_count", 0),
                created_at=a.get("created_at"),
                updated_at=a.get("updated_at"),
            ))
        
        return articles
        
    except Exception as e:
        raise HTTPException(500, f"Error listing articles: {str(e)}")


@router.get("/articles/{article_id}", response_model=KBArticle)
async def get_article(article_id: str):
    """Get a single knowledge base article"""
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        response = supabase.table("kb_articles").select("*").eq("id", article_id).execute()
        
        if not response.data:
            raise HTTPException(404, "Article not found")
        
        a = response.data[0]
        return KBArticle(
            id=str(a["id"]),
            title=a.get("title", ""),
            content=a.get("content"),
            category=a.get("category"),
            state=a.get("state", "published"),  # Use 'state' column
            view_count=a.get("view_count", 0),  # Use 'view_count' column
            helpful_count=a.get("helpful_count", 0),
            created_at=a.get("created_at"),
            updated_at=a.get("updated_at"),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error getting article: {str(e)}")


@router.get("/categories", response_model=List[KBCategory])
async def list_categories():
    """List knowledge base categories"""
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        # Get unique categories from articles
        response = supabase.table("kb_articles").select("category").execute()
        
        categories_count = {}
        for a in response.data or []:
            cat = a.get("category") or "general"
            categories_count[cat] = categories_count.get(cat, 0) + 1
        
        categories = []
        for idx, (name, count) in enumerate(categories_count.items()):
            categories.append(KBCategory(
                id=str(idx),
                name=name.replace("_", " ").title(),
                slug=name.lower().replace(" ", "-"),
                description=f"Articles about {name}",
                articles_count=count,
                is_active=True,
            ))
        
        return categories
        
    except Exception as e:
        raise HTTPException(500, f"Error listing categories: {str(e)}")


@router.get("/search", response_model=List[KBSearchResult])
async def search_knowledge_base(
    q: str = Query(..., min_length=2, description="Search query"),
    top_k: int = Query(5, le=20, description="Number of results")
):
    """Search the knowledge base.

    Primary path:
        - Use embedding-based semantic search via search_kb (kb_embeddings table).

    Fallback path (when embeddings are not yet built or search_kb returns nothing):
        - Do a simple ILIKE text search over kb_articles.title/content
        - Still return KBSearchResult objects so the frontend continues to work.
    """

    # First, try the embedding-based search helper
    results = []
    try:
        results = search_kb(q, top_k=top_k)
    except Exception:
        # If the embedding path fails for any reason, we fall back to SQL search below
        results = []

    # If we have embedding-based results, return them directly
    if results:
        return [
            KBSearchResult(
                chunk_id=r.get("chunk_id", ""),
                score=r.get("score", 0.0),
                content=r.get("content", ""),
                article_title=r.get("article_title"),
                article_category=r.get("article_category"),
            )
            for r in results
        ]

    # ---------- Fallback: simple text search on kb_articles ----------
    if not supabase:
        raise HTTPException(500, "Database not configured")

    try:
        # Use ILIKE on title and content for a basic keyword search.
        # Instead of matching the full phrase, we split into words so that
        # queries like "password reset" still match content that contains
        # "password" and/or "reset" separately.

        # Split query into simple terms (words), ignoring very short tokens
        terms = [t.strip() for t in q.split() if len(t.strip()) >= 2]
        if not terms:
            terms = [q.strip()]

        or_clauses: list[str] = []
        for term in terms:
            pattern = f"%{term}%"
            or_clauses.append(f"title.ilike.{pattern}")
            or_clauses.append(f"content.ilike.{pattern}")

        or_expression = ",".join(or_clauses)

        response = (
            supabase
            .table("kb_articles")
            .select("id, title, content, category")
            .or_(or_expression)
            .limit(top_k)
            .execute()
        )

        fallback_results: List[KBSearchResult] = []
        for row in response.data or []:
            fallback_results.append(
                KBSearchResult(
                    chunk_id=str(row.get("id")),
                    # We don't have a real similarity score here, so return a neutral 0.5
                    score=0.5,
                    content=row.get("content", ""),
                    article_title=row.get("title"),
                    article_category=row.get("category"),
                )
            )

        return fallback_results

    except Exception as e:
        raise HTTPException(500, f"Error searching KB: {str(e)}")


@router.get("/stats")
async def get_kb_stats():
    """Get knowledge base statistics"""
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        # Total articles
        articles_res = supabase.table("kb_articles").select("id", count="exact").execute()
        total_articles = articles_res.count or 0
        
        # Total chunks
        chunks_res = supabase.table("kb_chunks").select("id", count="exact").execute()
        total_chunks = chunks_res.count or 0
        
        return {
            "total_articles": total_articles,
            "total_chunks": total_chunks,
            "embeddings_model": "all-MiniLM-L12-v2",
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error getting KB stats: {str(e)}")
