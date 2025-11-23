"""
CRM Connector - Connect Sales Agent to Supabase CRM
"""

from typing import Dict, Any, Optional
from crm_integration.leads_api import LeadsAPI
from utils.logger import get_logger
from utils.validators import validate_email, validate_phone

logger = get_logger("sales_crm_connector")


class SalesCRMConnector:
    """Handle CRM operations for sales agent"""
    
    def __init__(self):
        """Initialize CRM connector"""
        self.leads_api = LeadsAPI()
        logger.info("Sales CRM connector initialized")
    
    def create_or_update_lead(
        self,
        lead_info: Dict[str, Any],
        qualification_result: Dict[str, Any],
        score_breakdown: Dict[str, Any],
        agent_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create new lead or update existing one
        
        Args:
            lead_info: Lead information
            qualification_result: Qualification assessment
            score_breakdown: Score breakdown
            agent_id: ID of agent handling the lead
            
        Returns:
            Created/updated lead or None if failed
        """
        try:
            # Check if lead already exists
            existing_lead = None
            
            email = lead_info.get("email")
            phone = lead_info.get("phone")
            
            if email:
                existing_lead = self.leads_api.find_lead_by_email(email)
            
            if not existing_lead and phone:
                existing_lead = self.leads_api.find_lead_by_phone(phone)
            
            # Prepare lead data
            lead_data = self._prepare_lead_data(
                lead_info,
                qualification_result,
                score_breakdown
            )
            
            if existing_lead:
                # Update existing lead
                lead_id = existing_lead["id"]
                logger.info(f"Updating existing lead: {lead_id}")
                
                updated_lead = self.leads_api.update_lead(lead_id, lead_data)
                
                if updated_lead:
                    # Log activity
                    self.leads_api.add_activity(
                        lead_id=lead_id,
                        activity_type="note",
                        description="Lead information updated through AI assistant",
                        metadata={"source": "voice_assistant"}
                    )
                
                return updated_lead
            else:
                # Create new lead
                logger.info("Creating new lead")
                
                # Add agent_id if provided
                if agent_id:
                    lead_data["agent_id"] = agent_id
                
                created_lead = self.leads_api.create_lead(lead_data, agent_id)
                
                if created_lead:
                    # Log initial activity
                    self.leads_api.add_activity(
                        lead_id=created_lead["id"],
                        activity_type="note",
                        description="Lead created through AI assistant conversation",
                        metadata={"source": "voice_assistant", "initial_contact": True}
                    )
                
                return created_lead
                
        except Exception as e:
            logger.error(f"Error creating/updating lead: {e}")
            return None
    
    def _prepare_lead_data(
        self,
        lead_info: Dict[str, Any],
        qualification_result: Dict[str, Any],
        score_breakdown: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Prepare lead data for CRM"""
        extracted_info = qualification_result.get("extracted_info", {})
        bant = qualification_result.get("bant_assessment", {})
        
        # Merge lead_info and extracted_info
        merged_info = {**lead_info, **extracted_info}
        
        # Build comprehensive lead data
        lead_data = {
            # Basic info
            "company_name": merged_info.get("company_name"),
            "contact_person": merged_info.get("contact_person"),
            "email": merged_info.get("email"),
            "phone": merged_info.get("phone"),
            
            # Company details
            "industry": merged_info.get("industry"),
            "company_size": self._parse_company_size(merged_info.get("company_size")),
            "location": merged_info.get("location"),
            
            # Lead classification
            "lead_source": "voice_assistant",
            "qualification_status": qualification_result.get("qualification_status", "unqualified"),
            "lead_score": score_breakdown.get("total_score", 0),
            
            # Stage assignment based on score
            "status_bucket": self._determine_stage(
                score_breakdown.get("total_score", 0),
                qualification_result.get("qualification_status")
            ),
            
            # Business details
            "deal_value": merged_info.get("deal_value"),
            "expected_close_date": self._estimate_close_date(bant.get("timeline")),
            "win_probability": self._estimate_win_probability(
                score_breakdown.get("total_score", 0)
            ),
            
            # Notes and next steps
            "notes": self._build_notes(merged_info, bant),
            "next_step": qualification_result.get("next_best_action", "Continue qualification"),
            
            # Additional fields
            "tags": self._generate_tags(merged_info, bant, qualification_result),
        }
        
        # Remove None values
        return {k: v for k, v in lead_data.items() if v is not None}
    
    def _determine_stage(self, lead_score: int, qualification_status: str) -> str:
        """Determine lead stage (P1/P2/P3) based on score and qualification"""
        if qualification_status == "opportunity" or lead_score >= 70:
            return "P1"
        elif qualification_status == "sales_qualified" or lead_score >= 50:
            return "P2"
        else:
            return "P3"
    
    def _parse_company_size(self, company_size_str: Optional[str]) -> Optional[int]:
        """Parse company size string to integer"""
        if not company_size_str:
            return None
        
        size_str = str(company_size_str).lower()
        
        # Try to extract numbers
        import re
        numbers = re.findall(r'\d+', size_str)
        
        if numbers:
            return int(numbers[0])
        
        # Map common size descriptions
        size_map = {
            "startup": 10,
            "small": 25,
            "medium": 100,
            "large": 500,
            "enterprise": 1000,
        }
        
        for key, value in size_map.items():
            if key in size_str:
                return value
        
        return None
    
    def _estimate_close_date(self, timeline: Optional[str]) -> Optional[str]:
        """Estimate close date based on timeline"""
        from datetime import datetime, timedelta
        
        if not timeline or timeline == "unknown":
            return None
        
        today = datetime.utcnow()
        
        timeline_map = {
            "immediate": timedelta(days=7),
            "this_quarter": timedelta(days=90),
            "future": timedelta(days=180),
            "no_timeline": timedelta(days=365),
        }
        
        delta = timeline_map.get(timeline, timedelta(days=90))
        close_date = today + delta
        
        return close_date.isoformat()
    
    def _estimate_win_probability(self, lead_score: int) -> int:
        """Estimate win probability percentage based on lead score"""
        # Simple linear mapping: score 0-100 -> probability 0-100%
        # You can make this more sophisticated based on historical data
        if lead_score >= 80:
            return 75
        elif lead_score >= 60:
            return 50
        elif lead_score >= 40:
            return 25
        elif lead_score >= 20:
            return 10
        else:
            return 5
    
    def _build_notes(self, lead_info: Dict[str, Any], bant: Dict[str, Any]) -> str:
        """Build notes field from lead info and BANT"""
        notes = []
        
        # Add pain points
        pain_points = lead_info.get("pain_points", [])
        if pain_points:
            notes.append(f"Pain Points: {', '.join(pain_points)}")
        
        # Add requirements
        requirements = lead_info.get("requirements", [])
        if requirements:
            notes.append(f"Requirements: {', '.join(requirements)}")
        
        # Add BANT summary
        bant_summary = []
        for key, value in bant.items():
            if value != "unknown":
                bant_summary.append(f"{key.capitalize()}: {value}")
        
        if bant_summary:
            notes.append(f"BANT: {', '.join(bant_summary)}")
        
        return " | ".join(notes) if notes else "Initial contact via voice assistant"
    
    def _generate_tags(
        self,
        lead_info: Dict[str, Any],
        bant: Dict[str, Any],
        qualification_result: Dict[str, Any]
    ) -> list:
        """Generate tags for lead"""
        tags = ["voice_lead", "ai_qualified"]
        
        # Add qualification status tag
        qual_status = qualification_result.get("qualification_status")
        if qual_status:
            tags.append(qual_status)
        
        # Add urgency tag
        if bant.get("need") == "urgent":
            tags.append("urgent")
        
        if bant.get("timeline") == "immediate":
            tags.append("hot_lead")
        
        # Add industry tag
        if lead_info.get("industry"):
            tags.append(lead_info["industry"].lower().replace(" ", "_"))
        
        return tags
    
    def log_conversation_summary(
        self,
        lead_id: str,
        conversation_summary: str,
        key_points: list
    ) -> bool:
        """
        Log conversation summary as activity
        
        Args:
            lead_id: Lead ID
            conversation_summary: Summary of conversation
            key_points: List of key points discussed
            
        Returns:
            True if successful, False otherwise
        """
        try:
            activity = self.leads_api.add_activity(
                lead_id=lead_id,
                activity_type="call",
                description=conversation_summary,
                metadata={
                    "key_points": key_points,
                    "source": "voice_assistant",
                    "automated": True
                }
            )
            
            return activity is not None
            
        except Exception as e:
            logger.error(f"Error logging conversation summary: {e}")
            return False
    
    def schedule_follow_up(
        self,
        lead_id: str,
        follow_up_info: Dict[str, Any]
    ) -> bool:
        """
        Schedule a follow-up for the lead
        
        Args:
            lead_id: Lead ID
            follow_up_info: Follow-up information
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Update lead with follow-up date
            follow_up_date = follow_up_info.get("follow_up_date")
            notes = follow_up_info.get("notes", "")
            
            if follow_up_date:
                updated = self.leads_api.update_lead(
                    lead_id,
                    {
                        "follow_up_due_date": follow_up_date,
                        "next_step": f"Follow up: {notes}"
                    }
                )
                
                if updated:
                    # Log activity
                    self.leads_api.add_activity(
                        lead_id=lead_id,
                        activity_type="task",
                        description=f"Follow-up scheduled for {follow_up_date}",
                        metadata={"notes": notes, "automated": True}
                    )
                    
                return updated is not None
            
            return False
            
        except Exception as e:
            logger.error(f"Error scheduling follow-up: {e}")
            return False

