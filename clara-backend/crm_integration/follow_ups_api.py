"""
Follow-ups API - Manage follow-up tasks
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from .supabase_client import get_supabase_client
from utils.logger import get_logger

logger = get_logger("follow_ups_api")


class FollowUpsAPI:
    """API for managing follow-ups in Supabase CRM"""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    def create_follow_up(
        self,
        lead_id: str,
        agent_id: str,
        due_date: datetime,
        notes: Optional[str] = None,
        suggested_by_ai: bool = True,
        ai_recommendation: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a follow-up task
        
        Args:
            lead_id: Lead ID
            agent_id: Agent assigned to follow-up
            due_date: When follow-up is due
            notes: Follow-up notes
            suggested_by_ai: Whether AI suggested this
            ai_recommendation: AI's recommendation
            created_by: User ID who created the follow-up
            
        Returns:
            Created follow-up or None if failed
        """
        try:
            follow_up_data = {
                "lead_id": lead_id,
                "agent_id": agent_id,
                "due_date": due_date.isoformat(),
                "status": "Pending",
                "notes": notes,
                "suggested_by_ai": suggested_by_ai,
                "ai_recommendation": ai_recommendation,
                "created_by": created_by or agent_id,
            }
            
            # Remove None values
            follow_up_data = {k: v for k, v in follow_up_data.items() if v is not None}
            
            result = self.client.table("follow_ups").insert(follow_up_data).execute()
            
            if result.data:
                logger.info(f"Created follow-up: {result.data[0]['id']}")
                return result.data[0]
            else:
                logger.error("Failed to create follow-up")
                return None
                
        except Exception as e:
            logger.error(f"Error creating follow-up: {e}")
            return None
    
    def update_follow_up(
        self,
        follow_up_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update follow-up
        
        Args:
            follow_up_id: Follow-up ID
            updates: Dictionary of fields to update
            
        Returns:
            Updated follow-up or None if failed
        """
        try:
            # Add updated timestamp
            updates["updated_at"] = datetime.utcnow().isoformat()
            
            result = self.client.table("follow_ups").update(updates).eq("id", follow_up_id).execute()
            
            if result.data:
                logger.info(f"Updated follow-up: {follow_up_id}")
                return result.data[0]
            else:
                logger.warning(f"Failed to update follow-up: {follow_up_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error updating follow-up {follow_up_id}: {e}")
            return None
    
    def complete_follow_up(
        self,
        follow_up_id: str,
        notes: Optional[str] = None
    ) -> bool:
        """
        Mark follow-up as completed
        
        Args:
            follow_up_id: Follow-up ID
            notes: Optional completion notes
            
        Returns:
            True if successful, False otherwise
        """
        try:
            updates = {
                "status": "Completed",
                "completed_at": datetime.utcnow().isoformat(),
            }
            
            if notes:
                # Append to existing notes
                follow_up = self.get_follow_up(follow_up_id)
                if follow_up and follow_up.get("notes"):
                    updates["notes"] = f"{follow_up['notes']}\n\nCompleted: {notes}"
                else:
                    updates["notes"] = notes
            
            result = self.update_follow_up(follow_up_id, updates)
            return result is not None
            
        except Exception as e:
            logger.error(f"Error completing follow-up {follow_up_id}: {e}")
            return False
    
    def get_follow_up(self, follow_up_id: str) -> Optional[Dict[str, Any]]:
        """
        Get follow-up by ID
        
        Args:
            follow_up_id: Follow-up ID
            
        Returns:
            Follow-up data or None if not found
        """
        try:
            result = self.client.table("follow_ups").select("*").eq("id", follow_up_id).execute()
            
            if result.data:
                return result.data[0]
            else:
                logger.warning(f"Follow-up not found: {follow_up_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting follow-up {follow_up_id}: {e}")
            return None
    
    def list_follow_ups_for_lead(
        self,
        lead_id: str,
        status: Optional[str] = None,
        limit: int = 50
    ) -> list:
        """
        List all follow-ups for a lead
        
        Args:
            lead_id: Lead ID
            status: Optional status filter (Pending, Completed, Rescheduled, Cancelled)
            limit: Maximum number to return
            
        Returns:
            List of follow-ups
        """
        try:
            query = self.client.table("follow_ups").select("*").eq("lead_id", lead_id)
            
            if status:
                query = query.eq("status", status)
            
            result = query.order("due_date", desc=False).limit(limit).execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} follow-ups for lead {lead_id}")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error listing follow-ups for lead {lead_id}: {e}")
            return []
    
    def list_follow_ups_for_agent(
        self,
        agent_id: str,
        status: Optional[str] = None,
        due_soon: bool = False,
        limit: int = 50
    ) -> list:
        """
        List all follow-ups for an agent
        
        Args:
            agent_id: Agent ID
            status: Optional status filter
            due_soon: If True, only return follow-ups due within 7 days
            limit: Maximum number to return
            
        Returns:
            List of follow-ups
        """
        try:
            query = self.client.table("follow_ups").select("*, leads(*)").eq("agent_id", agent_id)
            
            if status:
                query = query.eq("status", status)
            
            if due_soon:
                seven_days_from_now = (datetime.utcnow() + timedelta(days=7)).isoformat()
                query = query.lte("due_date", seven_days_from_now)
            
            result = query.order("due_date", desc=False).limit(limit).execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} follow-ups for agent {agent_id}")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error listing follow-ups for agent {agent_id}: {e}")
            return []
    
    def get_overdue_follow_ups(self, agent_id: Optional[str] = None) -> list:
        """
        Get all overdue follow-ups
        
        Args:
            agent_id: Optional agent ID to filter by
            
        Returns:
            List of overdue follow-ups
        """
        try:
            query = self.client.table("follow_ups").select("*, leads(*)").eq("status", "Pending")
            
            if agent_id:
                query = query.eq("agent_id", agent_id)
            
            now = datetime.utcnow().isoformat()
            result = query.lt("due_date", now).order("due_date", desc=False).execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} overdue follow-ups")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting overdue follow-ups: {e}")
            return []
    
    def suggest_follow_up_from_conversation(
        self,
        lead_id: str,
        agent_id: str,
        conversation_context: str,
        bant_timeline: str,
        created_by: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        AI suggests a follow-up based on conversation
        
        Args:
            lead_id: Lead ID
            agent_id: Agent ID
            conversation_context: Summary of conversation
            bant_timeline: BANT timeline assessment
            created_by: User ID who created the follow-up
            
        Returns:
            Created follow-up or None
        """
        # Determine due date based on BANT timeline
        timeline_to_days = {
            "immediate": 1,
            "this_week": 3,
            "this_month": 7,
            "this_quarter": 30,
            "future": 90,
            "unknown": 14,
        }
        
        days = timeline_to_days.get(bant_timeline, 7)
        due_date = datetime.utcnow() + timedelta(days=days)
        
        ai_recommendation = f"Based on timeline '{bant_timeline}', follow up in {days} days"
        notes = f"AI-suggested follow-up based on conversation: {conversation_context[:100]}..."
        
        return self.create_follow_up(
            lead_id=lead_id,
            agent_id=agent_id,
            due_date=due_date,
            notes=notes,
            suggested_by_ai=True,
            ai_recommendation=ai_recommendation,
            created_by=created_by or agent_id
        )
    
    def reschedule_follow_up(
        self,
        follow_up_id: str,
        new_due_date: datetime,
        reason: Optional[str] = None
    ) -> bool:
        """
        Reschedule a follow-up
        
        Args:
            follow_up_id: Follow-up ID
            new_due_date: New due date
            reason: Reason for rescheduling
            
        Returns:
            True if successful, False otherwise
        """
        try:
            updates = {
                "due_date": new_due_date.isoformat(),
                "status": "Rescheduled",
            }
            
            if reason:
                follow_up = self.get_follow_up(follow_up_id)
                if follow_up and follow_up.get("notes"):
                    updates["notes"] = f"{follow_up['notes']}\n\nRescheduled: {reason}"
                else:
                    updates["notes"] = reason
            
            result = self.update_follow_up(follow_up_id, updates)
            
            if result:
                # Also change status back to Pending
                self.update_follow_up(follow_up_id, {"status": "Pending"})
            
            return result is not None
            
        except Exception as e:
            logger.error(f"Error rescheduling follow-up {follow_up_id}: {e}")
            return False

