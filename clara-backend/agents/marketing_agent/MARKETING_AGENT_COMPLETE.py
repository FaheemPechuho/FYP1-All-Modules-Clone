"""
=============================================================================
MARKETING AGENT - COMPLETE CODE
Owner: Sheryar
=============================================================================

HOW TO USE:
1. Create folder: clara-backend/agents/marketing_agent/
2. Split this file into separate files as marked below
3. Each section marked with "### FILE: filename.py ###" is a separate file

=============================================================================
"""

### FILE: __init__.py ###
"""
Marketing Agent Module - Content generation and lead nurturing
Owner: Sheryar
"""

from .agent import MarketingAgent

__all__ = ["MarketingAgent"]


### FILE: prompts.py ###
"""
Marketing Agent Prompts - LLM prompts for marketing content generation
Owner: Sheryar
"""

# =============================================================================
# SYSTEM PROMPT
# =============================================================================

MARKETING_AGENT_SYSTEM_PROMPT = """You are Clara, an expert AI marketing assistant for a CRM system. Your role is to:

1. **Analyze Leads**: Understand lead temperature, stage, and needs
2. **Generate Content**: Create personalized emails, SMS, cold call scripts, and ad copy
3. **Suggest Actions**: Recommend next best marketing actions
4. **Nurture Leads**: Design nurturing sequences based on lead stage

## Your Approach:
- Be data-driven: Use lead information to personalize everything
- Be concise: Sales teams are busy, make content scannable
- Be persuasive: Focus on value proposition and pain points
- Be professional: Maintain brand voice consistency

## Lead Stages (Pipeline):
- New Lead (5%): Just entered, needs awareness content
- Qualified (15%): Showing interest, needs education
- Contact Made (25%): Had initial contact, needs nurturing
- Needs Analysis (40%): Understanding requirements, needs solutions
- Proposal Sent (60%): Reviewing proposal, needs reassurance
- Negotiation (80%): Close to decision, needs urgency
- Closed Won (100%): Customer, needs onboarding

## Lead Temperature:
- 🔥 Hot: High deal value + recent activity + advanced stage
- 🌡️ Warm: Medium engagement, needs nurturing
- ❄️ Cold: Low activity, needs re-engagement

Always tailor content to the specific industry and company context."""


# =============================================================================
# LEAD ANALYSIS PROMPT
# =============================================================================

LEAD_ANALYSIS_PROMPT = """Analyze this lead and provide marketing recommendations.

Lead Information:
- Name: {lead_name}
- Company: {company_name}
- Industry: {industry}
- Deal Value: ${deal_value}
- Pipeline Stage: {pipeline_stage}
- Lead Score: {lead_score}/100
- Days Since Last Contact: {days_since_contact}
- Source: {source}
- Assigned Agent: {assigned_agent}

IMPORTANT: Respond with ONLY valid JSON. No extra text.

Provide this exact JSON structure:
{{
    "temperature": "hot|warm|cold",
    "temperature_score": 0-100,
    "temperature_reasons": ["reason1", "reason2", "reason3"],
    "priority": "high|medium|low",
    "nurturing_stage": "awareness|consideration|decision|retention",
    "recommended_action": "string describing immediate next action",
    "content_suggestions": {{
        "email_type": "welcome|follow_up|re_engagement|proposal|case_study",
        "call_urgency": "immediate|this_week|next_week|not_needed",
        "ad_retargeting": true|false
    }},
    "talking_points": ["point1", "point2", "point3"],
    "risk_factors": ["risk1", "risk2"]
}}"""


# =============================================================================
# EMAIL GENERATION PROMPTS
# =============================================================================

EMAIL_GENERATION_PROMPT = """Generate a personalized {email_type} email for this lead.

Lead Information:
- Name: {lead_name}
- Company: {company_name}
- Industry: {industry}
- Pipeline Stage: {pipeline_stage}
- Deal Value: ${deal_value}
- Pain Points: {pain_points}
- Last Interaction: {last_interaction}

Email Type: {email_type}
Tone: {tone}

IMPORTANT: Respond with ONLY valid JSON. No extra text.

Generate this exact JSON structure:
{{
    "subject_line": "compelling subject under 50 chars",
    "preview_text": "preview text under 100 chars",
    "greeting": "personalized greeting",
    "body": "email body with paragraphs separated by \\n\\n",
    "cta": "clear call to action",
    "signature": "professional signature",
    "ps_line": "optional PS line or null",
    "personalization_used": ["list of personalized elements"]
}}

Guidelines:
- Keep it under 150 words
- One clear CTA
- Industry-specific language
- Value-focused, not feature-focused"""


EMAIL_TYPES = {
    "welcome": "First contact email introducing our solution",
    "follow_up": "Following up after initial contact or meeting",
    "re_engagement": "Re-engaging a cold or inactive lead",
    "proposal": "Sending or following up on a proposal",
    "case_study": "Sharing relevant success story",
    "meeting_request": "Requesting a demo or discovery call",
    "value_add": "Sharing helpful content without hard selling"
}


# =============================================================================
# SMS GENERATION PROMPT
# =============================================================================

SMS_GENERATION_PROMPT = """Generate a personalized SMS message for this lead.

Lead Information:
- Name: {lead_name}
- Company: {company_name}
- Pipeline Stage: {pipeline_stage}
- Context: {context}

SMS Type: {sms_type}

IMPORTANT: Respond with ONLY valid JSON. No extra text.

Generate this exact JSON structure:
{{
    "message": "SMS text under 160 characters",
    "character_count": number,
    "has_link_placeholder": true|false,
    "urgency_level": "low|medium|high"
}}

Guidelines:
- Max 160 characters (1 SMS segment)
- Be personal but professional
- Include clear next step
- No spam language"""


SMS_TYPES = {
    "appointment_reminder": "Remind about upcoming meeting",
    "quick_follow_up": "Brief follow-up after call/email",
    "time_sensitive": "Urgent offer or deadline",
    "check_in": "Casual check-in message"
}


# =============================================================================
# COLD CALL SCRIPT PROMPT
# =============================================================================

COLD_CALL_SCRIPT_PROMPT = """Generate a cold call script for this lead.

Lead Information:
- Name: {lead_name}
- Company: {company_name}
- Industry: {industry}
- Role/Title: {role}
- Company Size: {company_size}
- Pain Points (if known): {pain_points}
- Pipeline Stage: {pipeline_stage}

Call Objective: {call_objective}

IMPORTANT: Respond with ONLY valid JSON. No extra text.

Generate this exact JSON structure:
{{
    "opener": "First 10 seconds - hook them",
    "introduction": "Who you are and why calling",
    "value_proposition": "What's in it for them (1-2 sentences)",
    "qualifying_questions": ["question1", "question2", "question3"],
    "pain_point_probes": ["probe1", "probe2"],
    "objection_handlers": {{
        "no_time": "response",
        "not_interested": "response",
        "using_competitor": "response",
        "no_budget": "response",
        "send_info": "response"
    }},
    "closing": "How to end the call with next step",
    "voicemail_script": "30-second voicemail if they don't answer",
    "estimated_duration": "X minutes"
}}

Guidelines:
- Opener must grab attention in 10 seconds
- Focus on THEIR problems, not your features
- Questions should uncover pain points
- Always have a clear next step"""


