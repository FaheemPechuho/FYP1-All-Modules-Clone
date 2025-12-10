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

# New request models for expanded features
class CampaignIdeasRequest(BaseModel):
    industry: str
    goal: str
    budget: float

class OptimizeCampaignRequest(BaseModel):
    campaign_id: str
    campaign_data: Dict[str, Any]

class GenerateSubjectLinesRequest(BaseModel):
    campaign_goal: str
    target_audience: str
    key_benefit: str
    count: int = 5

class GenerateEmailContentRequest(BaseModel):
    subject: str
    goal: str
    audience: str
    tone: str = "professional"

class CreateEmailSequenceRequest(BaseModel):
    sequence_goal: str
    audience: str
    num_emails: int = 3

class GenerateSocialPostRequest(BaseModel):
    platform: str
    topic: str
    goal: str = "engagement"
    include_cta: bool = True

class GenerateHashtagsRequest(BaseModel):
    topic: str
    platform: str
    count: int = 10

class CreateContentCalendarRequest(BaseModel):
    theme: str
    platforms: List[str]
    days: int = 7

# Automation Workflow request models
class SuggestWorkflowRequest(BaseModel):
    goal: str
    trigger_type: str
    audience: str

class OptimizeWorkflowRequest(BaseModel):
    workflow_data: Dict[str, Any]

# A/B Testing request models
class GenerateVariantsRequest(BaseModel):
    test_type: str
    original: str
    goal: str
    num_variants: int = 3

class AnalyzeABTestRequest(BaseModel):
    test_data: Dict[str, Any]

class SuggestTestIdeasRequest(BaseModel):
    channel: str
    current_performance: Dict[str, float]


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
# CAMPAIGN MANAGEMENT ENDPOINTS (Ollama-Powered)
# =============================================================================

@app.post("/api/marketing/campaigns/ideas")
async def generate_campaign_ideas(request: CampaignIdeasRequest):
    """Generate AI-powered campaign ideas using Ollama"""
    try:
        from agents.marketing_agent.campaign_manager import campaign_manager
        result = campaign_manager.generate_campaign_ideas(
            industry=request.industry,
            goal=request.goal,
            budget=request.budget
        )
        return result
    except Exception as e:
        print(f"Error generating campaign ideas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/campaigns/optimize")
