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
