"""
Meetings API - Manage meetings
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from .supabase_client import get_supabase_client
from utils.logger import get_logger

logger = get_logger("meetings_api")


class MeetingsAPI:
    """API for managing meetings in Supabase CRM"""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    def create_meeting(
        self,
        agent_id: str,
        title: str,
        start_time: datetime,
        end_time: datetime,
        lead_id: Optional[str] = None,
        location: Optional[str] = None,
        notes: Optional[str] = None,
        scheduled_by_ai: bool = True,
        meeting_type: str = "demo",
        created_by: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a meeting
        
        Args:
            agent_id: Agent ID (meeting organizer)
            title: Meeting title
            start_time: Start time
            end_time: End time
            lead_id: Optional lead ID
            location: Location or meeting link
            notes: Meeting notes
            scheduled_by_ai: Whether AI scheduled this
            meeting_type: Type of meeting (demo, discovery, closing, follow-up)
            created_by: User ID who created the meeting
            
        Returns:
            Created meeting or None if failed
        """
        try:
            meeting_data = {
                "agent_id": agent_id,
                "lead_id": lead_id,
                "title": title,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "status": "Scheduled",
                "location": location,
                "notes": notes,
                "scheduled_by_ai": scheduled_by_ai,
                "meeting_type": meeting_type,
                "created_by": created_by or agent_id,
            }
            
            # Remove None values
            meeting_data = {k: v for k, v in meeting_data.items() if v is not None}
            
            result = self.client.table("meetings").insert(meeting_data).execute()
            
            if result.data:
                logger.info(f"Created meeting: {result.data[0]['id']}")
                return result.data[0]
            else:
                logger.error("Failed to create meeting")
                return None
                
        except Exception as e:
            logger.error(f"Error creating meeting: {e}")
            return None
    
    def update_meeting(
        self,
        meeting_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update meeting
        
        Args:
            meeting_id: Meeting ID
            updates: Dictionary of fields to update
            
        Returns:
            Updated meeting or None if failed
        """
        try:
            # Add updated timestamp
            updates["updated_at"] = datetime.utcnow().isoformat()
            
            result = self.client.table("meetings").update(updates).eq("id", meeting_id).execute()
            
            if result.data:
                logger.info(f"Updated meeting: {meeting_id}")
                return result.data[0]
            else:
                logger.warning(f"Failed to update meeting: {meeting_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error updating meeting {meeting_id}: {e}")
            return None
    
    def complete_meeting(
        self,
        meeting_id: str,
        notes: Optional[str] = None
    ) -> bool:
        """
        Mark meeting as completed
        
        Args:
            meeting_id: Meeting ID
            notes: Optional completion notes
            
        Returns:
            True if successful, False otherwise
        """
        try:
            updates = {
                "status": "Completed",
            }
            
            if notes:
                # Append to existing notes
                meeting = self.get_meeting(meeting_id)
                if meeting and meeting.get("notes"):
                    updates["notes"] = f"{meeting['notes']}\n\nCompleted: {notes}"
                else:
                    updates["notes"] = notes
            
            result = self.update_meeting(meeting_id, updates)
            return result is not None
            
        except Exception as e:
            logger.error(f"Error completing meeting {meeting_id}: {e}")
            return False
    
    def cancel_meeting(
        self,
        meeting_id: str,
        reason: Optional[str] = None
    ) -> bool:
        """
        Cancel a meeting
        
        Args:
            meeting_id: Meeting ID
            reason: Cancellation reason
            
        Returns:
            True if successful, False otherwise
        """
        try:
            updates = {
                "status": "Cancelled",
            }
            
            if reason:
                meeting = self.get_meeting(meeting_id)
                if meeting and meeting.get("notes"):
                    updates["notes"] = f"{meeting['notes']}\n\nCancelled: {reason}"
                else:
                    updates["notes"] = f"Cancelled: {reason}"
            
            result = self.update_meeting(meeting_id, updates)
            return result is not None
            
        except Exception as e:
            logger.error(f"Error cancelling meeting {meeting_id}: {e}")
            return False
    
    def get_meeting(self, meeting_id: str) -> Optional[Dict[str, Any]]:
        """
        Get meeting by ID
        
        Args:
            meeting_id: Meeting ID
            
        Returns:
            Meeting data or None if not found
        """
        try:
            result = self.client.table("meetings").select("*").eq("id", meeting_id).execute()
            
            if result.data:
                return result.data[0]
            else:
                logger.warning(f"Meeting not found: {meeting_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting meeting {meeting_id}: {e}")
            return None
    
    def list_meetings_for_lead(
        self,
        lead_id: str,
        status: Optional[str] = None,
        limit: int = 50
    ) -> list:
        """
        List all meetings for a lead
        
        Args:
            lead_id: Lead ID
            status: Optional status filter (Scheduled, Completed, Pending, Cancelled)
            limit: Maximum number to return
            
        Returns:
            List of meetings
        """
        try:
            query = self.client.table("meetings").select("*").eq("lead_id", lead_id)
            
            if status:
                query = query.eq("status", status)
            
            result = query.order("start_time", desc=False).limit(limit).execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} meetings for lead {lead_id}")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error listing meetings for lead {lead_id}: {e}")
            return []
    
    def list_meetings_for_agent(
        self,
        agent_id: str,
        status: Optional[str] = None,
        upcoming_only: bool = False,
        limit: int = 50
    ) -> list:
        """
        List all meetings for an agent
        
        Args:
            agent_id: Agent ID
            status: Optional status filter
            upcoming_only: If True, only return future meetings
            limit: Maximum number to return
            
        Returns:
            List of meetings
        """
        try:
            query = self.client.table("meetings").select("*, leads(*)").eq("agent_id", agent_id)
            
            if status:
                query = query.eq("status", status)
            
            if upcoming_only:
                now = datetime.utcnow().isoformat()
                query = query.gte("start_time", now)
            
            result = query.order("start_time", desc=False).limit(limit).execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} meetings for agent {agent_id}")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error listing meetings for agent {agent_id}: {e}")
            return []
    
    def get_upcoming_meetings(
        self,
        agent_id: Optional[str] = None,
        hours_ahead: int = 24
    ) -> list:
        """
        Get all upcoming meetings within specified hours
        
        Args:
            agent_id: Optional agent ID to filter by
            hours_ahead: Number of hours to look ahead
            
        Returns:
            List of upcoming meetings
        """
        try:
            now = datetime.utcnow()
            future = now + timedelta(hours=hours_ahead)
            
            query = self.client.table("meetings").select("*, leads(*)").eq("status", "Scheduled")
            
            if agent_id:
                query = query.eq("agent_id", agent_id)
            
            result = query.gte("start_time", now.isoformat()).lte(
                "start_time", future.isoformat()
            ).order("start_time", desc=False).execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} upcoming meetings")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting upcoming meetings: {e}")
            return []
    
    def reschedule_meeting(
        self,
        meeting_id: str,
        new_start_time: datetime,
        new_end_time: datetime,
        reason: Optional[str] = None
    ) -> bool:
        """
        Reschedule a meeting
        
        Args:
            meeting_id: Meeting ID
            new_start_time: New start time
            new_end_time: New end time
            reason: Reason for rescheduling
            
        Returns:
            True if successful, False otherwise
        """
        try:
            updates = {
                "start_time": new_start_time.isoformat(),
                "end_time": new_end_time.isoformat(),
            }
            
            if reason:
                meeting = self.get_meeting(meeting_id)
                if meeting and meeting.get("notes"):
                    updates["notes"] = f"{meeting['notes']}\n\nRescheduled: {reason}"
                else:
                    updates["notes"] = f"Rescheduled: {reason}"
            
            result = self.update_meeting(meeting_id, updates)
            return result is not None
            
        except Exception as e:
            logger.error(f"Error rescheduling meeting {meeting_id}: {e}")
            return False
    
    def suggest_demo_meeting(
        self,
        lead_id: str,
        agent_id: str,
        preferred_days_ahead: int = 3,
        duration_minutes: int = 30,
        created_by: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        AI suggests a demo meeting for a qualified lead
        
        Args:
            lead_id: Lead ID
            agent_id: Agent ID
            preferred_days_ahead: Days ahead to schedule (default: 3)
            duration_minutes: Meeting duration in minutes (default: 30)
            created_by: User ID who created the meeting
            
        Returns:
            Created meeting or None
        """
        try:
            # Suggest meeting time (3 days ahead at 2 PM)
            start_time = datetime.utcnow() + timedelta(days=preferred_days_ahead)
            start_time = start_time.replace(hour=14, minute=0, second=0, microsecond=0)
            end_time = start_time + timedelta(minutes=duration_minutes)
            
            return self.create_meeting(
                agent_id=agent_id,
                lead_id=lead_id,
                title="Product Demo - AI Suggested",
                start_time=start_time,
                end_time=end_time,
                location="Virtual Meeting (link to be added)",
                notes="AI-suggested demo meeting for qualified lead",
                scheduled_by_ai=True,
                meeting_type="demo",
                created_by=created_by or agent_id
            )
            
        except Exception as e:
            logger.error(f"Error suggesting demo meeting: {e}")
            return None

