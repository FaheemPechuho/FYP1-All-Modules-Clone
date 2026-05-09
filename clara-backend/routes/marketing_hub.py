"""
=============================================================================
MARKETING HUB - EXPANDED API ROUTES (Ollama-Powered)
Owner: Sheryar

Expanded marketing routes: campaign management, email sequences, social media,
automation workflows, and A/B testing — all powered by local Ollama LLM.

Included in main.py via:
    from routes.marketing_hub import router as marketing_hub_router
    app.include_router(marketing_hub_router)
=============================================================================
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/api/marketing", tags=["Marketing Hub (Ollama)"])


# =============================================================================
# REQUEST MODELS
# =============================================================================

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

class SuggestWorkflowRequest(BaseModel):
    goal: str
    trigger_type: str
    audience: str

class OptimizeWorkflowRequest(BaseModel):
    workflow_data: Dict[str, Any]

class GenerateVariantsRequest(BaseModel):
    test_type: str
    original: str
    goal: str
    num_variants: int = 3

class AnalyzeABTestRequest(BaseModel):
    test_data: Dict[str, Any]

class SuggestTestIdeasRequest(BaseModel):
    channel: str
    current_performance: Dict[str, Any]


# =============================================================================
# CAMPAIGN MANAGEMENT ENDPOINTS (Ollama-Powered)
# =============================================================================

@router.post("/campaigns/ideas")
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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/campaigns/optimize")
async def optimize_campaign(request: OptimizeCampaignRequest):
    """Get AI-powered campaign optimization suggestions using Ollama"""
    try:
        from agents.marketing_agent.campaign_manager import campaign_manager
        result = campaign_manager.optimize_campaign(request.campaign_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# EMAIL CAMPAIGN ENDPOINTS (Ollama-Powered)
# =============================================================================

@router.post("/email/subject-lines")
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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/email/content")
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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/email/sequence")
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
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# SOCIAL MEDIA ENDPOINTS (Ollama-Powered)
# =============================================================================

@router.post("/social/post")
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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/social/hashtags")
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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/social/calendar")
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
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# AUTOMATION WORKFLOW ENDPOINTS (Ollama-Powered)
# =============================================================================

@router.post("/automation/suggest-workflow")
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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/automation/optimize-workflow")
async def optimize_workflow(request: OptimizeWorkflowRequest):
    """Get AI-powered workflow optimization recommendations using Ollama"""
    try:
        from agents.marketing_agent.automation_engine import automation_engine
        result = automation_engine.optimize_workflow(request.workflow_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/automation/suggest-triggers/{goal}")
async def suggest_triggers(goal: str):
    """Get AI-powered trigger suggestions for a workflow goal"""
    try:
        from agents.marketing_agent.automation_engine import automation_engine
        result = automation_engine.suggest_triggers(goal)
        return {"triggers": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# A/B TESTING ENDPOINTS (Ollama-Powered)
# =============================================================================

@router.post("/ab-testing/generate-variants")
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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ab-testing/analyze-results")
async def analyze_ab_test(request: AnalyzeABTestRequest):
    """Analyze A/B test results with AI insights using Ollama"""
    try:
        from agents.marketing_agent.ab_testing_engine import ab_testing_engine
        result = ab_testing_engine.analyze_results(request.test_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ab-testing/suggest-test-ideas")
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
        raise HTTPException(status_code=500, detail=str(e))
