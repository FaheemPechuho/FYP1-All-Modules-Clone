"""
Content Generator - LangChain + Ollama powered content generation
Owner: Sheryar

This module handles AI-powered content generation for marketing purposes
using LangChain with Ollama (local LLM) as the primary LLM provider.

Features:
- Personalized email generation based on lead data
- SMS message creation with character limits
- Cold call script generation with objection handlers
- Platform-specific ad copy (Facebook, TikTok, LinkedIn, Google)
- Batch content generation for multiple leads

LangChain Integration:
- Uses Ollama for local LLM inference
- Structured output parsing with JSON
- Template-based prompting with LangChain PromptTemplates
"""

from typing import Dict, Any, Optional, List
import json
import os
import requests
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

# =============================================================================
# LANGCHAIN INITIALIZATION
# =============================================================================

def init_ollama_config():
    """
    Initialize Ollama configuration for local LLM inference.
    
    Priority:
    1. Ollama (local) - Primary option for all content generation
    2. Groq (cloud) - Fallback if Ollama is not available
    3. OpenAI (cloud) - Secondary fallback
    
    Configuration (via environment variables):
    - OLLAMA_API_URL: chat endpoint, default http://localhost:11434/api/chat
    - OLLAMA_MODEL_NAME: model name, default "llama3.1"
    """
    # Try Ollama first (local inference)
    ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
    ollama_model = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")
    
    # Check if Ollama is available
    try:
        # Test connection to Ollama server
        test_url = ollama_url.replace("/api/chat", "/api/tags")
        response = requests.get(test_url, timeout=5)
        response.raise_for_status()
        
        # If we get here, Ollama is available
        logger.info(f"✅ Ollama initialized with model: {ollama_model}")
        return {
            "type": "ollama",
            "url": ollama_url,
            "model": ollama_model
        }
    except requests.exceptions.ConnectionError as e:
        logger.warning(f"⚠️ Ollama not available (connection error): {e}. Trying fallback providers.")
    except requests.exceptions.Timeout as e:
        logger.warning(f"⚠️ Ollama timeout: {e}. Trying fallback providers.")
    except Exception as e:
        logger.warning(f"⚠️ Ollama check failed: {e}. Trying fallback providers.")
    
    # Fallback to Groq
    groq_key = get_api_key("groq")
    if groq_key and groq_key.startswith("gsk_"):
        try:
            from langchain_groq import ChatGroq
            
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                groq_api_key=groq_key,
                temperature=0.7,
                max_tokens=1500
            )
            logger.info("LangChain initialized with Groq (llama-3.3-70b)")
            return {
                "type": "langchain",
                "llm": llm,
                "provider": "groq"
            }
            
        except ImportError:
            # Try alternative import
            try:
                from langchain.chat_models import ChatGroq
                llm = ChatGroq(
                    model="llama-3.3-70b-versatile",
                    groq_api_key=groq_key,
                    temperature=0.7
                )
                return {
                    "type": "langchain",
                    "llm": llm,
                    "provider": "groq"
                }
            except ImportError:
                logger.warning("langchain-groq not installed")
        except Exception as e:
            logger.error(f"Error initializing Groq: {e}")
    
    # Fallback to OpenAI
    openai_key = get_api_key("openai")
    if openai_key:
        try:
            from langchain_openai import ChatOpenAI
            
            llm = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=openai_key,
                temperature=0.7,
                max_tokens=1500
            )
            logger.info("LangChain initialized with OpenAI (gpt-4o-mini)")
            return {
                "type": "langchain",
                "llm": llm,
                "provider": "openai"
            }
            
        except ImportError:
            try:
                from langchain.chat_models import ChatOpenAI
                llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    openai_api_key=openai_key,
                    temperature=0.7
                )
                return {
                    "type": "langchain",
                    "llm": llm,
                    "provider": "openai"
                }
            except ImportError:
                logger.warning("langchain-openai not installed")
        except Exception as e:
            logger.error(f"Error initializing OpenAI: {e}")
    
    logger.warning("No LLM provider configured - using fallback templates")
    return {"type": "fallback"}


# =============================================================================
# CONTENT GENERATOR CLASS
# =============================================================================

