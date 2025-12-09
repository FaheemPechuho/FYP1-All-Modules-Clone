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
    status: str = "published"
    views_count: int = 0
    helpful_count: int = 0
    not_helpful_count: int = 0
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
    status: Optional[str] = Query("published", description="Filter by status"),
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
            query = query.eq("status", status)
        
        query = query.order("created_at", desc=True).limit(limit)
        
        response = query.execute()
        
        articles = []
        for a in response.data or []:
            articles.append(KBArticle(
                id=str(a["id"]),
                title=a.get("title", ""),
                content=a.get("content"),
                category=a.get("category"),
                status=a.get("status", "published"),
                views_count=a.get("views_count", 0),
                helpful_count=a.get("helpful_count", 0),
                not_helpful_count=a.get("not_helpful_count", 0),
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
            status=a.get("status", "published"),
            views_count=a.get("views_count", 0),
            helpful_count=a.get("helpful_count", 0),
            not_helpful_count=a.get("not_helpful_count", 0),
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
    """Search the knowledge base using AI embeddings"""
    try:
        results = search_kb(q, top_k=top_k)
        
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
