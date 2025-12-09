"""
=============================================================================
MARKETING AGENT - API ROUTES
Owner: Sheryar

Save as: clara-backend/routes/marketing.py

Then add to main.py:
    from routes.marketing import router as marketing_router
    app.include_router(marketing_router)
=============================================================================
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from agents.marketing_agent import MarketingAgent

router = APIRouter(prefix="/api/marketing", tags=["Marketing"])
marketing_agent = MarketingAgent()


# Request Models
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


# Endpoints
@router.post("/analyze-lead")
async def analyze_lead(request: AnalyzeLeadRequest):
    """Analyze a single lead - get temperature, priority, recommendations"""
    try:
        result = marketing_agent.analyze_lead(request.lead_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-batch")
async def analyze_batch(request: AnalyzeBatchRequest):
    """Analyze multiple leads from a pipeline stage"""
    try:
        return marketing_agent.analyze_leads_batch(stage=request.stage, limit=request.limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/lead-temperature/{lead_id}")
async def get_lead_temperature(lead_id: str):
    """Get temperature of a specific lead"""
    try:
        result = marketing_agent.analyze_lead(lead_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return {
            "lead_id": lead_id,
            "temperature": result.get("temperature"),
            "temperature_score": result.get("temperature_score"),
            "priority": result.get("priority")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-email")
async def generate_email(request: GenerateEmailRequest):
    """Generate personalized email for a lead"""
    try:
        result = marketing_agent.generate_email(
            lead_id=request.lead_id,
            email_type=request.email_type,
            tone=request.tone
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-sms")
async def generate_sms(request: GenerateSMSRequest):
    """Generate SMS message for a lead"""
    try:
        result = marketing_agent.generate_sms(
            lead_id=request.lead_id,
            sms_type=request.sms_type,
            context=request.context
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-call-script")
async def generate_call_script(request: GenerateCallScriptRequest):
    """Generate cold call script for a lead"""
    try:
        result = marketing_agent.generate_cold_call_script(
            lead_id=request.lead_id,
            objective=request.objective
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-ad-copy")
async def generate_ad_copy(request: GenerateAdCopyRequest):
    """Generate ad copy for a platform"""
    try:
        return marketing_agent.generate_ad_copy(
            platform=request.platform,
            industry=request.industry,
            pain_points=request.pain_points,
            objective=request.objective
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-batch-content")
async def generate_batch_content(request: BatchContentRequest):
    """Generate content for multiple leads in a pipeline stage"""
    try:
        kwargs = {}
        if request.content_type == "email":
            kwargs = {"email_type": request.email_type, "tone": request.tone}
        elif request.content_type == "sms":
            kwargs = {"sms_type": request.sms_type}
        elif request.content_type == "call_script":
            kwargs = {"objective": request.objective}
        
        result = marketing_agent.generate_batch_content(
            stage=request.stage,
            content_type=request.content_type,
            limit=request.limit,
            **kwargs
        )
        return {"content": result, "count": len(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nurturing-sequence/{lead_id}")
async def get_nurturing_sequence(lead_id: str):
    """Get recommended nurturing sequence for a lead"""
    try:
        result = marketing_agent.get_nurturing_sequence(lead_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/next-action/{lead_id}")
async def get_next_action(lead_id: str):
    """Get immediate next action for a lead"""
    try:
        result = marketing_agent.get_next_action(lead_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sequences")
async def get_available_sequences():
    """Get list of all available nurturing sequences"""
    try:
        return {"sequences": marketing_agent.get_available_sequences()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/campaign-insights")
async def get_campaign_insights():
    """Get campaign/source performance insights"""
    try:
        return marketing_agent.get_campaign_insights()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/leads-by-temperature")
async def get_leads_by_temperature(request: LeadsByTemperatureRequest):
    """Get leads filtered by temperature (hot/warm/cold)"""
    try:
        leads = marketing_agent.get_leads_by_temperature(request.temperature, request.limit)
        return {"temperature": request.temperature, "leads": leads, "count": len(leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/leads-by-stage/{stage}")
async def get_leads_by_stage(stage: str, limit: int = 10):
    """Get leads from a specific pipeline stage"""
    try:
        leads = marketing_agent.crm_connector.get_leads_by_stage(stage, limit)
        return {"stage": stage, "leads": leads, "count": len(leads)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))