class ContentGenerator:
    """
    Generate marketing content using Ollama (local LLM) or cloud LLM fallbacks.
    
    Supported LLM providers (in priority order):
    1. Ollama (local - primary for all content generation)
    2. Groq (cloud fallback - fast inference)
    3. OpenAI (cloud fallback)
    4. Fallback templates (if no LLM available)
    """
    
    def __init__(self):
        """Initialize content generator with Ollama or fallback LLM"""
        self.config = init_ollama_config()
        self.llm = None
        self.provider = "fallback"
        
        if self.config["type"] == "ollama":
            self.provider = "ollama"
            self.ollama_url = self.config["url"]
            self.ollama_model = self.config["model"]
            logger.info(f"ContentGenerator initialized with Ollama ({self.ollama_model})")
        elif self.config["type"] == "langchain":
            self.llm = self.config["llm"]
            self.provider = self.config["provider"]
            logger.info(f"ContentGenerator initialized with {self.provider}")
        else:
            logger.warning("ContentGenerator using fallback templates")
    
    def generate_email(
        self,
        lead_info: Dict[str, Any],
        email_type: str = "follow_up",
        tone: str = "professional"
    ) -> Dict[str, Any]:
        """
        Generate personalized email content using LangChain.
        
        Args:
            lead_info: Lead data dictionary with name, company, industry, etc.
            email_type: Type of email (follow_up, intro, proposal, etc.)
            tone: Email tone (professional, friendly, casual, etc.)
            
        Returns:
            Dictionary with email components (subject, body, cta, etc.)
        """
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
                result["provider"] = self.provider
            
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
        """
        Generate SMS message using LangChain.
        
        Args:
            lead_info: Lead data dictionary
            sms_type: Type of SMS (follow_up, reminder, appointment, etc.)
            context: Additional context for the message
            
        Returns:
            Dictionary with SMS content and metadata
        """
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
                result["provider"] = self.provider
                # Calculate character count if not provided
                if "character_count" not in result and "message" in result:
                    result["character_count"] = len(result["message"])
            
            return result or self._get_fallback_sms(lead_info)
            
        except Exception as e:
            logger.error(f"Error generating SMS: {e}")
            return self._get_fallback_sms(lead_info)
    
    def generate_cold_call_script(
        self,
        lead_info: Dict[str, Any],
        objective: str = "discovery"
    ) -> Dict[str, Any]:
        """
        Generate cold call script using LangChain.
        
        Args:
            lead_info: Lead data dictionary
            objective: Call objective (discovery, demo, follow_up, etc.)
            
        Returns:
            Dictionary with script sections (opener, questions, objections, etc.)
        """
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
                result["provider"] = self.provider
            
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
        """
        Generate platform-specific ad copy using LangChain.
        
        Args:
            platform: Ad platform (facebook, tiktok, linkedin, google)
            target_profile: Target audience profile
            objective: Campaign objective (awareness, conversion, etc.)
            
        Returns:
            Dictionary with ad components (headlines, text, cta, etc.)
        """
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
                result["provider"] = self.provider
            
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
        """
        Generate content for multiple leads.
        
        Args:
            leads: List of lead data dictionaries
            content_type: Type of content (email, sms, call_script)
            **kwargs: Additional parameters for content generation
            
        Returns:
            List of generated content dictionaries
        """
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
    
    # =========================================================================
    # LLM CALL METHOD
    # =========================================================================
    
    def _call_llm(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Make LLM API call using Ollama or LangChain and parse JSON response.
        
        Args:
            prompt: The content generation prompt
            
        Returns:
            Parsed JSON response or None if failed
        """
        try:
            # Use Ollama if configured
            if self.provider == "ollama":
                return self._call_ollama(prompt)
            
            # Return None if no LLM configured
            if not self.llm:
                logger.warning("No LLM configured, using fallback")
                return None
            
            # Build messages for LangChain LLMs
            from langchain_core.messages import SystemMessage, HumanMessage
            
            messages = [
                SystemMessage(content=MARKETING_AGENT_SYSTEM_PROMPT),
                HumanMessage(content=f"{prompt}\n\nRespond with ONLY valid JSON, no markdown or extra text.")
            ]
            
            # Call LLM via LangChain
            response = self.llm.invoke(messages)
            
            # Extract text from response
            result_text = response.content if hasattr(response, 'content') else str(response)
            
            # Clean and parse JSON
            result_text = self._clean_json_response(result_text)
            return json.loads(result_text)
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            logger.debug(f"Raw response: {result_text[:500] if 'result_text' in locals() else 'N/A'}")
            return None
        except Exception as e:
            logger.error(f"LLM call error ({self.provider}): {e}")
            return None
    
    def _call_ollama(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        Call Ollama API directly for content generation.
        
        Similar to the support agent's implementation for consistency.
        
        Args:
            prompt: The content generation prompt
            
        Returns:
            Parsed JSON response or None if failed
        """
        try:
            # Build Ollama chat API payload
            payload = {
                "model": self.ollama_model,
                "messages": [
                    {"role": "system", "content": MARKETING_AGENT_SYSTEM_PROMPT},
                    {"role": "user", "content": f"{prompt}\n\nRespond with ONLY valid JSON, no markdown or extra text."}
                ],
                "stream": False,
                "options": {
                    "temperature": 0.7
                }
            }
            
            # Call Ollama API
            resp = requests.post(self.ollama_url, json=payload, timeout=120)
            resp.raise_for_status()
            data = resp.json()
            
            # Extract content from Ollama response
            # Ollama format: {"message": {"role": "assistant", "content": "..."}, ...}
            message = data.get("message") or {}
            content = message.get("content")
            
            if not content:
                logger.error("No content in Ollama response")
                return None
            
            # Clean and parse JSON
            content = self._clean_json_response(content)
            return json.loads(content)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama API request error: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error from Ollama: {e}")
            logger.debug(f"Raw response: {content[:500] if 'content' in locals() else 'N/A'}")
            return None
        except Exception as e:
            logger.error(f"Ollama call error: {e}")
            return None
    
    def _clean_json_response(self, text: str) -> str:
        """
        Clean LLM response to extract valid JSON.
        
        Handles:
        - Markdown code blocks
        - Extra text before/after JSON
        - Various formatting issues
        """
        # Remove markdown code blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            parts = text.split("```")
            if len(parts) > 1:
                text = parts[1]
        
        text = text.strip()
        
        # Find JSON object boundaries
        if '{' in text and '}' in text:
            start = text.find('{')
            end = text.rfind('}') + 1
            text = text[start:end]
        
        return text.strip()
    
    # =========================================================================
    # FALLBACK TEMPLATES
    # =========================================================================
    
    def _get_fallback_email(self, lead_info: Dict[str, Any], email_type: str) -> Dict[str, Any]:
        """Return fallback email template when LLM fails"""
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
            "is_fallback": True,
            "provider": "fallback"
        }
    
    def _get_fallback_sms(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Return fallback SMS template when LLM fails"""
        name = lead_info.get("name") or lead_info.get("client_name") or ""
        message = f"Hi{f' {name}' if name else ''}, just following up. Do you have a few minutes to chat this week?"
        
        return {
            "message": message,
            "character_count": len(message),
            "has_link_placeholder": False,
            "urgency_level": "low",
            "lead_id": lead_info.get("id"),
            "is_fallback": True,
            "provider": "fallback"
        }
    
    def _get_fallback_call_script(self, lead_info: Dict[str, Any]) -> Dict[str, Any]:
        """Return fallback call script when LLM fails"""
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
            "is_fallback": True,
            "provider": "fallback"
        }
    
    def _get_fallback_ad_copy(self, platform: str) -> Dict[str, Any]:
        """Return fallback ad copy when LLM fails"""
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
            "hashtags": ["#business", "#growth", "#automation"],
            "emoji_suggestions": ["🚀", "✅", "💼", "📈"],
            "a_b_variations": [
                {"headline": "Transform Your Business", "primary_text": "See why thousands trust us."},
                {"headline": "Results Guaranteed", "primary_text": "Start your free trial today."}
            ],
            "platform": platform,
            "is_fallback": True,
            "provider": "fallback"
        }
