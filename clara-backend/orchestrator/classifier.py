"""
Message Classifier - Classify message intent using LLM
"""

from typing import Dict, Any, Optional
import json
from openai import OpenAI
from config import settings, get_api_key
from utils.logger import get_logger
from .message_parser import MessageParser

logger = get_logger("classifier")


class MessageClassifier:
    """Classify message intent and extract entities"""
    
    def __init__(self):
        """Initialize classifier with LLM client"""
        self.api_key = get_api_key("openai") or get_api_key("groq")
        
        if not self.api_key:
            raise ValueError("No LLM API key configured")
        
        # Use OpenAI-compatible client
        self.client = OpenAI(api_key=self.api_key)
        
        # Use Groq if using Groq API key
        if self.api_key.startswith("gsk_"):
            from groq import Groq
            self.client = Groq(api_key=self.api_key)
            self.model = "llama-3.3-70b-versatile"  # Groq Llama 3.3 70B (latest)
        else:
            self.model = "gpt-4-turbo-preview"
        
        logger.info(f"Classifier initialized with model: {self.model}")
    
    def classify(self, message: str) -> Dict[str, Any]:
        """
        Classify message intent and extract entities
        
        Args:
            message: Message text to classify
            
        Returns:
            Classification result with intent, entities, and confidence
        """
        try:
            # First, use rule-based classification as fallback
            rule_based_result = self._rule_based_classification(message)
            
            # Then use LLM for more accurate classification
            try:
                llm_result = self._llm_classification(message)
                
                # Combine both results, preferring LLM if confidence is high
                if llm_result["confidence"] >= settings.CLASSIFICATION_CONFIDENCE_THRESHOLD:
                    final_result = llm_result
                else:
                    # Use rule-based as primary, LLM for enhancement
                    final_result = rule_based_result
                    final_result["entities"].update(llm_result.get("entities", {}))
                    
            except Exception as llm_error:
                logger.warning(f"LLM classification failed, using rule-based: {llm_error}")
                final_result = rule_based_result
            
            logger.info(f"Classified message as '{final_result['intent']}' with confidence {final_result['confidence']}")
            return final_result
            
        except Exception as e:
            logger.error(f"Error classifying message: {e}")
            # Return default classification
            return {
                "intent": settings.DEFAULT_AGENT,
                "entities": {},
                "confidence": 0.5,
                "error": str(e)
            }
    
    def _rule_based_classification(self, message: str) -> Dict[str, Any]:
        """
        Rule-based classification using keywords
        
        Args:
            message: Message text
            
        Returns:
            Classification result
        """
        # Extract keywords
        keywords = MessageParser.extract_intent_keywords(message)
        urgency = MessageParser.extract_urgency(message)
        company_info = MessageParser.extract_company_info(message)
        
        # Count matches for each category
        sales_score = len(keywords["sales"])
        support_score = len(keywords["support"])
        marketing_score = len(keywords["marketing"])
        
        # Determine intent based on highest score
        if sales_score > support_score and sales_score > marketing_score:
            intent = "sales"
            confidence = min(0.85, 0.5 + (sales_score * 0.1))
        elif support_score > sales_score and support_score > marketing_score:
            intent = "support"
            confidence = min(0.85, 0.5 + (support_score * 0.1))
        elif marketing_score > 0:
            intent = "marketing"
            confidence = min(0.85, 0.5 + (marketing_score * 0.1))
        else:
            # Default to sales if no clear match
            intent = "sales"
            confidence = 0.5
        
        return {
            "intent": intent,
            "entities": {
                "urgency": urgency,
                "keywords_found": keywords,
                "potential_company": company_info.get("potential_company_names", []),
                "potential_industry": company_info.get("potential_industries", []),
            },
            "confidence": confidence,
            "classification_method": "rule_based"
        }
    
    def _llm_classification(self, message: str) -> Dict[str, Any]:
        """
        LLM-based classification using GPT/Mixtral
        
        Args:
            message: Message text
            
        Returns:
            Classification result
        """
        system_prompt = """You are an intent classification system for a CRM. Analyze the message and classify it into one of these categories:

1. **sales**: Lead inquiries, product interest, pricing questions, demo requests, purchase intent
2. **support**: Technical issues, bugs, help requests, troubleshooting, account problems
3. **marketing**: Feedback, feature requests, suggestions, testimonials, general opinions

Also extract key entities like:
- Company name
- Industry
- Contact person name
- Urgency level (high/medium/low)
- Specific product/service mentioned

Respond in JSON format:
{
    "intent": "sales|support|marketing",
    "confidence": 0.0-1.0,
    "entities": {
        "company_name": "string or null",
        "industry": "string or null",
        "contact_person": "string or null",
        "urgency": "high|medium|low",
        "product_mentioned": "string or null"
    },
    "reasoning": "brief explanation"
}"""
        
        user_prompt = f"Classify this message:\n\n{message}"
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=300,
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            # Remove markdown code blocks if present
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(result_text)
            
            # Validate intent
            if result["intent"] not in ["sales", "support", "marketing"]:
                result["intent"] = "sales"  # Default fallback
            
            # Ensure confidence is valid
            result["confidence"] = max(0.0, min(1.0, result.get("confidence", 0.7)))
            
            result["classification_method"] = "llm"
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            raise
        except Exception as e:
            logger.error(f"LLM classification error: {e}")
            raise
    
    def classify_batch(self, messages: list) -> list:
        """
        Classify multiple messages in batch
        
        Args:
            messages: List of message texts
            
        Returns:
            List of classification results
        """
        results = []
        for message in messages:
            result = self.classify(message)
            results.append(result)
        
        return results

