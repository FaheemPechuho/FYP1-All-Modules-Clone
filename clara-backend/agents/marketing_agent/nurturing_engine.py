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