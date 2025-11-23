"""
Lead Qualifier - Qualify leads based on conversation
"""

from typing import Dict, Any, Optional
import json
from openai import OpenAI
from groq import Groq
from utils.logger import get_logger
from config import get_api_key, get_agent_model
from .prompts import LEAD_QUALIFICATION_PROMPT

logger = get_logger("lead_qualifier")


class LeadQualifier:
    """Qualify leads using BANT framework"""
    
    def __init__(self):
        """Initialize lead qualifier with LLM client"""
        api_key = get_api_key("openai") or get_api_key("groq")
        
        if not api_key:
            raise ValueError("No LLM API key configured for lead qualification")
        
        # Initialize appropriate client
        if api_key.startswith("gsk_"):
            self.client = Groq(api_key=api_key)
            self.model = "llama-3.3-70b-versatile"  # Groq Llama 3.3 70B (latest)
        else:
            self.client = OpenAI(api_key=api_key)
            self.model = get_agent_model("sales")
        
        logger.info(f"Lead qualifier initialized with model: {self.model}")
    
    def qualify_lead(
        self,
        conversation_history: list,
        latest_message: str,
        current_lead_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Qualify a lead based on conversation
        
        Args:
            conversation_history: List of conversation messages
            latest_message: Most recent message from user
            current_lead_info: Existing lead information if any
            
        Returns:
            Qualification result dictionary
        """
        result_text = None  # Initialize for error handling
        
        try:
            # Format conversation history
            conversation_text = self._format_conversation(conversation_history)
            
            # Build prompt
            prompt = LEAD_QUALIFICATION_PROMPT.format(
                conversation_history=conversation_text,
                latest_message=latest_message
            )
            
            # Call LLM with explicit JSON format request
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Analyze this lead and provide qualification assessment in valid JSON format only. Return ONLY the JSON object, no additional text."}
            ]
            
            logger.debug(f"Calling LLM for lead qualification with model: {self.model}")
            
            # Note: response_format is OpenAI-specific, not supported by Groq
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.1,  # Lower temperature for more consistent JSON
                max_tokens=1000
            )
            
            result_text = response.choices[0].message.content
            logger.debug(f"LLM response received, length: {len(result_text) if result_text else 0} chars")
            
            # Aggressive JSON extraction and cleaning
            logger.debug(f"Raw LLM response: {result_text[:200]}...")
            
            # Remove markdown code blocks if present
            if "```json" in result_text:
                parts = result_text.split("```json")
                if len(parts) > 1:
                    result_text = parts[1].split("```")[0]
            elif "```" in result_text:
                parts = result_text.split("```")
                if len(parts) > 1:
                    result_text = parts[1].split("```")[0] if len(parts) > 2 else parts[1]
            
            # Strip all leading/trailing whitespace
            result_text = result_text.strip()
            
            # Find the JSON object boundaries (most reliable method)
            if '{' in result_text and '}' in result_text:
                start_idx = result_text.find('{')
                end_idx = result_text.rfind('}') + 1
                if start_idx != -1 and end_idx > start_idx:
                    result_text = result_text[start_idx:end_idx]
            
            # Final strip and newline normalization
            result_text = result_text.strip()
            
            # Log the cleaned JSON for debugging
            logger.debug(f"Cleaned JSON (first 200 chars): {result_text[:200]}...")
            
            # Parse JSON
            qualification_result = json.loads(result_text)
            
            # Merge with existing lead info if available
            if current_lead_info:
                extracted = qualification_result.get("extracted_info", {})
                for key, value in current_lead_info.items():
                    if key not in extracted or not extracted[key]:
                        extracted[key] = value
                qualification_result["extracted_info"] = extracted
            
            logger.info(
                f"Lead qualified as: {qualification_result.get('qualification_status')} "
                f"(score: {qualification_result.get('lead_score')})"
            )
            
            return qualification_result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse qualification JSON: {e}")
            if result_text:
                logger.error(f"Problematic JSON text (first 500 chars): {result_text[:500]}")
            else:
                logger.error("No result_text available - LLM may not have returned a response")
            return self._get_fallback_qualification()
            
        except Exception as e:
            logger.error(f"Error qualifying lead: {e}")
            if result_text:
                logger.error(f"Raw response (first 500 chars): {result_text[:500]}")
            else:
                logger.error("No result_text available - error occurred before LLM response")
            return self._get_fallback_qualification()
    
    def assess_bant(
        self,
        conversation_history: list,
        lead_info: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Assess BANT (Budget, Authority, Need, Timeline) status
        
        Args:
            conversation_history: Conversation messages
            lead_info: Lead information
            
        Returns:
            BANT assessment dictionary
        """
        # Extract BANT indicators from conversation
        conversation_text = " ".join([
            msg.get("content", "") for msg in conversation_history
            if msg.get("role") == "user"
        ]).lower()
        
        bant = {
            "budget": self._assess_budget(conversation_text, lead_info),
            "authority": self._assess_authority(conversation_text, lead_info),
            "need": self._assess_need(conversation_text, lead_info),
            "timeline": self._assess_timeline(conversation_text, lead_info),
        }
        
        return bant
    
    def _assess_budget(self, conversation_text: str, lead_info: dict) -> str:
        """Assess budget status"""
        budget_keywords = {
            "high": ["enterprise", "unlimited budget", "large budget", "significant investment"],
            "medium": ["budget", "cost", "price", "affordable", "pricing"],
            "low": ["cheap", "free", "minimal", "tight budget"],
        }
        
        for level, keywords in budget_keywords.items():
            if any(kw in conversation_text for kw in keywords):
                return level
        
        # Check company size as indicator
        company_size = lead_info.get("company_size", "")
        if isinstance(company_size, str):
            if any(word in company_size.lower() for word in ["large", "enterprise", "500+"]):
                return "high"
            elif any(word in company_size.lower() for word in ["medium", "100-500"]):
                return "medium"
        
        return "unknown"
    
    def _assess_authority(self, conversation_text: str, lead_info: dict) -> str:
        """Assess authority status"""
        decision_maker_keywords = [
            "ceo", "founder", "owner", "president", "director", "vp",
            "head of", "chief", "manager", "decision maker", "i decide"
        ]
        
        influencer_keywords = [
            "recommend", "suggest to", "team member", "will discuss with"
        ]
        
        if any(kw in conversation_text for kw in decision_maker_keywords):
            return "yes"
        elif any(kw in conversation_text for kw in influencer_keywords):
            return "influencer"
        elif "not the decision maker" in conversation_text or "need to check with" in conversation_text:
            return "no"
        
        return "unknown"
    
    def _assess_need(self, conversation_text: str, lead_info: dict) -> str:
        """Assess need/pain point status"""
        urgency_keywords = ["urgent", "critical", "immediately", "asap", "right now"]
        high_need_keywords = ["problem", "issue", "struggling", "need", "require", "must have"]
        medium_need_keywords = ["want", "interested", "looking for", "considering"]
        
        if any(kw in conversation_text for kw in urgency_keywords):
            return "urgent"
        elif any(kw in conversation_text for kw in high_need_keywords):
            return "high"
        elif any(kw in conversation_text for kw in medium_need_keywords):
            return "medium"
        elif "just browsing" in conversation_text or "just looking" in conversation_text:
            return "low"
        
        return "unknown"
    
    def _assess_timeline(self, conversation_text: str, lead_info: dict) -> str:
        """Assess timeline status"""
        timeline_keywords = {
            "immediate": ["immediately", "right now", "asap", "today", "this week"],
            "this_quarter": ["this month", "this quarter", "next month", "soon", "quickly"],
            "future": ["later", "future", "eventually", "next year", "planning"],
            "no_timeline": ["no rush", "no timeline", "just exploring", "just researching"],
        }
        
        for level, keywords in timeline_keywords.items():
            if any(kw in conversation_text for kw in keywords):
                return level
        
        return "unknown"
    
    def _format_conversation(self, conversation_history: list) -> str:
        """Format conversation history for prompt"""
        formatted = []
        for msg in conversation_history[-10:]:  # Last 10 messages
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role != "system":
                formatted.append(f"{role.upper()}: {content}")
        
        return "\n".join(formatted)
    
    def _get_fallback_qualification(self) -> Dict[str, Any]:
        """Get fallback qualification result"""
        return {
            "qualification_status": "unqualified",
            "lead_score": 0,
            "bant_assessment": {
                "budget": "unknown",
                "authority": "unknown",
                "need": "unknown",
                "timeline": "unknown"
            },
            "extracted_info": {},
            "next_best_action": "Continue conversation to gather more information",
            "missing_information": ["company_name", "contact_info", "needs", "timeline"]
        }
    
    def get_qualification_stage(self, bant: Dict[str, str], lead_score: int) -> str:
        """
        Determine qualification stage based on BANT and score
        
        Args:
            bant: BANT assessment
            lead_score: Lead score (0-100)
            
        Returns:
            Qualification stage
        """
        # Count how many BANT criteria are known
        known_bant = sum(1 for v in bant.values() if v != "unknown")
        
        # Sales Qualified Lead criteria
        if (lead_score >= 60 and known_bant >= 3 and
            bant.get("need") in ["high", "urgent"] and
            bant.get("authority") in ["yes", "influencer"]):
            return "sales_qualified"
        
        # Marketing Qualified Lead criteria  
        elif lead_score >= 40 and known_bant >= 2:
            return "marketing_qualified"
        
        # Opportunity criteria
        elif (lead_score >= 70 and known_bant == 4 and
              bant.get("timeline") in ["immediate", "this_quarter"]):
            return "opportunity"
        
        # Otherwise unqualified
        else:
            return "unqualified"

