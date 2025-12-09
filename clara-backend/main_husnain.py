"""
Clara AI - Support Agent Backend
Main FastAPI Application by Husnain
GPU-Accelerated with HuggingFace Models
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Clara AI - Support Agent API",
    description="AI-Powered Customer Support System with GPU Acceleration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Clara AI Support Agent API",
        "status": "running",
        "version": "1.0.0",
        "developer": "Husnain",
        "gpu_enabled": True
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    import torch
    
    gpu_available = torch.cuda.is_available()
    gpu_name = torch.cuda.get_device_name(0) if gpu_available else "CPU Only"
    
    return {
        "status": "healthy",
        "database": "connected" if os.getenv("SUPABASE_URL") else "not_configured",
        "gpu": {
            "available": gpu_available,
            "device": gpu_name
        }
    }

@app.get("/api/test")
async def test_database():
    """Test Supabase connection"""
    from supabase import create_client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        return {
            "error": "Supabase credentials not configured",
            "message": "Please set SUPABASE_URL and SUPABASE_KEY in .env file"
        }
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        
        # Test query
        response = supabase.table("tickets").select("count").execute()
        
        return {
            "status": "connected",
            "message": "Supabase connection successful!"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


# Include routers
try:
    from agents.support_agent.ticket_api import router as ticket_router
    app.include_router(ticket_router)
    print("✅ Ticket API routes loaded")
except Exception as e:
    print(f"⚠️  Failed to load ticket routes: {e}")

try:
    from agents.support_agent.kb_api import router as kb_router
    app.include_router(kb_router)
    print("✅ Knowledge Base API routes loaded")
except Exception as e:
    print(f"⚠️  Failed to load KB routes: {e}")


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Clara AI Support Agent...")
    print("📚 API Documentation: http://localhost:8001/docs")
    print("💚 Health Check: http://localhost:8001/health")
    uvicorn.run("main_husnain:app", host="0.0.0.0", port=8001, reload=True)
