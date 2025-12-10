"""
Calls API - Track voice call interactions
"""

from typing import Dict, Any, Optional
from datetime import datetime
from .supabase_client import get_supabase_client
from utils.logger import get_logger

logger = get_logger("calls_api")


class CallsAPI:
    """API for managing call records in Supabase CRM"""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    def create_call(
        self,
        lead_id: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        call_type: str = "ai_outbound",  # Default to AI outbound for AI calls
        call_start_time: Optional[datetime] = None,
        notes: Optional[str] = None,
        is_ai_call: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new call record
        
        Args:
            lead_id: Associated lead ID
            user_id: User ID (Clara AI agent ID for AI calls)
            session_id: AI conversation session ID
            call_type: Type of call (inbound, outbound, callback, voicemail, ai_outbound, ai_inbound)
            call_start_time: When call started (defaults to now)
            notes: Optional call notes
            is_ai_call: Whether this is an AI-initiated call
            
        Returns:
            Created call record or None if failed
        """
        try:
            call_data = {
                "lead_id": lead_id,
                "user_id": user_id,
                "call_type": call_type if is_ai_call else (call_type or "outbound"),
                "outcome": "in_progress",  # Will be updated when call ends
                "call_start_time": (call_start_time or datetime.utcnow()).isoformat(),
                "notes": notes,
                "ai_session_id": session_id,  # Now stored in dedicated column
            }
            
            # Remove None values
            call_data = {k: v for k, v in call_data.items() if v is not None}
            
            result = self.client.table("calls").insert(call_data).execute()
            
            if result.data:
                logger.info(f"Created call record: {result.data[0]['id']}")
                return result.data[0]
            else:
                logger.error("Failed to create call record")
                return None
                
        except Exception as e:
            logger.error(f"Error creating call: {e}")
            return None
    
    def update_call(
        self,
        call_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update call record
        
        Args:
            call_id: Call ID
            updates: Dictionary of fields to update
            
        Returns:
            Updated call record or None if failed
        """
        try:
            # Add updated timestamp
            updates["updated_at"] = datetime.utcnow().isoformat()
            
            result = self.client.table("calls").update(updates).eq("id", call_id).execute()
            
            if result.data:
                logger.info(f"Updated call: {call_id}")
                return result.data[0]
            else:
                logger.warning(f"Failed to update call: {call_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error updating call {call_id}: {e}")
            return None
    
    def end_call(
        self,
        call_id: str,
        duration: int,
        outcome: str,
        transcript: Optional[str] = None,
        lead_score: Optional[int] = None,
        qualification_status: Optional[str] = None,
        bant_assessment: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None
    ) -> bool:
        """
        Mark call as ended with final details
        
        Args:
            call_id: Call ID
            duration: Duration in seconds
            outcome: Call outcome (completed, no_answer, busy, failed, voicemail, qualified, not_interested, follow_up_scheduled)
            transcript: Full conversation transcript
            lead_score: Lead score after the call
            qualification_status: Lead qualification status after the call
            bant_assessment: BANT assessment dictionary
            notes: Additional call notes
            
        Returns:
            True if successful, False otherwise
        """
        try:
            updates = {
                "duration": duration,
                "outcome": outcome,
            }
            
            # Add AI call specific fields
            if transcript:
                updates["transcript"] = transcript
            if lead_score is not None:
                updates["lead_score_after"] = lead_score
            if qualification_status:
                updates["qualification_status"] = qualification_status
            if bant_assessment:
                updates["bant_assessment"] = bant_assessment
            if notes:
                # Append to existing notes if any
                existing_call = self.get_call(call_id)
                if existing_call and existing_call.get("notes"):
                    updates["notes"] = f"{existing_call['notes']}\n\n{notes}"
                else:
                    updates["notes"] = notes
            
            result = self.update_call(call_id, updates)
            
            if result:
                logger.info(f"Ended call: {call_id} (duration: {duration}s, outcome: {outcome}, score: {lead_score})")
                return True
            else:
                return False
            
        except Exception as e:
            logger.error(f"Error ending call {call_id}: {e}")
            return False
    
    def get_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        """
        Get call by ID
        
        Args:
            call_id: Call ID
            
        Returns:
            Call data or None if not found
        """
        try:
            result = self.client.table("calls").select("*").eq("id", call_id).execute()
            
            if result.data:
                return result.data[0]
            else:
                logger.warning(f"Call not found: {call_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting call {call_id}: {e}")
            return None
    
    def get_call_by_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get call by AI session ID
        
        Args:
            session_id: AI Session ID
            
        Returns:
            Call data or None if not found
        """
        try:
            # First try the new dedicated ai_session_id column
            result = self.client.table("calls").select("*").eq(
                "ai_session_id", session_id
            ).order("created_at", desc=True).limit(1).execute()
            
            if result.data:
                return result.data[0]
            
            # Fallback: search in notes for legacy calls
            result = self.client.table("calls").select("*").like(
                "notes", f"%[Session: {session_id}]%"
            ).order("created_at", desc=True).limit(1).execute()
            
            if result.data:
                return result.data[0]
            else:
                logger.debug(f"No call found for session: {session_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting call by session {session_id}: {e}")
            return None
    
    def list_calls_for_lead(
        self,
        lead_id: str,
        limit: int = 50
    ) -> list:
        """
        List all calls for a lead
        
        Args:
            lead_id: Lead ID
            limit: Maximum number of calls to return
            
        Returns:
            List of call records
        """
        try:
            result = self.client.table("calls").select("*").eq(
                "lead_id", lead_id
            ).order("call_start_time", desc=True).limit(limit).execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} calls for lead {lead_id}")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error listing calls for lead {lead_id}: {e}")
            return []
    
    def list_calls_by_user(
        self,
        user_id: str,
        limit: int = 50
    ) -> list:
        """
        List all calls by a user
        
        Args:
            user_id: User ID
            limit: Maximum number of calls to return
            
        Returns:
            List of call records
        """
        try:
            result = self.client.table("calls").select("*").eq(
                "user_id", user_id
            ).order("call_start_time", desc=True).limit(limit).execute()
            
            logger.debug(f"Found {len(result.data) if result.data else 0} calls for user {user_id}")
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error listing calls for user {user_id}: {e}")
            return []
    
    def get_call_statistics(self, lead_id: Optional[str] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get call statistics for a lead or user
        
        Args:
            lead_id: Optional lead ID to filter by
            user_id: Optional user ID to filter by
            
        Returns:
            Statistics dictionary
        """
        try:
            query = self.client.table("calls").select("*")
            
            if lead_id:
                query = query.eq("lead_id", lead_id)
            if user_id:
                query = query.eq("user_id", user_id)
            
            result = query.execute()
            calls = result.data or []
            
            # Calculate statistics
            total_calls = len(calls)
            total_duration = sum(call.get("duration", 0) for call in calls if call.get("duration"))
            avg_duration = total_duration / total_calls if total_calls > 0 else 0
            
            # Count by outcome
            outcomes = {}
            for call in calls:
                outcome = call.get("outcome", "unknown")
                outcomes[outcome] = outcomes.get(outcome, 0) + 1
            
            # Calculate success rate (completed calls)
            completed_calls = outcomes.get("completed", 0) + outcomes.get("qualified", 0)
            success_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0
            
            stats = {
                "total_calls": total_calls,
                "total_duration_seconds": total_duration,
                "average_duration_seconds": round(avg_duration, 2),
                "outcomes": outcomes,
                "success_rate": round(success_rate, 2),
            }
            
            logger.debug(f"Call statistics: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error getting call statistics: {e}")
            return {
                "total_calls": 0,
                "total_duration_seconds": 0,
                "average_duration_seconds": 0,
                "outcomes": {},
                "success_rate": 0,
                "error": str(e)
            }
    
    def add_call_note(self, call_id: str, note: str) -> bool:
        """
        Add a note to an existing call
        
        Args:
            call_id: Call ID
            note: Note to add
            
        Returns:
            True if successful, False otherwise
        """
        try:
            call = self.get_call(call_id)
            if not call:
                logger.error(f"Cannot add note to non-existent call: {call_id}")
                return False
            
            # Append note
            existing_notes = call.get("notes", "")
            new_notes = f"{existing_notes}\n\n{note}" if existing_notes else note
            
            result = self.update_call(call_id, {"notes": new_notes})
            return result is not None
            
        except Exception as e:
            logger.error(f"Error adding note to call {call_id}: {e}")
            return False
    
    def list_ai_calls(self, limit: int = 50) -> list:
        """
        List all AI calls with lead information for Sales Hub
        
        Args:
            limit: Maximum number of calls to return
            
        Returns:
            List of AI call records with lead info
        """
        try:
            # Get AI calls (ai_outbound, ai_inbound) with lead info
            result = self.client.table("calls").select(
                "*, leads(id, contact_person, email, lead_score, qualification_status, clients(client_name))"
            ).in_(
                "call_type", ["ai_outbound", "ai_inbound", "outbound"]  # Include outbound for backward compatibility
            ).order("call_start_time", desc=True).limit(limit).execute()
            
            calls = result.data or []
            
            # Transform to match frontend expected format
            formatted_calls = []
            for call in calls:
                lead_data = call.get("leads", {}) or {}
                client_data = lead_data.get("clients", {}) or {}
                
                formatted_calls.append({
                    "id": call["id"],
                    "lead_id": call.get("lead_id"),
                    "duration": call.get("duration", 0) or 0,
                    "call_type": call.get("call_type"),
                    "outcome": call.get("outcome"),
                    "notes": call.get("notes"),
                    "call_start_time": call.get("call_start_time"),
                    "created_at": call.get("created_at"),
                    "transcript": call.get("transcript"),
                    "lead_score_after": call.get("lead_score_after"),
                    "qualification_status": call.get("qualification_status"),
                    "bant_assessment": call.get("bant_assessment"),
                    "ai_session_id": call.get("ai_session_id"),
                    "lead": {
                        "contact_person": lead_data.get("contact_person"),
                        "company_name": client_data.get("client_name"),
                        "email": lead_data.get("email"),
                        "lead_score": lead_data.get("lead_score"),
                    } if lead_data else None
                })
            
            logger.debug(f"Found {len(formatted_calls)} AI calls")
            return formatted_calls
            
        except Exception as e:
            logger.error(f"Error listing AI calls: {e}")
            return []
    
    def get_ai_call_statistics(self) -> Dict[str, Any]:
        """
        Get AI call statistics for Sales Hub dashboard
        
        Returns:
            Statistics dictionary
        """
        try:
            # Get AI calls
            result = self.client.table("calls").select("*").in_(
                "call_type", ["ai_outbound", "ai_inbound", "outbound"]
            ).execute()
            
            calls = result.data or []
            
            # Calculate statistics
            total_calls = len(calls)
            total_duration = sum(call.get("duration", 0) or 0 for call in calls)
            avg_duration = total_duration / total_calls if total_calls > 0 else 0
            
            # Count by outcome
            outcomes = {}
            for call in calls:
                outcome = call.get("outcome", "unknown")
                outcomes[outcome] = outcomes.get(outcome, 0) + 1
            
            # Calculate qualification rate
            qualified_outcomes = ["qualified", "completed"]
            qualified_calls = sum(outcomes.get(o, 0) for o in qualified_outcomes)
            qualification_rate = (qualified_calls / total_calls * 100) if total_calls > 0 else 0
            
            # Calculate success rate (calls that completed)
            completed_outcomes = ["completed", "qualified", "follow_up_scheduled"]
            completed_calls = sum(outcomes.get(o, 0) for o in completed_outcomes)
            success_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0
            
            # Calls by day (last 7 days)
            from datetime import timedelta
            calls_by_day = []
            today = datetime.utcnow().date()
            for i in range(6, -1, -1):
                day = today - timedelta(days=i)
                day_count = sum(
                    1 for call in calls 
                    if call.get("call_start_time") and 
                    datetime.fromisoformat(call["call_start_time"].replace("Z", "+00:00")).date() == day
                )
                calls_by_day.append({
                    "date": day.isoformat(),
                    "count": day_count
                })
            
            stats = {
                "totalCalls": total_calls,
                "totalDurationSeconds": total_duration,
                "averageDurationSeconds": round(avg_duration),
                "successRate": round(success_rate),
                "qualificationRate": round(qualification_rate),
                "outcomes": outcomes,
                "callsByDay": calls_by_day,
                "qualificationBreakdown": {
                    "unqualified": outcomes.get("not_interested", 0) + outcomes.get("no_answer", 0),
                    "marketing_qualified": outcomes.get("completed", 0),
                    "sales_qualified": outcomes.get("qualified", 0),
                    "opportunity": outcomes.get("follow_up_scheduled", 0),
                }
            }
            
            logger.debug(f"AI call statistics: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error getting AI call statistics: {e}")
            return {
                "totalCalls": 0,
                "totalDurationSeconds": 0,
                "averageDurationSeconds": 0,
                "successRate": 0,
                "qualificationRate": 0,
                "outcomes": {},
                "callsByDay": [],
                "qualificationBreakdown": {},
                "error": str(e)
            }

