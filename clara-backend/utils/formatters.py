"""
Data formatting utilities
"""

from typing import Dict, Any, Optional
from datetime import datetime
import json


def format_lead_data(lead_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format lead data for CRM insertion
    
    Args:
        lead_info: Raw lead information dictionary
        
    Returns:
        Formatted lead data ready for database
    """
    formatted = {
        # Required fields
        "client_name": lead_info.get("company_name") or lead_info.get("client_name", "Unknown"),
        "contact_person": lead_info.get("contact_person", ""),
        
        # Contact information
        "email": lead_info.get("email", ""),
        "phone": lead_info.get("phone", ""),
        
        # Company details
        "company": lead_info.get("company_name", ""),
        "industry": lead_info.get("industry", ""),
        "company_size": lead_info.get("company_size"),
        "location": lead_info.get("location", ""),
        
        # Lead details
        "lead_source": lead_info.get("lead_source", "voice_assistant"),
        "status_bucket": lead_info.get("status_bucket", "P3"),
        "qualification_status": lead_info.get("qualification_status", "unqualified"),
        "lead_score": lead_info.get("lead_score", 0),
        
        # Business details
        "deal_value": lead_info.get("deal_value") or lead_info.get("expected_value"),
        "expected_close_date": lead_info.get("expected_close_date"),
        "win_probability": lead_info.get("win_probability", 0),
        
        # Additional info
        "notes": lead_info.get("notes", ""),
        "next_step": lead_info.get("next_step", "Initial qualification"),
        "tags": lead_info.get("tags", []),
        
        # Timestamps
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "first_touch_date": lead_info.get("first_touch_date", datetime.utcnow().isoformat()),
        "last_touch_date": datetime.utcnow().isoformat(),
    }
    
    # Remove None values
    return {k: v for k, v in formatted.items() if v is not None}


def format_response(
    message: str,
    agent_type: str,
    confidence: float = 1.0,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Format agent response in standard structure
    
    Args:
        message: Response message text
        agent_type: Type of agent (sales, support, marketing)
        confidence: Confidence score (0-1)
        metadata: Additional metadata
        
    Returns:
        Formatted response dictionary
    """
    return {
        "message": message,
        "agent": agent_type,
        "confidence": confidence,
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": metadata or {},
    }


def format_conversation_history(
    messages: list,
    max_messages: int = 10
) -> list:
    """
    Format conversation history for LLM context
    
    Args:
        messages: List of message dictionaries
        max_messages: Maximum messages to include
        
    Returns:
        Formatted conversation history
    """
    # Take last N messages
    recent_messages = messages[-max_messages:] if len(messages) > max_messages else messages
    
    formatted = []
    for msg in recent_messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        
        formatted.append({
            "role": role,
            "content": content
        })
        
    return formatted


def format_activity_log(
    activity_type: str,
    description: str,
    lead_id: str,
    created_by: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Format activity log entry for CRM
    
    Args:
        activity_type: Type of activity (call, email, note, etc.)
        description: Activity description
        lead_id: Associated lead ID
        created_by: User/agent who created the activity
        metadata: Additional metadata
        
    Returns:
        Formatted activity log
    """
    return {
        "activity_type": activity_type,
        "description": description,
        "lead_id": lead_id,
        "created_by": created_by,
        "activity_date": datetime.utcnow().isoformat(),
        "metadata": metadata or {},
        "is_automated": True,  # All agent activities are automated
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }


def format_json_response(
    success: bool,
    data: Any = None,
    error: Optional[str] = None,
    message: Optional[str] = None
) -> Dict[str, Any]:
    """
    Format standardized JSON API response
    
    Args:
        success: Whether operation was successful
        data: Response data
        error: Error message if failed
        message: Success message
        
    Returns:
        Formatted JSON response
    """
    response = {
        "success": success,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    if data is not None:
        response["data"] = data
        
    if message:
        response["message"] = message
        
    if error:
        response["error"] = error
        
    return response


def parse_lead_score(score: Any) -> int:
    """
    Parse and validate lead score
    
    Args:
        score: Score value to parse
        
    Returns:
        Integer score between 0-100
    """
    try:
        score_int = int(score)
        # Clamp between 0-100
        return max(0, min(100, score_int))
    except (ValueError, TypeError):
        return 0


def format_phone_display(phone: str) -> str:
    """
    Format phone number for display
    
    Args:
        phone: Phone number (E164 format)
        
    Returns:
        Formatted phone number
    """
    if not phone:
        return ""
        
    # Remove + and format
    if phone.startswith("+"):
        phone = phone[1:]
        
    # Basic formatting for US/international
    if len(phone) == 11 and phone.startswith("1"):
        # US: +1 (234) 567-8900
        return f"+1 ({phone[1:4]}) {phone[4:7]}-{phone[7:]}"
    else:
        # International: +XX XXX XXX XXXX
        return f"+{phone}"


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to maximum length
    
    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated
        
    Returns:
        Truncated text
    """
    if not text or len(text) <= max_length:
        return text
        
    return text[:max_length - len(suffix)] + suffix

