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