async def optimize_campaign(request: OptimizeCampaignRequest):
    """Get AI-powered campaign optimization suggestions using Ollama"""
    try:
        from agents.marketing_agent.campaign_manager import campaign_manager
        result = campaign_manager.optimize_campaign(request.campaign_data)
        return result
    except Exception as e:
        print(f"Error optimizing campaign: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# EMAIL CAMPAIGN ENDPOINTS (Ollama-Powered)
# =============================================================================

@app.post("/api/marketing/email/subject-lines")
async def generate_subject_lines(request: GenerateSubjectLinesRequest):
    """Generate AI-powered email subject lines using Ollama"""
    try:
        from agents.marketing_agent.email_campaign_manager import email_campaign_manager
        result = email_campaign_manager.generate_subject_lines(
            campaign_goal=request.campaign_goal,
            target_audience=request.target_audience,
            key_benefit=request.key_benefit,
            count=request.count
        )
        return {"subject_lines": result}
    except Exception as e:
        print(f"Error generating subject lines: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/email/content")
async def generate_email_content(request: GenerateEmailContentRequest):
    """Generate AI-powered email content using Ollama"""
    try:
        from agents.marketing_agent.email_campaign_manager import email_campaign_manager
        result = email_campaign_manager.generate_email_content(
            subject=request.subject,
            goal=request.goal,
            audience=request.audience,
            tone=request.tone
        )
        return result
    except Exception as e:
        print(f"Error generating email content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/email/sequence")
async def create_email_sequence(request: CreateEmailSequenceRequest):
    """Create AI-powered email sequence using Ollama"""
    try:
        from agents.marketing_agent.email_campaign_manager import email_campaign_manager
        result = email_campaign_manager.create_email_sequence(
            sequence_goal=request.sequence_goal,
            audience=request.audience,
            num_emails=request.num_emails
        )
        return {"sequence": result}
    except Exception as e:
        print(f"Error creating email sequence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# SOCIAL MEDIA ENDPOINTS (Ollama-Powered)
# =============================================================================

@app.post("/api/marketing/social/post")
async def generate_social_post(request: GenerateSocialPostRequest):
    """Generate AI-powered social media post using Ollama"""
    try:
        from agents.marketing_agent.social_media_manager import social_media_manager
        result = social_media_manager.generate_social_post(
            platform=request.platform,
            topic=request.topic,
            goal=request.goal,
            include_cta=request.include_cta
        )
        return result
    except Exception as e:
        print(f"Error generating social post: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/social/hashtags")
async def generate_hashtags(request: GenerateHashtagsRequest):
    """Generate AI-powered hashtags using Ollama"""
    try:
        from agents.marketing_agent.social_media_manager import social_media_manager
        result = social_media_manager.generate_hashtags(
            topic=request.topic,
            platform=request.platform,
            count=request.count
        )
        return {"hashtags": result}
    except Exception as e:
        print(f"Error generating hashtags: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/social/calendar")
async def create_content_calendar(request: CreateContentCalendarRequest):
    """Create AI-powered content calendar using Ollama"""
    try:
        from agents.marketing_agent.social_media_manager import social_media_manager
        result = social_media_manager.create_content_calendar(
            theme=request.theme,
            platforms=request.platforms,
            days=request.days
        )
        return {"calendar": result}
    except Exception as e:
        print(f"Error creating content calendar: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# AUTOMATION WORKFLOW ENDPOINTS (Ollama-Powered)
# =============================================================================

@app.post("/api/marketing/automation/suggest-workflow")
async def suggest_workflow(request: SuggestWorkflowRequest):
    """Generate AI-powered workflow suggestions using Ollama"""
    try:
        from agents.marketing_agent.automation_engine import automation_engine
        result = automation_engine.suggest_workflow(
            goal=request.goal,
            trigger_type=request.trigger_type,
            audience=request.audience
        )
        return result
    except Exception as e:
        print(f"Error suggesting workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/automation/optimize-workflow")
async def optimize_workflow(request: OptimizeWorkflowRequest):
    """Get AI-powered workflow optimization recommendations using Ollama"""
    try:
        from agents.marketing_agent.automation_engine import automation_engine
        result = automation_engine.optimize_workflow(request.workflow_data)
        return result
    except Exception as e:
        print(f"Error optimizing workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/marketing/automation/suggest-triggers/{goal}")
async def suggest_triggers(goal: str):
    """Get AI-powered trigger suggestions for a workflow goal"""
    try:
        from agents.marketing_agent.automation_engine import automation_engine
        result = automation_engine.suggest_triggers(goal)
        return {"triggers": result}
    except Exception as e:
        print(f"Error suggesting triggers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# A/B TESTING ENDPOINTS (Ollama-Powered)
# =============================================================================

@app.post("/api/marketing/ab-testing/generate-variants")
async def generate_variants(request: GenerateVariantsRequest):
    """Generate AI-powered A/B test variants using Ollama"""
    try:
        from agents.marketing_agent.ab_testing_engine import ab_testing_engine
        result = ab_testing_engine.generate_variants(
            test_type=request.test_type,
            original=request.original,
            goal=request.goal,
            num_variants=request.num_variants
        )
        return {"variants": result}
    except Exception as e:
        print(f"Error generating variants: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/ab-testing/analyze-results")
async def analyze_ab_test(request: AnalyzeABTestRequest):
    """Analyze A/B test results with AI insights using Ollama"""
    try:
        from agents.marketing_agent.ab_testing_engine import ab_testing_engine
        result = ab_testing_engine.analyze_results(request.test_data)
        return result
    except Exception as e:
        print(f"Error analyzing A/B test: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/marketing/ab-testing/suggest-test-ideas")
async def suggest_test_ideas(request: SuggestTestIdeasRequest):
    """Get AI-powered A/B test ideas using Ollama"""
    try:
        from agents.marketing_agent.ab_testing_engine import ab_testing_engine
        result = ab_testing_engine.suggest_test_ideas(
            channel=request.channel,
            current_performance=request.current_performance
        )
        return {"test_ideas": result}
    except Exception as e:
        print(f"Error suggesting test ideas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  CLARA MARKETING AGENT API")
    print("  Ollama - Local AI + LangChain")
    print("=" * 60)
    ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
    ollama_model = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")
    print(f"  Ollama URL: {ollama_url}")
    print(f"  Ollama Model: {ollama_model}")
    print(f"  Gemini Fallback: {'✓ Configured' if get_api_key('gemini') else '✗ Not configured'}")
    print("=" * 60)
    
    uvicorn.run(
        "marketing_server:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )

