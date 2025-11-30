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
        call_type: str = "outbound",  # Changed from "ai_voice" to match schema constraint
        call_start_time: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new call record
        
        Args:
            lead_id: Associated lead ID
            user_id: User ID (None for AI-only calls)
            session_id: Conversation session ID (stored in notes, not as column)
            call_type: Type of call (inbound, outbound, callback, voicemail) - must match schema
            call_start_time: When call started (defaults to now)
            notes: Optional call notes (can include session_id)
            
        Returns:
            Created call record or None if failed
        """
        try:
            # Note: session_id is not a column in calls table, so we store it in notes if needed
            notes_with_session = notes or ""
            if session_id:
                notes_with_session = f"[Session: {session_id}]\n{notes_with_session}".strip()
            
            call_data = {
                "lead_id": lead_id,
                "user_id": user_id,
                "call_type": call_type,  # Must be: inbound, outbound, callback, or voicemail
                "outcome": "completed",  # Will be updated when call ends
                "call_start_time": (call_start_time or datetime.utcnow()).isoformat(),
                "notes": notes_with_session if notes_with_session else None,
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
        sentiment_score: Optional[float] = None,
        intent_detected: Optional[str] = None,
        confidence_score: Optional[float] = None,
        notes: Optional[str] = None
    ) -> bool:
        """
        Mark call as ended with final details
        
        Args:
            call_id: Call ID
            duration: Duration in seconds
            outcome: Call outcome (completed, no_answer, busy, failed, voicemail, qualified, not_interested)
            transcript: Full conversation transcript
            sentiment_score: Sentiment analysis score (-1.0 to 1.0)
            intent_detected: Detected intent from conversation
            confidence_score: Confidence score (0.0 to 1.0)
            notes: Additional call notes
            
        Returns:
            True if successful, False otherwise
        """
        try:
            updates = {
                "duration": duration,
                "outcome": outcome,
                "call_end_time": datetime.utcnow().isoformat(),
            }
            
            # Add optional fields
            if transcript:
                updates["transcript"] = transcript
            if sentiment_score is not None:
                updates["sentiment_score"] = round(sentiment_score, 2)
            if intent_detected:
                updates["intent_detected"] = intent_detected
            if confidence_score is not None:
                updates["confidence_score"] = round(confidence_score, 2)
            if notes:
                # Append to existing notes if any
                existing_call = self.get_call(call_id)
                if existing_call and existing_call.get("notes"):
                    updates["notes"] = f"{existing_call['notes']}\n\n{notes}"
                else:
                    updates["notes"] = notes
            
            result = self.update_call(call_id, updates)
            
            if result:
                logger.info(f"Ended call: {call_id} (duration: {duration}s, outcome: {outcome})")
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
        Get call by session ID (searches in notes since session_id is not a column)
        
        Args:
            session_id: Session ID
            
        Returns:
            Call data or None if not found
        """
        try:
            # Since session_id is not a column, search in notes
            # This is less efficient but works with current schema
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