CALL_OBJECTIVES = {
    "discovery": "Learn about their needs and qualify",
    "demo_booking": "Schedule a product demonstration",
    "follow_up": "Follow up on previous conversation",
    "re_engagement": "Reconnect with dormant lead",
    "closing": "Push towards final decision"
}


# =============================================================================
# AD COPY GENERATION PROMPT
# =============================================================================

AD_COPY_PROMPT = """Generate ad copy for {platform} targeting leads like this.

Target Lead Profile:
- Industry: {industry}
- Company Size: {company_size}
- Pain Points: {pain_points}
- Decision Stage: {decision_stage}

Platform: {platform}
Ad Objective: {ad_objective}

IMPORTANT: Respond with ONLY valid JSON. No extra text.

Generate this exact JSON structure:
{{
    "headlines": ["headline1 (max 30 chars)", "headline2", "headline3"],
    "primary_text": "main ad copy (platform-appropriate length)",
    "description": "supporting text",
    "cta_button": "Learn More|Sign Up|Get Started|Book Demo|Contact Us",
    "hooks": ["attention hook 1", "attention hook 2"],
    "hashtags": ["#hashtag1", "#hashtag2"],
    "emoji_suggestions": ["emoji1", "emoji2"],
    "a_b_variations": [
        {{
            "headline": "variation 1",
            "primary_text": "variation 1 text"
        }},
        {{
            "headline": "variation 2", 
            "primary_text": "variation 2 text"
        }}
    ]
}}

Platform Guidelines:
- Facebook: 125 chars primary text ideal, emotional appeal
- TikTok: Casual, trendy, hook in first 2 seconds
- Google: Keyword-focused, benefit-driven
- LinkedIn: Professional, B2B focused"""


AD_PLATFORMS = {
    "facebook": {"primary_text_limit": 125, "headline_limit": 40},
    "tiktok": {"primary_text_limit": 100, "headline_limit": 30},
    "google": {"headline_limit": 30, "description_limit": 90},
    "linkedin": {"primary_text_limit": 150, "headline_limit": 50}
}


# =============================================================================
# NURTURING SEQUENCE PROMPT
# =============================================================================

NURTURING_SEQUENCE_PROMPT = """Design a nurturing sequence for leads in this stage.

Lead Segment:
- Pipeline Stage: {pipeline_stage}
- Industry: {industry}
- Average Deal Value: ${avg_deal_value}
- Common Pain Points: {pain_points}

Sequence Goal: {sequence_goal}

IMPORTANT: Respond with ONLY valid JSON. No extra text.

Generate this exact JSON structure:
{{
    "sequence_name": "descriptive name",
    "total_duration_days": number,
    "goal": "what success looks like",
    "steps": [
        {{
            "day": 1,
            "action_type": "email|sms|call|linkedin|wait",
            "action_name": "short name",
            "description": "what to do",
            "template_key": "template identifier",
            "conditions": "when to skip or modify"
        }}
    ],
    "exit_criteria": ["criterion1", "criterion2"],
    "success_metrics": ["metric1", "metric2"]
}}

Guidelines:
- Mix channels (don't spam email only)
- Include wait periods
- Define clear exit criteria
- Adapt based on engagement"""


SEQUENCE_GOALS = {
    "awareness_to_interest": "Move new leads to showing interest",
    "interest_to_meeting": "Convert interested leads to booked meetings",
    "proposal_to_close": "Push proposal stage to closed won",
    "re_engagement": "Bring back cold/dormant leads",
    "post_meeting": "Follow up after discovery/demo calls"
}


# =============================================================================
# BATCH ANALYSIS PROMPT
# =============================================================================

BATCH_LEAD_ANALYSIS_PROMPT = """Analyze these leads and prioritize for marketing outreach.

Leads:
{leads_json}

IMPORTANT: Respond with ONLY valid JSON. No extra text.

Provide this exact JSON structure:
{{
    "summary": {{
        "total_leads": number,
        "hot_leads": number,
        "warm_leads": number,
        "cold_leads": number,
        "total_pipeline_value": number
    }},
    "prioritized_leads": [
        {{
            "lead_id": "id",
            "lead_name": "name",
            "temperature": "hot|warm|cold",
            "priority_rank": 1-10,
            "recommended_action": "specific action",
            "best_channel": "email|call|sms",
            "urgency": "immediate|today|this_week"
        }}
    ],
    "segment_recommendations": {{
        "hot_leads_action": "what to do with hot leads",
        "warm_leads_action": "what to do with warm leads",
        "cold_leads_action": "what to do with cold leads"
    }},
    "campaign_suggestions": [
        {{
            "campaign_name": "name",
            "target_segment": "which leads",
            "channel": "channel",
            "message_theme": "theme"
        }}
    ]
}}"""


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_email_prompt(email_type: str, lead_info: dict, tone: str = "professional") -> str:
    """Build email generation prompt with lead context"""
    return EMAIL_GENERATION_PROMPT.format(
        email_type=email_type,
        lead_name=lead_info.get("name", "there"),
        company_name=lead_info.get("company", "your company"),
        industry=lead_info.get("industry", "your industry"),
        pipeline_stage=lead_info.get("pipeline_stage", "New Lead"),
        deal_value=lead_info.get("deal_value", 0),
        pain_points=lead_info.get("pain_points", "improving efficiency"),
        last_interaction=lead_info.get("last_interaction", "N/A"),
        tone=tone
    )


def get_call_script_prompt(lead_info: dict, objective: str = "discovery") -> str:
    """Build cold call script prompt with lead context"""
    return COLD_CALL_SCRIPT_PROMPT.format(
        lead_name=lead_info.get("name", ""),
        company_name=lead_info.get("company", ""),
        industry=lead_info.get("industry", ""),
        role=lead_info.get("role", "Decision Maker"),
        company_size=lead_info.get("company_size", "SMB"),
        pain_points=lead_info.get("pain_points", "Not yet identified"),
        pipeline_stage=lead_info.get("pipeline_stage", "New Lead"),
        call_objective=CALL_OBJECTIVES.get(objective, objective)
    )


