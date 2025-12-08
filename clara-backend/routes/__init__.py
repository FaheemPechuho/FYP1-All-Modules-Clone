"""
API Routes for Clara Multi-Agent Backend

This package contains all FastAPI route definitions.
"""

from .marketing import router as marketing_router

__all__ = ["marketing_router"]

