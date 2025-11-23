"""
Leads API - CRM operations for lead management
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from .supabase_client import get_supabase_client
from utils.logger import get_logger
from utils.formatters import format_lead_data
from utils.validators import validate_email, validate_phone

logger = get_logger("leads_api")


class LeadsAPI:
    """API for managing leads in Supabase CRM"""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    def create_lead(
        self,
        lead_data: Dict[str, Any],
        agent_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new lead in the CRM
        
        Args:
            lead_data: Lead information dictionary
            agent_id: ID of the agent creating the lead
            
        Returns:
            Created lead data or None if failed
        """
        try:
            # First, create or get client
            client_data = {
                "client_name": lead_data.get("company_name") or lead_data.get("client_name"),
                "company": lead_data.get("company_name"),
                "industry": lead_data.get("industry"),
                "location": lead_data.get("location"),
                "phone": lead_data.get("phone"),
                "email": lead_data.get("email"),
                "company_size": lead_data.get("company_size"),
                "expected_value": lead_data.get("deal_value"),
            }
            
            # Check if client exists by email or company name
            existing_client = None
            if client_data.get("email"):
                result = self.client.table("clients").select("*").eq(
                    "email", client_data["email"]
                ).execute()
                if result.data:
                    existing_client = result.data[0]
            
            if not existing_client and client_data.get("client_name"):
                result = self.client.table("clients").select("*").eq(
                    "client_name", client_data["client_name"]
                ).execute()
                if result.data:
                    existing_client = result.data[0]
            
            # Create or use existing client
            if existing_client:
                client_id = existing_client["id"]
                logger.info(f"Using existing client: {client_id}")
            else:
                # Create new client
                client_result = self.client.table("clients").insert(
                    {k: v for k, v in client_data.items() if v is not None}
                ).execute()
                
                if not client_result.data:
                    logger.error("Failed to create client")
                    return None
                    
                client_id = client_result.data[0]["id"]
                logger.info(f"Created new client: {client_id}")
            
            # Now create the lead
            lead_insert_data = {
                "client_id": client_id,
                "agent_id": agent_id,
                "status_bucket": lead_data.get("status_bucket", "P3"),
                "progress_details": lead_data.get("progress_details"),
                "next_step": lead_data.get("next_step", "Initial qualification"),
                "lead_source": lead_data.get("lead_source", "voice_assistant"),
                "contact_person": lead_data.get("contact_person"),
                "email": lead_data.get("email"),
                "phone": lead_data.get("phone"),
                "deal_value": lead_data.get("deal_value"),
                "tags": lead_data.get("tags", []),
                "notes": lead_data.get("notes"),
                "industry": lead_data.get("industry"),
                "lead_score": lead_data.get("lead_score", 0),
                "qualification_status": lead_data.get("qualification_status", "unqualified"),
                "expected_close_date": lead_data.get("expected_close_date"),
                "win_probability": lead_data.get("win_probability", 0),
                "first_touch_date": datetime.utcnow().isoformat(),
                "last_touch_date": datetime.utcnow().isoformat(),
                "sync_lock": False,
            }
            
            # Remove None values
            lead_insert_data = {k: v for k, v in lead_insert_data.items() if v is not None}
            
            # Insert lead
            lead_result = self.client.table("leads").insert(lead_insert_data).execute()
            
            if lead_result.data:
                created_lead = lead_result.data[0]
                logger.info(f"Created new lead: {created_lead['id']}")
                return created_lead
            else:
                logger.error("Failed to create lead")
                return None
                
        except Exception as e:
            logger.error(f"Error creating lead: {e}")
            return None
    
    def update_lead(
        self,
        lead_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update an existing lead
        
        Args:
            lead_id: Lead ID to update
            updates: Dictionary of fields to update
            
        Returns:
            Updated lead data or None if failed
        """
        try:
            # Add updated timestamp
            updates["updated_at"] = datetime.utcnow().isoformat()
            updates["last_touch_date"] = datetime.utcnow().isoformat()
            
            # Update lead
            result = self.client.table("leads").update(updates).eq("id", lead_id).execute()
            
            if result.data:
                logger.info(f"Updated lead: {lead_id}")
                return result.data[0]
            else:
                logger.error(f"Failed to update lead: {lead_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error updating lead {lead_id}: {e}")
            return None
    
    def get_lead(self, lead_id: str) -> Optional[Dict[str, Any]]:
        """
        Get lead by ID
        
        Args:
            lead_id: Lead ID
            
        Returns:
            Lead data or None if not found
        """
        try:
            result = self.client.table("leads").select(
                "*, clients(*), users(full_name)"
            ).eq("id", lead_id).execute()
            
            if result.data:
                return result.data[0]
            else:
                logger.warning(f"Lead not found: {lead_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting lead {lead_id}: {e}")
            return None
    
    def find_lead_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Find lead by email address
        
        Args:
            email: Email address
            
        Returns:
            Lead data or None if not found
        """
        try:
            result = self.client.table("leads").select(
                "*, clients(*), users(full_name)"
            ).eq("email", email).order("created_at", desc=True).limit(1).execute()
            
            if result.data:
                return result.data[0]
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error finding lead by email {email}: {e}")
            return None
    
    def find_lead_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        """
        Find lead by phone number
        
        Args:
            phone: Phone number
            
        Returns:
            Lead data or None if not found
        """
        try:
            result = self.client.table("leads").select(
                "*, clients(*), users(full_name)"
            ).eq("phone", phone).order("created_at", desc=True).limit(1).execute()
            
            if result.data:
                return result.data[0]
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error finding lead by phone {phone}: {e}")
            return None
    
    def add_activity(
        self,
        lead_id: str,
        activity_type: str,
        description: str,
        created_by: str = "system",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Add activity to lead timeline
        
        Args:
            lead_id: Lead ID
            activity_type: Type of activity (call, email, note, etc.)
            description: Activity description
            created_by: User/agent who created the activity
            metadata: Additional metadata
            
        Returns:
            Created activity or None if failed
        """
        try:
            activity_data = {
                "lead_id": lead_id,
                "activity_type": activity_type,
                "description": description,
                "activity_date": datetime.utcnow().isoformat(),
                "created_by": created_by,
                "metadata": metadata or {},
                "is_automated": True,
            }
            
            result = self.client.table("lead_activities").insert(activity_data).execute()
            
            if result.data:
                logger.info(f"Added activity to lead {lead_id}: {activity_type}")
                return result.data[0]
            else:
                logger.error(f"Failed to add activity to lead {lead_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error adding activity to lead {lead_id}: {e}")
            return None
    
    def move_to_stage(
        self,
        lead_id: str,
        stage: str,
        notes: Optional[str] = None
    ) -> bool:
        """
        Move lead to different stage (P1/P2/P3)
        
        Args:
            lead_id: Lead ID
            stage: Target stage (P1, P2, P3)
            notes: Optional notes about the move
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if stage not in ["P1", "P2", "P3"]:
                logger.error(f"Invalid stage: {stage}")
                return False
            
            updates = {
                "status_bucket": stage,
                "updated_at": datetime.utcnow().isoformat(),
            }
            
            if notes:
                updates["progress_details"] = notes
            
            result = self.client.table("leads").update(updates).eq("id", lead_id).execute()
            
            if result.data:
                # Log activity
                self.add_activity(
                    lead_id,
                    "status_change",
                    f"Lead moved to stage {stage}" + (f": {notes}" if notes else ""),
                    metadata={"new_stage": stage}
                )
                logger.info(f"Moved lead {lead_id} to stage {stage}")
                return True
            else:
                return False
                
        except Exception as e:
            logger.error(f"Error moving lead {lead_id} to stage {stage}: {e}")
            return False
    
    def update_lead_score(self, lead_id: str, score: int) -> bool:
        """
        Update lead score
        
        Args:
            lead_id: Lead ID
            score: New score (0-100)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Clamp score between 0-100
            score = max(0, min(100, score))
            
            result = self.client.table("leads").update({
                "lead_score": score,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("id", lead_id).execute()
            
            if result.data:
                logger.info(f"Updated lead score for {lead_id}: {score}")
                return True
            else:
                return False
                
        except Exception as e:
            logger.error(f"Error updating lead score for {lead_id}: {e}")
            return False

