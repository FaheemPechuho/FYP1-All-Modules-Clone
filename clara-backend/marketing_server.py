"""
Marketing Agent API Server - Standalone LangChain + Gemini
Owner: Sheryar

Simplified FastAPI server for Marketing Agent only.
This bypasses the voice dependencies and runs the marketing agent directly.

Run with: python marketing_server.py
Or: uvicorn marketing_server:app --host 0.0.0.0 --port 8001 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings, get_api_key

# =============================================================================
# FASTAPI APP SETUP
# =============================================================================

app = FastAPI(
    title="Clara Marketing Agent API",
    description="LangChain + Gemini powered Marketing Agent for TrendtialCRM",
    version="1.0.0"
)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# LAZY LOAD MARKETING AGENT
# =============================================================================

_marketing_agent = None

def get_marketing_agent():
    """Lazy load marketing agent to avoid import issues"""
    global _marketing_agent
    if _marketing_agent is None:
        from agents.marketing_agent.agent import MarketingAgent
        _marketing_agent = MarketingAgent()
        print("✓ Marketing Agent initialized with LangChain + Gemini")
    return _marketing_agent


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class GenerateEmailRequest(BaseModel):
    lead_id: str
    email_type: str = "follow_up"
    tone: str = "professional"

class GenerateSMSRequest(BaseModel):
    lead_id: str
    sms_type: str = "quick_follow_up"
    context: str = ""

class GenerateCallScriptRequest(BaseModel):
    lead_id: str
    objective: str = "discovery"

class GenerateAdCopyRequest(BaseModel):
    platform: str = "facebook"
    industry: str = "B2B"
    pain_points: str = ""
    objective: str = "awareness"

class AnalyzeLeadRequest(BaseModel):
    lead_id: str

class AnalyzeBatchRequest(BaseModel):
    stage: Optional[str] = None
    limit: int = 10


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": "Clara Marketing Agent API",
        "version": "1.0.0",
        "status": "operational",
        "llm_provider": "LangChain + Gemini",
        "endpoints": [
            "/health",
            "/api/marketing/generate-email",
            "/api/marketing/generate-sms",
            "/api/marketing/generate-call-script",
            "/api/marketing/generate-ad-copy",
            "/api/marketing/analyze-lead",
            "/api/marketing/campaign-insights"
        ]
    }


@app.get("/health")
async def health():
    """Health check"""
    agent = get_marketing_agent()
    return {
        "status": "healthy",
        "agent": "marketing",
        "provider": agent.content_generator.provider if hasattr(agent, 'content_generator') else "unknown",
        "gemini_key_configured": bool(get_api_key("gemini"))
    }


# =============================================================================
# CONTENT GENERATION ENDPOINTS
# =============================================================================

@app.post("/api/marketing/generate-email")
async def generate_email(request: GenerateEmailRequest):
    """Generate personalized email using LangChain + Gemini"""
    try:
        agent = get_marketing_agent()
        result = agent.generate_email(
            lead_id=request.lead_id,
            email_type=request.email_type,
            tone=request.tone
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/generate-sms")
async def generate_sms(request: GenerateSMSRequest):
    """Generate SMS message using LangChain + Gemini"""
    try:
        agent = get_marketing_agent()
        result = agent.generate_sms(
            lead_id=request.lead_id,
            sms_type=request.sms_type,
            context=request.context
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating SMS: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/generate-call-script")
async def generate_call_script(request: GenerateCallScriptRequest):
    """Generate cold call script using LangChain + Gemini"""
    try:
        agent = get_marketing_agent()
        result = agent.generate_cold_call_script(
            lead_id=request.lead_id,
            objective=request.objective
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating call script: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/generate-ad-copy")
async def generate_ad_copy(request: GenerateAdCopyRequest):
    """Generate platform-specific ad copy using LangChain + Gemini"""
    try:
        agent = get_marketing_agent()
        result = agent.generate_ad_copy(
            platform=request.platform,
            industry=request.industry,
            pain_points=request.pain_points,
            objective=request.objective
        )
        return result
    except Exception as e:
        print(f"Error generating ad copy: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# LEAD ANALYSIS ENDPOINTS
# =============================================================================

@app.post("/api/marketing/analyze-lead")
async def analyze_lead(request: AnalyzeLeadRequest):
    """Analyze a lead - get temperature, priority, recommendations"""
    try:
        agent = get_marketing_agent()
        result = agent.analyze_lead(request.lead_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/analyze-batch")
async def analyze_batch(request: AnalyzeBatchRequest):
    """Analyze multiple leads"""
    try:
        agent = get_marketing_agent()
        return agent.analyze_leads_batch(stage=request.stage, limit=request.limit)
    except Exception as e:
        print(f"Error analyzing batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/marketing/campaign-insights")
async def get_campaign_insights():
    """Get campaign performance insights"""
    try:
        agent = get_marketing_agent()
        return agent.get_campaign_insights()
    except Exception as e:
        print(f"Error getting campaign insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/marketing/nurturing-sequence/{lead_id}")
async def get_nurturing_sequence(lead_id: str):
    """Get nurturing sequence for a lead"""
    try:
        agent = get_marketing_agent()
        result = agent.get_nurturing_sequence(lead_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting nurturing sequence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  CLARA MARKETING AGENT API")
    print("  LangChain + Google Gemini")
    print("=" * 60)
    print(f"  Gemini API Key: {'✓ Configured' if get_api_key('gemini') else '✗ Not configured'}")
    print("=" * 60)
    
    uvicorn.run(
        "marketing_server:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )

