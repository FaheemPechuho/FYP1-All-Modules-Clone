"""
=============================================================================
MARKETING AGENT - API ROUTES (LangChain + Gemini)
Owner: Sheryar

FastAPI routes for the Marketing Agent.
All routes connect to the LangChain-powered Marketing Agent backend.

Features:
- Lead analysis with temperature scoring
- AI content generation (emails, SMS, call scripts, ads)
- Campaign insights and analytics
- Nurturing sequence recommendations
=============================================================================
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from utils.logger import get_logger

logger = get_logger("marketing_routes")

router = APIRouter(prefix="/api/marketing", tags=["Marketing Agent"])

# Lazy load marketing agent to avoid import issues at startup
_marketing_agent = None

def get_marketing_agent():
    """Lazy load marketing agent"""
    global _marketing_agent
    if _marketing_agent is None:
        from agents.marketing_agent import MarketingAgent
        _marketing_agent = MarketingAgent()
        logger.info("Marketing Agent loaded for API routes")
    return _marketing_agent


# =============================================================================
# REQUEST MODELS
# =============================================================================

class AnalyzeLeadRequest(BaseModel):
    lead_id: str

class AnalyzeBatchRequest(BaseModel):
    stage: Optional[str] = None
    limit: int = 10

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
    industry: str = ""
    pain_points: str = ""
    objective: str = "awareness"

class BatchContentRequest(BaseModel):
    stage: str
    content_type: str
    limit: int = 10
    email_type: Optional[str] = "follow_up"
    tone: Optional[str] = "professional"
    sms_type: Optional[str] = "quick_follow_up"
    objective: Optional[str] = "discovery"

class LeadsByTemperatureRequest(BaseModel):
    temperature: str = "hot"
    limit: int = 10


# =============================================================================
# LEAD ANALYSIS ENDPOINTS
# =============================================================================

@router.post("/analyze-lead")
async def analyze_lead(request: AnalyzeLeadRequest):
    """
    Analyze a single lead - get temperature, priority, recommendations.
    
    Uses the LeadAnalyzer to score and classify leads based on:
    - Deal value
    - Pipeline stage
    - Recency of interaction
    - Lead score
    
    Returns temperature (hot/warm/cold), priority score, and recommended actions.
    """
    try:
        agent = get_marketing_agent()
        result = agent.analyze_lead(request.lead_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-batch")
async def analyze_batch(request: AnalyzeBatchRequest):
    """
    Analyze multiple leads from a pipeline stage.
    
    Returns prioritized list of leads with temperature scores,
    risk assessments, and recommended actions for each.
    """
    try:
        agent = get_marketing_agent()
        return agent.analyze_leads_batch(stage=request.stage, limit=request.limit)
    except Exception as e:
        logger.error(f"Error analyzing batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lead-temperature/{lead_id}")
async def get_lead_temperature(lead_id: str):
    """
    Get temperature classification of a specific lead.
    
    Quick endpoint to just get temperature (hot/warm/cold) and priority
    without full analysis details.
    """
    try:
        agent = get_marketing_agent()
        result = agent.analyze_lead(lead_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return {
            "lead_id": lead_id,
            "temperature": result.get("temperature"),
            "temperature_score": result.get("temperature_score"),
            "priority": result.get("priority")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lead temperature: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# CONTENT GENERATION ENDPOINTS (LangChain + Gemini)
# =============================================================================

@router.post("/generate-email")
async def generate_email(request: GenerateEmailRequest):
    """
    Generate personalized email for a lead using LangChain + Gemini.
    
    Args:
        lead_id: ID of the lead to generate email for
        email_type: Type of email (follow_up, intro, proposal, etc.)
        tone: Tone of email (professional, friendly, casual, etc.)
    
    Returns:
        Generated email with subject, body, CTA, and signature.
    """
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
        logger.error(f"Error generating email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-sms")
async def generate_sms(request: GenerateSMSRequest):
    """
    Generate SMS message for a lead using LangChain + Gemini.
    
    Returns SMS text with character count and urgency level.
    """
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
        logger.error(f"Error generating SMS: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-call-script")
async def generate_call_script(request: GenerateCallScriptRequest):
    """
    Generate cold call script for a lead using LangChain + Gemini.
    
    Returns complete script with:
    - Opener and introduction
    - Value proposition
    - Qualifying questions
    - Objection handlers
    - Closing and voicemail script
    """
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
        logger.error(f"Error generating call script: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-ad-copy")
async def generate_ad_copy(request: GenerateAdCopyRequest):
    """
    Generate platform-specific ad copy using LangChain + Gemini.
    
    Supports: facebook, tiktok, linkedin, google
    
    Returns:
    - Headlines
    - Primary text
    - Description
    - CTA button text
    - Hooks
    - Hashtags
    - A/B variations
    """
    try:
        agent = get_marketing_agent()
        return agent.generate_ad_copy(
            platform=request.platform,
            industry=request.industry,
            pain_points=request.pain_points,
            objective=request.objective
        )
    except Exception as e:
        logger.error(f"Error generating ad copy: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-batch-content")
async def generate_batch_content(request: BatchContentRequest):
    """
    Generate content for multiple leads in a pipeline stage.
    
    Batch generates emails, SMS, or call scripts for all leads in a stage.
    """
    try:
        agent = get_marketing_agent()
        kwargs = {}
        if request.content_type == "email":
            kwargs = {"email_type": request.email_type, "tone": request.tone}
        elif request.content_type == "sms":
            kwargs = {"sms_type": request.sms_type}
        elif request.content_type == "call_script":
            kwargs = {"objective": request.objective}
        
        result = agent.generate_batch_content(
            stage=request.stage,
            content_type=request.content_type,
            limit=request.limit,
            **kwargs
        )
        return {"content": result, "count": len(result)}
    except Exception as e:
        logger.error(f"Error generating batch content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# NURTURING ENDPOINTS
# =============================================================================

@router.get("/nurturing-sequence/{lead_id}")
async def get_nurturing_sequence(lead_id: str):
    """
    Get recommended nurturing sequence for a lead.
    
    Returns sequence type, steps, and timing based on lead's
    temperature and pipeline stage.
    """
    try:
        agent = get_marketing_agent()
        result = agent.get_nurturing_sequence(lead_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting nurturing sequence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/next-action/{lead_id}")
async def get_next_action(lead_id: str):
    """
    Get immediate next action for a lead.
    
    Returns the single most important action to take right now.
    """
    try:
        agent = get_marketing_agent()
        result = agent.get_next_action(lead_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting next action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sequences")
async def get_available_sequences():
    """Get list of all available nurturing sequences"""
    try:
        agent = get_marketing_agent()
        return {"sequences": agent.get_available_sequences()}
    except Exception as e:
        logger.error(f"Error getting sequences: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# CAMPAIGN & ANALYTICS ENDPOINTS
# =============================================================================

@router.get("/campaign-insights")
async def get_campaign_insights():
    """
    Get campaign/source performance insights.
    
    Returns:
    - Source performance metrics (leads, conversions, values)
    - AI-generated insights and recommendations
    - Total pipeline value
    """
    try:
        agent = get_marketing_agent()
        return agent.get_campaign_insights()
    except Exception as e:
        logger.error(f"Error getting campaign insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/leads-by-temperature")
async def get_leads_by_temperature(request: LeadsByTemperatureRequest):
    """
    Get leads filtered by temperature (hot/warm/cold).
    
    Useful for prioritizing outreach to high-value leads.
    """
    try:
        agent = get_marketing_agent()
        leads = agent.get_leads_by_temperature(request.temperature, request.limit)
        return {"temperature": request.temperature, "leads": leads, "count": len(leads)}
    except Exception as e:
        logger.error(f"Error getting leads by temperature: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leads-by-stage/{stage}")
async def get_leads_by_stage(stage: str, limit: int = 10):
    """Get leads from a specific pipeline stage"""
    try:
        agent = get_marketing_agent()
        leads = agent.crm_connector.get_leads_by_stage(stage, limit)
        return {"stage": stage, "leads": leads, "count": len(leads)}
    except Exception as e:
        logger.error(f"Error getting leads by stage: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# HEALTH CHECK
# =============================================================================

@router.get("/health")
async def marketing_health():
    """Health check for marketing agent"""
    try:
        agent = get_marketing_agent()
        return {
            "status": "healthy",
            "agent": "marketing",
            "content_generator_provider": agent.content_generator.provider if hasattr(agent, 'content_generator') else "unknown"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "agent": "marketing",
            "error": str(e)
        }

