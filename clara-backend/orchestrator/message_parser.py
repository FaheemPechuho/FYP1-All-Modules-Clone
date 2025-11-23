"""
Message Parser - Parse and structure incoming messages
"""

from typing import Dict, Any, Optional
from datetime import datetime
import uuid
from utils.logger import get_logger
from utils.validators import (
    extract_email_from_text,
    extract_numbers,
    sanitize_text
)

logger = get_logger("message_parser")


class MessageParser:
    """Parse raw messages into structured format"""
    
    @staticmethod
    def parse_message(
        raw_message: str,
        input_channel: str,
        user_info: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Parse raw message into structured format
        
        Args:
            raw_message: The raw message text
            input_channel: Channel (voice, email, chatbot)
            user_info: Optional user information
            session_id: Optional session ID
            
        Returns:
            Structured message dictionary
        """
        try:
            # Generate message ID if not provided
            message_id = str(uuid.uuid4())
            
            # Generate session ID if not provided
            if not session_id:
                session_id = str(uuid.uuid4())
            
            # Sanitize message
            sanitized_message = sanitize_text(raw_message, max_length=5000)
            
            # Extract basic entities
            extracted_email = extract_email_from_text(sanitized_message)
            extracted_numbers = extract_numbers(sanitized_message)
            
            # Build structured message
            structured_message = {
                "message_id": message_id,
                "timestamp": datetime.utcnow().isoformat(),
                "input_channel": input_channel,
                "user_info": user_info or {
                    "session_id": session_id,
                },
                "raw_message": raw_message,
                "sanitized_message": sanitized_message,
                "extracted_entities": {
                    "email": extracted_email,
                    "numbers": extracted_numbers,
                    "message_length": len(sanitized_message),
                },
                "parsed_message": None,  # Will be filled by classifier
                "routing": None,  # Will be filled by router
            }
            
            logger.info(f"Parsed message {message_id} from {input_channel}")
            return structured_message
            
        except Exception as e:
            logger.error(f"Error parsing message: {e}")
            raise
    
    @staticmethod
    def extract_intent_keywords(message: str) -> Dict[str, list]:
        """
        Extract keywords that indicate intent
        
        Args:
            message: Message text
            
        Returns:
            Dictionary of intent keywords found
        """
        message_lower = message.lower()
        
        # Sales intent keywords
        sales_keywords = [
            "buy", "purchase", "price", "cost", "demo", "trial",
            "quote", "interested", "product", "service", "sales",
            "inquiry", "information", "details", "features"
        ]
        
        # Support intent keywords
        support_keywords = [
            "help", "issue", "problem", "bug", "error", "broken",
            "not working", "support", "ticket", "fix", "troubleshoot",
            "assistance", "question", "how to"
        ]
        
        # Marketing intent keywords
        marketing_keywords = [
            "feedback", "suggestion", "feature request", "improvement",
            "campaign", "newsletter", "subscribe", "testimonial",
            "review", "opinion", "like", "dislike"
        ]
        
        found_keywords = {
            "sales": [kw for kw in sales_keywords if kw in message_lower],
            "support": [kw for kw in support_keywords if kw in message_lower],
            "marketing": [kw for kw in marketing_keywords if kw in message_lower],
        }
        
        return found_keywords
    
    @staticmethod
    def extract_company_info(message: str) -> Dict[str, Any]:
        """
        Extract potential company information from message
        
        Args:
            message: Message text
            
        Returns:
            Dictionary with extracted company info
        """
        import re
        
        info = {
            "potential_company_names": [],
            "potential_industries": [],
            "potential_locations": [],
        }
        
        # Common industry keywords
        industries = [
            "technology", "healthcare", "finance", "education",
            "retail", "manufacturing", "construction", "real estate",
            "software", "ecommerce", "consulting", "marketing"
        ]
        
        message_lower = message.lower()
        
        # Find industry matches
        for industry in industries:
            if industry in message_lower:
                info["potential_industries"].append(industry)
        
        # Find potential company names (capitalized words/phrases)
        # This is a simple heuristic
        words = message.split()
        for i, word in enumerate(words):
            if word[0].isupper() and len(word) > 2:
                # Check if it's not a common word
                if word.lower() not in ["i", "we", "the", "and", "but", "for"]:
                    info["potential_company_names"].append(word)
        
        return info
    
    @staticmethod
    def extract_urgency(message: str) -> str:
        """
        Determine message urgency level
        
        Args:
            message: Message text
            
        Returns:
            Urgency level: high, medium, low
        """
        message_lower = message.lower()
        
        high_urgency_keywords = [
            "urgent", "asap", "immediately", "emergency", "critical",
            "right now", "as soon as possible", "urgent"
        ]
        
        medium_urgency_keywords = [
            "soon", "quickly", "today", "this week", "important"
        ]
        
        # Check for high urgency
        if any(keyword in message_lower for keyword in high_urgency_keywords):
            return "high"
        
        # Check for medium urgency
        if any(keyword in message_lower for keyword in medium_urgency_keywords):
            return "medium"
        
        # Check for exclamation marks (can indicate urgency)
        if message.count("!") >= 2:
            return "medium"
        
        return "low"