def get_ad_copy_prompt(platform: str, target_profile: dict, objective: str = "awareness") -> str:
    """Build ad copy prompt for specific platform"""
    return AD_COPY_PROMPT.format(
        platform=platform,
        industry=target_profile.get("industry", "B2B"),
        company_size=target_profile.get("company_size", "SMB"),
        pain_points=target_profile.get("pain_points", "efficiency, growth"),
        decision_stage=target_profile.get("decision_stage", "awareness"),
        ad_objective=objective
    )


def get_sms_prompt(lead_info: dict, sms_type: str, context: str = "") -> str:
    """Build SMS generation prompt"""
    return SMS_GENERATION_PROMPT.format(
        lead_name=lead_info.get("name", ""),
        company_name=lead_info.get("company", ""),
        pipeline_stage=lead_info.get("pipeline_stage", ""),
        context=context or "General follow-up",
        sms_type=SMS_TYPES.get(sms_type, sms_type)
    )


### FILE: lead_analyzer.py ###
"""
Lead Analyzer - Analyze leads for marketing intelligence
Owner: Sheryar
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from utils.logger import get_logger

logger = get_logger("lead_analyzer")


class LeadAnalyzer:
    """Analyze leads for temperature, priority, and marketing recommendations"""
    
    def __init__(self):
        """Initialize lead analyzer with scoring rules"""
        self.temperature_rules = self._load_temperature_rules()
        logger.info("Lead Analyzer initialized")
    
    def _load_temperature_rules(self) -> Dict[str, Any]:
        """Load temperature scoring configuration"""
        return {
            "hot_threshold": 70,
            "warm_threshold": 40,
            "factors": {
                "deal_value": {
                    "high": {"min": 10000, "points": 25},
                    "medium": {"min": 1000, "points": 15},
                    "low": {"min": 0, "points": 5}
                },
                "pipeline_stage": {
                    "Closed Won": 30,
                    "Negotiation": 25,
                    "Proposal Sent": 20,
                    "Needs Analysis": 15,
                    "Contact Made": 10,
                    "Qualified": 8,
                    "New Lead": 5
                },
                "recency": {
                    "today": 20,
                    "this_week": 15,
                    "this_month": 10,
                    "older": 0
                },
                "lead_score": {
                    "weight": 0.25
                }
            }
        }
    
    def analyze_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a single lead and return marketing intelligence
        
        Args:
            lead_data: Lead information from CRM
            
        Returns:
            Analysis result with temperature, priority, recommendations
        """
        try:
            # Calculate temperature score
            temp_score, temp_factors = self._calculate_temperature_score(lead_data)
            
            # Determine temperature label
            temperature = self._get_temperature_label(temp_score)
            
            # Calculate priority
            priority = self._calculate_priority(lead_data, temp_score)
            
            # Determine nurturing stage
            nurturing_stage = self._get_nurturing_stage(lead_data)
            
            # Get recommended actions
            recommendations = self._get_recommendations(lead_data, temperature, nurturing_stage)
            
            # Identify risk factors
            risks = self._identify_risks(lead_data)
            
            analysis = {
                "lead_id": lead_data.get("id"),
                "lead_name": lead_data.get("name") or lead_data.get("client_name"),
                "temperature": temperature,
                "temperature_score": temp_score,
                "temperature_reasons": temp_factors,
                "priority": priority,
                "nurturing_stage": nurturing_stage,
                "recommended_action": recommendations.get("immediate_action"),
                "content_suggestions": recommendations.get("content"),
                "talking_points": recommendations.get("talking_points", []),
                "risk_factors": risks,
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Analyzed lead {lead_data.get('id')}: {temperature} ({temp_score}/100)")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing lead: {e}")
            return self._get_fallback_analysis(lead_data)
    
    def analyze_batch(self, leads: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze multiple leads and return prioritized list"""
        try:
            analyzed_leads = []
            hot_count = warm_count = cold_count = 0
            total_value = 0
            
            for lead in leads:
                analysis = self.analyze_lead(lead)
                analyzed_leads.append({
                    **analysis,
                    "deal_value": lead.get("deal_value", 0),
                    "company": lead.get("company") or lead.get("client_name"),
                    "pipeline_stage": lead.get("pipeline_stage") or lead.get("status")
                })
                
                if analysis["temperature"] == "hot":
                    hot_count += 1
                elif analysis["temperature"] == "warm":
                    warm_count += 1
                else:
                    cold_count += 1
                
                total_value += lead.get("deal_value", 0) or 0
            
            # Sort by priority and temperature score
            priority_order = {"high": 0, "medium": 1, "low": 2}
            analyzed_leads.sort(key=lambda x: (
                priority_order.get(x["priority"], 2),
                -x["temperature_score"]
            ))
            
            for i, lead in enumerate(analyzed_leads):
                lead["priority_rank"] = i + 1
            
            return {
                "summary": {
                    "total_leads": len(leads),
                    "hot_leads": hot_count,
                    "warm_leads": warm_count,
                    "cold_leads": cold_count,
                    "total_pipeline_value": total_value
                },
                "prioritized_leads": analyzed_leads[:10],
                "all_leads": analyzed_leads,
                "segment_recommendations": {
                    "hot_leads_action": "Immediate personal outreach - call or personalized email",
                    "warm_leads_action": "Nurture with value-add content and soft CTAs",
                    "cold_leads_action": "Re-engagement campaign or move to long-term nurture"
                },
                "analyzed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in batch analysis: {e}")
            return {"error": str(e), "prioritized_leads": []}
    
    def _calculate_temperature_score(self, lead_data: Dict[str, Any]) -> tuple:
        """Calculate temperature score (0-100) with contributing factors"""
        score = 0
        factors = []
        rules = self.temperature_rules["factors"]
        
        # Deal value scoring
        deal_value = lead_data.get("deal_value", 0) or 0
        if deal_value >= rules["deal_value"]["high"]["min"]:
            score += rules["deal_value"]["high"]["points"]
            factors.append(f"High deal value (${deal_value:,})")
        elif deal_value >= rules["deal_value"]["medium"]["min"]:
            score += rules["deal_value"]["medium"]["points"]
            factors.append(f"Medium deal value (${deal_value:,})")
        else:
            score += rules["deal_value"]["low"]["points"]
            if deal_value > 0:
                factors.append(f"Low deal value (${deal_value:,})")
        
        # Pipeline stage scoring
        stage = lead_data.get("pipeline_stage") or lead_data.get("status") or "New Lead"
        stage_score = rules["pipeline_stage"].get(stage, 5)
        score += stage_score
        if stage_score >= 20:
            factors.append(f"Advanced stage ({stage})")
        elif stage_score <= 8:
            factors.append(f"Early stage ({stage})")
        
        # Recency scoring
        last_contact = lead_data.get("last_contact") or lead_data.get("updated_at")
        recency_score, recency_desc = self._score_recency(last_contact)
        score += recency_score
        if recency_desc:
            factors.append(recency_desc)
        
        # Lead score contribution
        lead_score = lead_data.get("lead_score", 0) or 0
        score_contribution = int(lead_score * rules["lead_score"]["weight"])
        score += score_contribution
        if lead_score >= 60:
            factors.append(f"High lead score ({lead_score})")
        elif lead_score <= 30 and lead_score > 0:
            factors.append(f"Low lead score ({lead_score})")
        
        score = min(100, score)
        return score, factors
    
    def _score_recency(self, last_contact) -> tuple:
        """Score based on recency of last contact"""
        if not last_contact:
            return 0, "No contact history"
        
        try:
            if isinstance(last_contact, str):
                last_date = datetime.fromisoformat(last_contact.replace('Z', '+00:00'))
            else:
                last_date = last_contact
            
            now = datetime.utcnow()
            if last_date.tzinfo:
                last_date = last_date.replace(tzinfo=None)
            
            days_ago = (now - last_date).days
            
            if days_ago <= 1:
                return 20, "Contacted today/yesterday"
            elif days_ago <= 7:
                return 15, f"Contacted {days_ago} days ago"
            elif days_ago <= 30:
                return 10, f"Contacted {days_ago} days ago"
            else:
                return 0, f"No contact in {days_ago}+ days"
                
        except Exception as e:
            logger.debug(f"Error parsing date: {e}")
            return 5, None
    
    def _get_temperature_label(self, score: int) -> str:
        """Convert score to temperature label"""
        if score >= self.temperature_rules["hot_threshold"]:
            return "hot"
        elif score >= self.temperature_rules["warm_threshold"]:
            return "warm"
        else:
            return "cold"
    
    def _calculate_priority(self, lead_data: Dict[str, Any], temp_score: int) -> str:
        """Calculate priority based on multiple factors"""
        deal_value = lead_data.get("deal_value", 0) or 0
        stage = lead_data.get("pipeline_stage") or lead_data.get("status") or ""
        
        high_priority_stages = ["Negotiation", "Proposal Sent", "Needs Analysis"]
        if temp_score >= 70 or deal_value >= 10000 or stage in high_priority_stages:
            return "high"
        
        if temp_score >= 40 or deal_value >= 1000:
            return "medium"
        
        return "low"
    
    def _get_nurturing_stage(self, lead_data: Dict[str, Any]) -> str:
        """Determine nurturing stage based on pipeline position"""
        stage = lead_data.get("pipeline_stage") or lead_data.get("status") or "New Lead"
        
        stage_mapping = {
            "New Lead": "awareness",
            "Qualified": "awareness",
            "Contact Made": "consideration",
            "Needs Analysis": "consideration",
            "Proposal Sent": "decision",
            "Negotiation": "decision",
            "Closed Won": "retention"
        }
        
        return stage_mapping.get(stage, "awareness")
    
    def _get_recommendations(self, lead_data: Dict[str, Any], temperature: str, nurturing_stage: str) -> Dict[str, Any]:
        """Get content and action recommendations"""
        recommendations = {
            "immediate_action": "",
            "content": {
                "email_type": "follow_up",
                "call_urgency": "this_week",
                "ad_retargeting": False
            },
            "talking_points": []
        }
        
        if temperature == "hot":
            recommendations["immediate_action"] = "Call immediately - high chance of conversion"
            recommendations["content"]["call_urgency"] = "immediate"
            recommendations["talking_points"] = [
                "Reference previous conversations",
                "Address any pending concerns",
                "Push for commitment/next step"
            ]
        elif temperature == "warm":
            recommendations["immediate_action"] = "Send personalized follow-up email"
            recommendations["content"]["email_type"] = "follow_up"
            recommendations["content"]["call_urgency"] = "this_week"
            recommendations["talking_points"] = [
                "Share relevant case study",
                "Offer value-add content",
                "Suggest demo or call"
            ]
        else:
            recommendations["immediate_action"] = "Add to re-engagement campaign"
            recommendations["content"]["email_type"] = "re_engagement"
            recommendations["content"]["call_urgency"] = "not_needed"
            recommendations["content"]["ad_retargeting"] = True
            recommendations["talking_points"] = [
                "Reconnect with new value proposition",
                "Share industry insights",
                "Low-pressure check-in"
            ]
        
        return recommendations
    
    def _identify_risks(self, lead_data: Dict[str, Any]) -> List[str]:
        """Identify risk factors for the lead"""
        risks = []
        
        last_contact = lead_data.get("last_contact") or lead_data.get("updated_at")
        if last_contact:
            try:
                if isinstance(last_contact, str):
                    last_date = datetime.fromisoformat(last_contact.replace('Z', '+00:00'))
                else:
                    last_date = last_contact
                
                if last_date.tzinfo:
                    last_date = last_date.replace(tzinfo=None)
                    
                days_ago = (datetime.utcnow() - last_date).days
                if days_ago > 30:
                    risks.append(f"No contact in {days_ago} days - risk of going cold")
                elif days_ago > 14:
                    risks.append("Contact overdue - needs follow-up")
            except:
                pass
        
        deal_value = lead_data.get("deal_value", 0) or 0
        stage = lead_data.get("pipeline_stage") or lead_data.get("status") or ""
        
        if deal_value > 10000 and stage in ["New Lead", "Qualified"]:
            risks.append("High-value lead stuck in early stage")
        
        if not lead_data.get("email") and not lead_data.get("phone"):
            risks.append("Missing contact information")
        
        if not lead_data.get("industry"):
            risks.append("Industry unknown - harder to personalize")
        
        return risks
    
    def _get_fallback_analysis(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Return fallback analysis when processing fails"""
        return {
            "lead_id": lead_data.get("id"),
            "lead_name": lead_data.get("name") or lead_data.get("client_name"),
            "temperature": "warm",
            "temperature_score": 50,
            "temperature_reasons": ["Unable to fully analyze"],
            "priority": "medium",
            "nurturing_stage": "consideration",
            "recommended_action": "Review lead manually",
            "content_suggestions": {
                "email_type": "follow_up",
                "call_urgency": "this_week",
                "ad_retargeting": False
            },
            "talking_points": [],
            "risk_factors": ["Analysis incomplete"],
            "analyzed_at": datetime.utcnow().isoformat()
        }


### FILE: content_generator.py ###
"""
Content Generator - Generate marketing content using LLM
Owner: Sheryar
"""

from typing import Dict, Any, Optional, List
import json
from groq import Groq
from openai import OpenAI
from utils.logger import get_logger
from config import get_api_key
from .prompts import (
    MARKETING_AGENT_SYSTEM_PROMPT,
    EMAIL_GENERATION_PROMPT,
    SMS_GENERATION_PROMPT,
    COLD_CALL_SCRIPT_PROMPT,
    AD_COPY_PROMPT,
    EMAIL_TYPES,
    SMS_TYPES,
    CALL_OBJECTIVES,
    AD_PLATFORMS
)

logger = get_logger("content_generator")


class ContentGenerator:
    """Generate marketing content using LLM"""
    
    def __init__(self):
        """Initialize content generator with LLM client"""
        api_key = get_api_key("groq") or get_api_key("openai")
        
        if not api_key:
            raise ValueError("No LLM API key configured")
        
        if api_key.startswith("gsk_"):
            self.client = Groq(api_key=api_key)
            self.model = "llama-3.3-70b-versatile"
        else:
            self.client = OpenAI(api_key=api_key)
            self.model = "gpt-4o-mini"
        
        logger.info(f"Content Generator initialized with model: {self.model}")
    
    def generate_email(
        self,
        lead_info: Dict[str, Any],
        email_type: str = "follow_up",
        tone: str = "professional"
    ) -> Dict[str, Any]:
        """Generate personalized email content"""
        try:
            prompt = EMAIL_GENERATION_PROMPT.format(
                email_type=EMAIL_TYPES.get(email_type, email_type),
                lead_name=lead_info.get("name") or lead_info.get("client_name") or "there",
                company_name=lead_info.get("company") or lead_info.get("client_name") or "your company",
                industry=lead_info.get("industry") or "your industry",
                pipeline_stage=lead_info.get("pipeline_stage") or lead_info.get("status") or "New Lead",
                deal_value=lead_info.get("deal_value") or 0,
                pain_points=lead_info.get("pain_points") or "improving business efficiency",
                last_interaction=lead_info.get("last_interaction") or "N/A",
                tone=tone
            )
            
            result = self._call_llm(prompt)
            
            if result:
                result["email_type"] = email_type
                result["tone"] = tone
                result["lead_id"] = lead_info.get("id")
            
            return result or self._get_fallback_email(lead_info, email_type)
            
        except Exception as e:
            logger.error(f"Error generating email: {e}")
            return self._get_fallback_email(lead_info, email_type)
    
    def generate_sms(
        self,
        lead_info: Dict[str, Any],
        sms_type: str = "quick_follow_up",
        context: str = ""
    ) -> Dict[str, Any]:
        """Generate SMS message"""
        try:
            prompt = SMS_GENERATION_PROMPT.format(
                lead_name=lead_info.get("name") or lead_info.get("client_name") or "",
                company_name=lead_info.get("company") or lead_info.get("client_name") or "",
                pipeline_stage=lead_info.get("pipeline_stage") or lead_info.get("status") or "",
                context=context or "Follow-up on previous conversation",
                sms_type=SMS_TYPES.get(sms_type, sms_type)
            )
            
            result = self._call_llm(prompt)
            
            if result:
                result["sms_type"] = sms_type
                result["lead_id"] = lead_info.get("id")
            
            return result or self._get_fallback_sms(lead_info)
            
        except Exception as e:
            logger.error(f"Error generating SMS: {e}")
            return self._get_fallback_sms(lead_info)
    
    def generate_cold_call_script(
        self,
        lead_info: Dict[str, Any],
        objective: str = "discovery"
    ) -> Dict[str, Any]:
        """Generate cold call script"""
        try:
            prompt = COLD_CALL_SCRIPT_PROMPT.format(
                lead_name=lead_info.get("name") or lead_info.get("client_name") or "the prospect",
                company_name=lead_info.get("company") or lead_info.get("client_name") or "their company",
                industry=lead_info.get("industry") or "their industry",
                role=lead_info.get("role") or lead_info.get("contact_person") or "Decision Maker",
                company_size=lead_info.get("company_size") or "SMB",
                pain_points=lead_info.get("pain_points") or "Not yet identified",
                pipeline_stage=lead_info.get("pipeline_stage") or lead_info.get("status") or "New Lead",
                call_objective=CALL_OBJECTIVES.get(objective, objective)
            )
            
            result = self._call_llm(prompt)
            
            if result:
                result["objective"] = objective
                result["lead_id"] = lead_info.get("id")
            
            return result or self._get_fallback_call_script(lead_info)
            
        except Exception as e:
            logger.error(f"Error generating call script: {e}")
            return self._get_fallback_call_script(lead_info)
    
    def generate_ad_copy(
        self,
        platform: str,
        target_profile: Dict[str, Any],
        objective: str = "awareness"
    ) -> Dict[str, Any]:
        """Generate ad copy for specific platform"""
        try:
            prompt = AD_COPY_PROMPT.format(
                platform=platform,
                industry=target_profile.get("industry") or "B2B",
                company_size=target_profile.get("company_size") or "SMB",
                pain_points=target_profile.get("pain_points") or "efficiency, growth, automation",
                decision_stage=target_profile.get("decision_stage") or "awareness",
                ad_objective=objective
            )
            
            result = self._call_llm(prompt)
            
            if result:
                result["platform"] = platform
                result["objective"] = objective
                result["platform_limits"] = AD_PLATFORMS.get(platform, {})
            
            return result or self._get_fallback_ad_copy(platform)
            
        except Exception as e:
            logger.error(f"Error generating ad copy: {e}")
            return self._get_fallback_ad_copy(platform)
    
    def generate_batch_content(
        self,
        leads: List[Dict[str, Any]],
        content_type: str,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """Generate content for multiple leads"""
        results = []
        
        for lead in leads:
            try:
                if content_type == "email":
                    content = self.generate_email(
                        lead,
                        email_type=kwargs.get("email_type", "follow_up"),
                        tone=kwargs.get("tone", "professional")
                    )
                elif content_type == "sms":
                    content = self.generate_sms(
                        lead,
                        sms_type=kwargs.get("sms_type", "quick_follow_up")
                    )
                elif content_type == "call_script":
                    content = self.generate_cold_call_script(
                        lead,
                        objective=kwargs.get("objective", "discovery")
                    )
                else:
                    content = {"error": f"Unknown content type: {content_type}"}
                
                content["lead_id"] = lead.get("id")
                content["lead_name"] = lead.get("name") or lead.get("client_name")
                results.append(content)
                
            except Exception as e:
                logger.error(f"Error generating content for lead {lead.get('id')}: {e}")
                results.append({"lead_id": lead.get("id"), "error": str(e)})
        
        return results
    
    def _call_llm(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Make LLM API call and parse JSON response"""
        try:
            messages = [
                {"role": "system", "content": MARKETING_AGENT_SYSTEM_PROMPT},
                {"role": "user", "content": prompt + "\n\nRespond with ONLY valid JSON."}
            ]
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1500
            )
            
            result_text = response.choices[0].message.content
            result_text = self._clean_json_response(result_text)
            return json.loads(result_text)
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return None
        except Exception as e:
            logger.error(f"LLM call error: {e}")
            return None
    
    def _clean_json_response(self, text: str) -> str:
        """Clean LLM response to extract valid JSON"""
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            parts = text.split("```")
            if len(parts) > 1:
                text = parts[1]
        
        text = text.strip()
        if '{' in text and '}' in text:
            start = text.find('{')
            end = text.rfind('}') + 1
            text = text[start:end]
        
        return text.strip()
    
    def _get_fallback_email(self, lead_info: Dict[str, Any], email_type: str) -> Dict[str, Any]:
        """Return fallback email template"""
        name = lead_info.get("name") or lead_info.get("client_name") or "there"
        company = lead_info.get("company") or lead_info.get("client_name") or ""
        
        return {
            "subject_line": f"Quick follow-up{f' for {company}' if company else ''}",
            "preview_text": "I wanted to reach out and see how things are going",
            "greeting": f"Hi {name},",
            "body": "I wanted to follow up on our previous conversation and see if you had any questions.\n\nI'd love to schedule a quick call to discuss how we can help.",
            "cta": "Would you have 15 minutes this week for a quick chat?",
            "signature": "Best regards",
            "ps_line": None,
            "email_type": email_type,
            "lead_id": lead_info.get("id"),
            "is_fallback": True
        }
    
    def _get_fallback_sms(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Return fallback SMS template"""
        name = lead_info.get("name") or lead_info.get("client_name") or ""
        
        return {
            "message": f"Hi{f' {name}' if name else ''}, just following up. Do you have a few minutes to chat this week?",
            "character_count": 80,
            "has_link_placeholder": False,
            "urgency_level": "low",
            "lead_id": lead_info.get("id"),
            "is_fallback": True
        }
    
    def _get_fallback_call_script(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Return fallback call script"""
        name = lead_info.get("name") or lead_info.get("client_name") or "there"
        company = lead_info.get("company") or lead_info.get("client_name") or "your company"
        
        return {
            "opener": f"Hi {name}, this is [Your Name] from [Company]. Did I catch you at a good time?",
            "introduction": "I'm reaching out because we help businesses like yours improve their sales process.",
            "value_proposition": "We've helped similar companies increase their conversion rates by 30%.",
            "qualifying_questions": [
                "What's your biggest challenge with your current process?",
                "How are you currently handling this?",
                "What would an ideal solution look like for you?"
            ],
            "pain_point_probes": [
                "Tell me more about that challenge",
                "How is that affecting your business?"
            ],
            "objection_handlers": {
                "no_time": "I completely understand. When would be a better time to chat for just 5 minutes?",
                "not_interested": "No problem. Just curious - what solution are you currently using?",
                "using_competitor": "That's great you have something in place. How's that working for you?",
                "no_budget": "I hear you. Would it help if I showed you the ROI other companies have seen?",
                "send_info": "Happy to! What specific information would be most helpful for you?"
            },
            "closing": "Based on what you've shared, I think we could really help. Can we schedule a quick demo?",
            "voicemail_script": f"Hi {name}, this is [Your Name] from [Company]. I'm calling because we help {company} with [value prop]. I'd love to chat for a few minutes. Please call me back at [number] or I'll try again tomorrow.",
            "estimated_duration": "5-10 minutes",
            "lead_id": lead_info.get("id"),
            "is_fallback": True
        }
    
    def _get_fallback_ad_copy(self, platform: str) -> Dict[str, Any]:
        """Return fallback ad copy"""
        return {
            "headlines": [
                "Grow Your Business Today",
                "See Results in 30 Days",
                "Free Demo Available"
            ],
            "primary_text": "Stop struggling with manual processes. Our solution helps businesses like yours save time and increase revenue.",
            "description": "Join thousands of satisfied customers. Get started today.",
            "cta_button": "Learn More",
            "hooks": [
                "Tired of [pain point]?",
                "What if you could [benefit]?"
            ],
            "hashtags": ["#business", "#growth"],
            "emoji_suggestions": ["🚀", "✅", "💼"],
            "a_b_variations": [],
            "platform": platform,
            "is_fallback": True
        }


### FILE: nurturing_engine.py ###
"""
Nurturing Engine - Design and manage lead nurturing sequences
Owner: Sheryar
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
from utils.logger import get_logger

logger = get_logger("nurturing_engine")


class NurturingEngine:
    """Design and manage lead nurturing sequences"""
    
    STANDARD_SEQUENCES = {
        "new_lead_welcome": {
            "sequence_name": "New Lead Welcome Sequence",
            "total_duration_days": 14,
            "goal": "Convert new lead to qualified opportunity",
            "steps": [
                {"day": 0, "action_type": "email", "action_name": "Welcome Email", "description": "Send personalized welcome email", "template_key": "welcome", "conditions": None},
                {"day": 2, "action_type": "email", "action_name": "Value Proposition", "description": "Share key benefits", "template_key": "value_add", "conditions": "If no response"},
                {"day": 5, "action_type": "call", "action_name": "Discovery Call", "description": "Attempt phone contact", "template_key": "discovery_call", "conditions": None},
                {"day": 7, "action_type": "email", "action_name": "Case Study", "description": "Share industry case study", "template_key": "case_study", "conditions": "If no call"},
                {"day": 10, "action_type": "sms", "action_name": "Quick Check-in", "description": "Brief SMS", "template_key": "check_in", "conditions": None},
                {"day": 14, "action_type": "email", "action_name": "Meeting Request", "description": "Direct ask for demo", "template_key": "meeting_request", "conditions": None}
            ],
            "exit_criteria": ["Lead books a meeting", "Lead responds with interest", "Lead opts out"],
            "success_metrics": ["Email open rate > 30%", "Response rate > 10%", "Meeting booked"]
        },
        "cold_lead_reengagement": {
            "sequence_name": "Cold Lead Re-engagement",
            "total_duration_days": 21,
            "goal": "Re-activate dormant leads",
            "steps": [
                {"day": 0, "action_type": "email", "action_name": "Re-introduction", "description": "Friendly re-introduction", "template_key": "re_engagement", "conditions": None},
                {"day": 4, "action_type": "email", "action_name": "Industry News", "description": "Share industry update", "template_key": "value_add", "conditions": None},
                {"day": 8, "action_type": "call", "action_name": "Reconnect Call", "description": "Phone attempt", "template_key": "re_engagement_call", "conditions": "If email opened"},
                {"day": 12, "action_type": "email", "action_name": "Success Story", "description": "Customer success", "template_key": "case_study", "conditions": None},
                {"day": 16, "action_type": "sms", "action_name": "Quick Question", "description": "Simple SMS", "template_key": "quick_follow_up", "conditions": None},
                {"day": 21, "action_type": "email", "action_name": "Final Attempt", "description": "Last attempt", "template_key": "re_engagement", "conditions": "Move to long-term if no response"}
            ],
            "exit_criteria": ["Lead responds positively", "Lead requests removal", "Lead converts"],
            "success_metrics": ["Re-engagement rate > 5%", "Response rate > 3%"]
        },
        "proposal_follow_up": {
            "sequence_name": "Proposal Follow-up Sequence",
            "total_duration_days": 10,
            "goal": "Close deal after proposal sent",
            "steps": [
                {"day": 1, "action_type": "email", "action_name": "Proposal Confirmation", "description": "Confirm proposal received", "template_key": "proposal", "conditions": None},
                {"day": 3, "action_type": "call", "action_name": "Check-in Call", "description": "Discuss proposal", "template_key": "closing_call", "conditions": None},
                {"day": 5, "action_type": "email", "action_name": "Address Objections", "description": "Proactively address concerns", "template_key": "follow_up", "conditions": "If no call"},
                {"day": 7, "action_type": "sms", "action_name": "Urgency Message", "description": "Create gentle urgency", "template_key": "time_sensitive", "conditions": None},
                {"day": 10, "action_type": "call", "action_name": "Decision Call", "description": "Final call to close", "template_key": "closing_call", "conditions": None}
            ],
            "exit_criteria": ["Deal closed won", "Deal closed lost", "New timeline established"],
            "success_metrics": ["Close rate > 25%", "Time to close < 14 days"]
        },
        "high_value_lead": {
            "sequence_name": "High-Value Lead Fast Track",
            "total_duration_days": 5,
            "goal": "Accelerate high-value opportunities",
            "steps": [
                {"day": 0, "action_type": "call", "action_name": "Immediate Call", "description": "Call within 5 minutes", "template_key": "discovery", "conditions": "High priority"},
                {"day": 0, "action_type": "email", "action_name": "Voicemail Follow-up", "description": "Email if no answer", "template_key": "welcome", "conditions": "If no answer"},
                {"day": 1, "action_type": "call", "action_name": "Second Attempt", "description": "Second call attempt", "template_key": "discovery", "conditions": None},
                {"day": 2, "action_type": "email", "action_name": "Executive Outreach", "description": "Send from senior person", "template_key": "follow_up", "conditions": None},
                {"day": 3, "action_type": "linkedin", "action_name": "LinkedIn Connect", "description": "LinkedIn connection", "template_key": None, "conditions": "If email not opened"},
                {"day": 5, "action_type": "call", "action_name": "Final Fast-Track Call", "description": "Final attempt", "template_key": "discovery", "conditions": None}
            ],
            "exit_criteria": ["Meeting scheduled", "Move to standard sequence if no response"],
            "success_metrics": ["Connection rate > 40%", "Meeting rate > 25%"]
        }
    }
    
    def __init__(self):
        """Initialize nurturing engine"""
        logger.info("Nurturing Engine initialized")
    
    def get_sequence_for_lead(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Get appropriate nurturing sequence for a lead"""
        try:
            sequence_key = self._select_sequence(lead_info)
            sequence = self.STANDARD_SEQUENCES.get(sequence_key, self.STANDARD_SEQUENCES["new_lead_welcome"])
            return self._schedule_sequence(sequence, lead_info)
        except Exception as e:
            logger.error(f"Error getting sequence: {e}")
            return self.STANDARD_SEQUENCES["new_lead_welcome"]
    
    def _select_sequence(self, lead_info: Dict[str, Any]) -> str:
        """Select best sequence based on lead attributes"""
        stage = lead_info.get("pipeline_stage") or lead_info.get("status") or "New Lead"
        deal_value = lead_info.get("deal_value", 0) or 0
        last_contact = lead_info.get("last_contact") or lead_info.get("updated_at")
        
        if deal_value >= 10000:
            return "high_value_lead"
        
        if stage in ["Proposal Sent", "Negotiation"]:
            return "proposal_follow_up"
        
        if last_contact:
            try:
                if isinstance(last_contact, str):
                    last_date = datetime.fromisoformat(last_contact.replace('Z', '+00:00'))
                else:
                    last_date = last_contact
                
                if last_date.tzinfo:
                    last_date = last_date.replace(tzinfo=None)
                
                days_ago = (datetime.utcnow() - last_date).days
                if days_ago > 30:
                    return "cold_lead_reengagement"
            except:
                pass
        
        return "new_lead_welcome"
    
    def _schedule_sequence(self, sequence: Dict[str, Any], lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Add scheduled dates to sequence steps"""
        scheduled = sequence.copy()
        scheduled["steps"] = []
        scheduled["lead_id"] = lead_info.get("id")
        scheduled["lead_name"] = lead_info.get("name") or lead_info.get("client_name")
        scheduled["started_at"] = datetime.utcnow().isoformat()
        
        start_date = datetime.utcnow()
        
        for step in sequence["steps"]:
            scheduled_step = step.copy()
            scheduled_date = start_date + timedelta(days=step["day"])
            scheduled_step["scheduled_date"] = scheduled_date.isoformat()
            scheduled_step["status"] = "pending"
            scheduled["steps"].append(scheduled_step)
        
        return scheduled
    
    def get_next_action(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Get immediate next action for a lead"""
        sequence = self.get_sequence_for_lead(lead_info)
        
        if sequence and sequence.get("steps"):
            next_step = sequence["steps"][0]
            return {
                "action_type": next_step["action_type"],
                "action_name": next_step["action_name"],
                "description": next_step["description"],
                "template_key": next_step.get("template_key"),
                "scheduled_date": next_step.get("scheduled_date"),
                "sequence_name": sequence.get("sequence_name")
            }
        
        return {
            "action_type": "email",
            "action_name": "Follow-up",
            "description": "Send a follow-up email",
            "template_key": "follow_up"
        }
    
    def get_available_sequences(self) -> List[Dict[str, Any]]:
        """Get list of available standard sequences"""
        return [
            {
                "key": key,
                "name": seq["sequence_name"],
                "duration_days": seq["total_duration_days"],
                "goal": seq["goal"],
                "step_count": len(seq["steps"])
            }
            for key, seq in self.STANDARD_SEQUENCES.items()
        ]


### FILE: crm_connector.py ###
"""
Marketing CRM Connector - Read leads and log marketing activities
Owner: Sheryar
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from crm_integration.leads_api import LeadsAPI
from utils.logger import get_logger

logger = get_logger("marketing_crm_connector")


class MarketingCRMConnector:
    """Handle CRM operations for marketing agent"""
    
    def __init__(self):
        """Initialize CRM connector"""
        self.leads_api = LeadsAPI()
        logger.info("Marketing CRM connector initialized")
    
    def get_leads_by_stage(self, stage: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get leads by pipeline stage"""
        try:
            leads = self.leads_api.get_leads_by_status(stage, limit=limit)
            return leads or []
        except Exception as e:
            logger.error(f"Error fetching leads by stage: {e}")
            return []
    
    def get_leads_for_marketing(self, filters: Optional[Dict[str, Any]] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Get leads that need marketing attention"""
        try:
            all_leads = self.leads_api.get_all_leads(limit=limit * 2)
            
            if not all_leads:
                return []
            
            leads = []
            for lead in all_leads:
                lead_data = self._transform_lead_data(lead)
                
                if filters:
                    if filters.get("stage") and lead_data.get("pipeline_stage") != filters["stage"]:
                        continue
                    if filters.get("min_value") and (lead_data.get("deal_value") or 0) < filters["min_value"]:
                        continue
                
                leads.append(lead_data)
                
                if len(leads) >= limit:
                    break
            
            return leads
            
        except Exception as e:
            logger.error(f"Error fetching leads for marketing: {e}")
            return []
    
    def get_lead_by_id(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """Get single lead by ID"""
        try:
            lead = self.leads_api.get_lead(lead_id)
            if lead:
                return self._transform_lead_data(lead)
            return None
        except Exception as e:
            logger.error(f"Error fetching lead {lead_id}: {e}")
            return None
    
    def get_leads_by_temperature(self, temperature: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get leads by inferred temperature"""
        try:
            all_leads = self.leads_api.get_all_leads(limit=50)
            
            if not all_leads:
                return []
            
            scored_leads = []
            for lead in all_leads:
                lead_data = self._transform_lead_data(lead)
                temp_score = self._calculate_quick_temp_score(lead_data)
                
                if temp_score >= 70:
                    lead_temp = "hot"
                elif temp_score >= 40:
                    lead_temp = "warm"
                else:
                    lead_temp = "cold"
                
                if lead_temp == temperature:
                    lead_data["temperature_score"] = temp_score
                    scored_leads.append(lead_data)
            
            scored_leads.sort(key=lambda x: x.get("temperature_score", 0), reverse=True)
            return scored_leads[:limit]
            
        except Exception as e:
            logger.error(f"Error fetching leads by temperature: {e}")
            return []
    
    def get_campaign_stats(self) -> Dict[str, Any]:
        """Get campaign/source statistics"""
        try:
            all_leads = self.leads_api.get_all_leads(limit=500)
            
            if not all_leads:
                return {"sources": [], "total_leads": 0}
            
            sources = {}
            
            for lead in all_leads:
                source = lead.get("source") or "Unknown"
                stage = lead.get("pipeline_stage") or lead.get("status") or "Unknown"
                deal_value = lead.get("deal_value") or 0
                
                if source not in sources:
                    sources[source] = {"name": source, "total_leads": 0, "total_value": 0, "closed_won": 0}
                
                sources[source]["total_leads"] += 1
                sources[source]["total_value"] += deal_value
                
                if stage == "Closed Won":
                    sources[source]["closed_won"] += 1
            
            source_list = []
            for source_name, data in sources.items():
                data["conversion_rate"] = (
                    round(data["closed_won"] / data["total_leads"] * 100, 1)
                    if data["total_leads"] > 0 else 0
                )
                source_list.append(data)
            
            source_list.sort(key=lambda x: x["total_leads"], reverse=True)
            
            return {
                "sources": source_list,
                "total_leads": len(all_leads),
                "total_pipeline_value": sum(l.get("deal_value", 0) or 0 for l in all_leads)
            }
            
        except Exception as e:
            logger.error(f"Error getting campaign stats: {e}")
            return {"sources": [], "total_leads": 0}
    
    def _transform_lead_data(self, lead: Dict[str, Any]) -> Dict[str, Any]:
        """Transform CRM lead data to marketing agent format"""
        return {
            "id": lead.get("id"),
            "name": lead.get("contact_person") or lead.get("client_name") or lead.get("name"),
            "company": lead.get("client_name") or lead.get("company_name"),
            "client_name": lead.get("client_name"),
            "email": lead.get("email"),
            "phone": lead.get("phone"),
            "industry": lead.get("industry"),
            "pipeline_stage": lead.get("pipeline_stage") or lead.get("status"),
            "status": lead.get("status"),
            "deal_value": lead.get("deal_value") or lead.get("budget_amount") or 0,
            "lead_score": lead.get("lead_score", 0),
            "source": lead.get("source"),
            "assigned_agent": lead.get("assigned_agent"),
            "last_contact": lead.get("updated_at") or lead.get("last_contact"),
            "created_at": lead.get("created_at"),
            "tags": lead.get("tags", []),
            "notes": lead.get("notes"),
            "pain_points": lead.get("pain_points") or lead.get("requirements")
        }
    
    def _calculate_quick_temp_score(self, lead_data: Dict[str, Any]) -> int:
        """Quick temperature score calculation"""
        score = 0
        
        deal_value = lead_data.get("deal_value", 0) or 0
        if deal_value >= 10000:
            score += 25
        elif deal_value >= 1000:
            score += 15
        elif deal_value > 0:
            score += 5
        
        stage_scores = {
            "Closed Won": 30, "Negotiation": 25, "Proposal Sent": 20,
            "Needs Analysis": 15, "Contact Made": 10, "Qualified": 8, "New Lead": 5
        }
        stage = lead_data.get("pipeline_stage") or lead_data.get("status") or ""
        score += stage_scores.get(stage, 5)
        
        last_contact = lead_data.get("last_contact")
        if last_contact:
            try:
                if isinstance(last_contact, str):
                    last_date = datetime.fromisoformat(last_contact.replace('Z', '+00:00'))
                else:
                    last_date = last_contact
                
                if last_date.tzinfo:
                    last_date = last_date.replace(tzinfo=None)
                
                days_ago = (datetime.utcnow() - last_date).days
                if days_ago <= 1:
                    score += 20
                elif days_ago <= 7:
                    score += 15
                elif days_ago <= 30:
                    score += 10
            except:
                pass
        
        lead_score = lead_data.get("lead_score", 0) or 0
        score += int(lead_score * 0.25)
        
        return min(100, score)


### FILE: agent.py ###


"""
=============================================================================
END OF MARKETING AGENT CODE

SETUP INSTRUCTIONS:
1. Create folder: clara-backend/agents/marketing_agent/
2. Create these files from sections above:
   - __init__.py
   - prompts.py  
   - lead_analyzer.py
   - content_generator.py
   - nurturing_engine.py
   - crm_connector.py
   - agent.py

3. Add routes to main.py (see routes.py section in separate file)

=============================================================================
"""