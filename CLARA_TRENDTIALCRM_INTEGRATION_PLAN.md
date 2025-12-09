# 🔗 Clara Backend ↔ TrendtialCRM Integration Plan

> **Created**: November 28, 2025  
> **Purpose**: Complete integration plan to align Clara AI Voice Agent with TrendtialCRM database  
> **Execution Strategy**: Iterative implementation with testing at each phase

---

## 📊 Executive Summary

### Current Status Analysis

**Clara Backend** (AI Voice Agent):
- ✅ Multi-agent architecture (Sales, Support, Marketing)
- ✅ Voice-to-text pipeline with interruption handling
- ✅ BANT qualification system
- ✅ Lead scoring engine
- ✅ Basic CRM integration started
- ⚠️ Schema misalignment with TrendtialCRM
- ❌ Missing critical tables (calls, users integration)
- ❌ Not using TrendtialCRM's complete schema

**TrendtialCRM** (Web Dashboard):
- ✅ Complete RBAC system (users table with roles)
- ✅ Comprehensive lead management (24 tables)
- ✅ Call tracking table structure
- ✅ Pipeline stages & nurturing sequences
- ✅ Follow-ups, meetings, todos
- ✅ Notification system
- ✅ Daily reports & attendance tracking

### Integration Gaps

| Component | Clara Status | TrendtialCRM Status | Gap Severity |
|-----------|--------------|---------------------|--------------|
| **Users Table** | ❌ Not integrated | ✅ Full RBAC | 🔴 CRITICAL |
| **Calls Table** | ❌ Missing | ✅ Exists | 🔴 CRITICAL |
| **Leads Schema** | 🟡 Partial | ✅ Complete | 🟡 MEDIUM |
| **Activities** | ✅ Basic | ✅ Complete | 🟢 LOW |
| **Follow-ups** | ❌ Not using | ✅ Full system | 🟡 MEDIUM |
| **Meetings** | ❌ Not using | ✅ Full system | 🟡 MEDIUM |
| **Pipeline Stages** | ❌ Not using | ✅ Exists | 🟢 LOW |

---

## 🎯 Integration Goals

### Phase 1 (Week 1) - Critical Foundation
1. ✅ Align database schema between systems
2. ✅ Integrate users table for RBAC
3. ✅ Implement call tracking for voice interactions
4. ✅ Update leads table to match TrendtialCRM completely
5. ✅ Fix field name mismatches

### Phase 2 (Week 2) - Enhanced Features
1. ✅ Integrate follow-ups creation from AI conversations
2. ✅ Integrate meetings scheduling from AI
3. ✅ Connect to pipeline stages
4. ✅ Implement activity logging improvements

### Phase 3 (Week 3) - Advanced Integration
1. ✅ Real-time notifications for lead updates
2. ✅ Dashboard integration testing
3. ✅ Performance optimization
4. ✅ Complete end-to-end testing

---

## 📋 Detailed Implementation Plan

---

## **PHASE 1: Critical Foundation** 🔴

### **Iteration 1.1: Schema Analysis & Database Updates**

#### **Objective**: Ensure Clara uses TrendtialCRM's exact schema

#### **Tasks**:

**1.1.1 Update Supabase Schema**
- **File**: `clara-backend/supabase_schema_trendtial_compatible.sql`
- **Status**: ✅ Already well-structured
- **Action**: Apply missing tables to production Supabase

**Missing Tables to Add**:
```sql
-- These tables exist in TrendtialCRM but not being used by Clara:

1. admin_audit (audit logging)
2. attendance (user attendance)
3. daily_reports (agent performance)
4. notifications (notification system)
5. notification_preferences (user preferences)
6. todos (task management)
7. todo_comments (task comments)
8. todo_attachments (task files)
9. lead_activities (already partially implemented)
10. lead_scoring_criteria (scoring rules)
11. lead_nurture_enrollments (automation tracking)
12. nurture_sequences (automation sequences)
13. nurture_steps (sequence steps)
```

**Migration Script Needed**:
```sql
-- File: clara-backend/migrations/001_align_with_trendtialcrm.sql
-- This will add missing fields to existing tables and create new tables
```

**1.1.2 Field Mapping Document**
Create mapping between Clara's current fields and TrendtialCRM fields:

| Clara Field | TrendtialCRM Field | Action Required |
|-------------|-------------------|-----------------|
| `clients.name` | `clients.client_name` | ✅ Already fixed in schema |
| `leads.assigned_agent` (VARCHAR) | `leads.agent_id` (UUID FK) | 🔴 Change data type & add FK |
| `leads.name` | `leads.contact_person` | ✅ Use contact_person |
| N/A | `leads.status_bucket` (P1/P2/P3) | ✅ Add column |
| N/A | `leads.pipeline_stage_id` | ✅ Add FK column |
| `clients.company_size` (VARCHAR) | `clients.company_size` (INTEGER) | 🔴 Change data type |

---

### **Iteration 1.2: Users Table Integration**

#### **Objective**: Integrate Clara with TrendtialCRM's user authentication system

#### **Current Problem**:
- Clara doesn't authenticate users
- No concept of "which agent is using Clara"
- `assigned_agent` is a string, not a UUID FK

#### **Solution**:

**1.2.1 Add User Context to Clara**

**File**: `clara-backend/config.py`
```python
# Add these settings:
class Settings:
    # ... existing ...
    
    # User Context (for CRM integration)
    DEFAULT_AGENT_ID: Optional[str] = os.getenv("DEFAULT_AGENT_ID")  # UUID of Clara AI agent
    AGENT_AUTHENTICATION_REQUIRED: bool = os.getenv("AGENT_AUTH_REQUIRED", "false").lower() == "true"
```

**1.2.2 Create Users API**

**New File**: `clara-backend/crm_integration/users_api.py`
```python
"""
Users API - Manage user lookups and agent assignments
"""

from typing import Dict, Any, Optional, List
from .supabase_client import get_supabase_client
from utils.logger import get_logger

logger = get_logger("users_api")

class UsersAPI:
    """API for managing users in Supabase CRM"""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            result = self.client.table("users").select("*").eq("id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting user {user_id}: {e}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            result = self.client.table("users").select("*").eq("email", email).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting user by email {email}: {e}")
            return None
    
    def get_default_agent(self) -> Optional[Dict[str, Any]]:
        """
        Get the Clara AI agent user
        Creates one if it doesn't exist
        """
        try:
            # Try to find Clara AI agent
            result = self.client.table("users").select("*").eq(
                "email", "clara@trendtialcrm.ai"
            ).execute()
            
            if result.data:
                return result.data[0]
            
            # Create Clara AI agent user
            logger.info("Creating Clara AI agent user...")
            create_result = self.client.table("users").insert({
                "email": "clara@trendtialcrm.ai",
                "full_name": "Clara AI Agent",
                "role": "agent",
                "is_active": True,
            }).execute()
            
            if create_result.data:
                logger.info("Clara AI agent created successfully")
                return create_result.data[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting/creating default agent: {e}")
            return None
    
    def list_agents(self) -> List[Dict[str, Any]]:
        """List all active agents"""
        try:
            result = self.client.table("users").select("*").eq(
                "role", "agent"
            ).eq("is_active", True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error listing agents: {e}")
            return []
```

**1.2.3 Update CRM Connector to Use User IDs**

**File**: `clara-backend/agents/sales_agent/crm_connector.py`

Add at the top:
```python
from crm_integration.users_api import UsersAPI
```

Update `__init__`:
```python
def __init__(self):
    """Initialize CRM connector"""
    self.leads_api = LeadsAPI()
    self.users_api = UsersAPI()
    
    # Get or create Clara AI agent user
    self.clara_agent = self.users_api.get_default_agent()
    if self.clara_agent:
        self.default_agent_id = self.clara_agent["id"]
        logger.info(f"Using Clara AI agent ID: {self.default_agent_id}")
    else:
        self.default_agent_id = None
        logger.warning("Could not initialize Clara AI agent user")
    
    logger.info("Sales CRM connector initialized")
```

Update `create_or_update_lead` method to always use agent_id:
```python
def create_or_update_lead(
    self,
    lead_info: Dict[str, Any],
    qualification_result: Dict[str, Any],
    score_breakdown: Dict[str, Any],
    agent_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Create new lead or update existing one
    """
    # Use provided agent_id or default to Clara AI agent
    effective_agent_id = agent_id or self.default_agent_id
    
    if not effective_agent_id:
        logger.error("No agent ID available for lead creation")
        return None
    
    # ... rest of the method, passing effective_agent_id
```

---

### **Iteration 1.3: Call Tracking Integration**

#### **Objective**: Log every voice conversation as a call record

#### **Current Problem**:
- Voice conversations happen but aren't logged in `calls` table
- No duration, transcript, or outcome tracking
- No link between voice sessions and CRM records

#### **Solution**:

**1.3.1 Create Calls API**

**New File**: `clara-backend/crm_integration/calls_api.py`
```python
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
        call_type: str = "ai_voice",
        call_start_time: Optional[datetime] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Create a new call record
        
        Args:
            lead_id: Associated lead ID
            user_id: User ID (None for AI-only calls)
            session_id: Conversation session ID
            call_type: Type of call (default: ai_voice)
            call_start_time: When call started
            
        Returns:
            Created call record or None
        """
        try:
            call_data = {
                "lead_id": lead_id,
                "user_id": user_id,
                "session_id": session_id,
                "call_type": call_type,
                "outcome": "completed",  # Will be updated later
                "call_start_time": (call_start_time or datetime.utcnow()).isoformat(),
            }
            
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
        """Update call record"""
        try:
            result = self.client.table("calls").update(updates).eq("id", call_id).execute()
            
            if result.data:
                logger.info(f"Updated call: {call_id}")
                return result.data[0]
            else:
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
        notes: Optional[str] = None
    ) -> bool:
        """
        Mark call as ended with final details
        
        Args:
            call_id: Call ID
            duration: Duration in seconds
            outcome: Call outcome
            transcript: Full conversation transcript
            sentiment_score: Sentiment analysis score
            notes: Call notes
            
        Returns:
            True if successful
        """
        try:
            updates = {
                "duration": duration,
                "outcome": outcome,
                "call_end_time": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            
            if transcript:
                updates["transcript"] = transcript
            if sentiment_score is not None:
                updates["sentiment_score"] = sentiment_score
            if notes:
                updates["notes"] = notes
            
            result = self.update_call(call_id, updates)
            return result is not None
            
        except Exception as e:
            logger.error(f"Error ending call {call_id}: {e}")
            return False
    
    def get_call_by_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get call by session ID"""
        try:
            result = self.client.table("calls").select("*").eq(
                "session_id", session_id
            ).execute()
            
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error getting call by session {session_id}: {e}")
            return None
```

**1.3.2 Integrate Call Tracking in Sales Agent**

**File**: `clara-backend/agents/sales_agent/crm_connector.py`

Add import:
```python
from crm_integration.calls_api import CallsAPI
```

Update `__init__`:
```python
def __init__(self):
    """Initialize CRM connector"""
    self.leads_api = LeadsAPI()
    self.users_api = UsersAPI()
    self.calls_api = CallsAPI()  # ADD THIS
    
    # ... rest of init
```

Add new method:
```python
def start_call_tracking(
    self,
    lead_id: str,
    session_id: str,
    agent_id: Optional[str] = None
) -> Optional[str]:
    """
    Start tracking a voice call
    
    Args:
        lead_id: Lead ID
        session_id: Conversation session ID
        agent_id: Agent user ID
        
    Returns:
        Call ID or None
    """
    try:
        call = self.calls_api.create_call(
            lead_id=lead_id,
            user_id=agent_id or self.default_agent_id,
            session_id=session_id,
            call_type="ai_voice",
            call_start_time=datetime.utcnow()
        )
        
        if call:
            return call["id"]
        return None
        
    except Exception as e:
        logger.error(f"Error starting call tracking: {e}")
        return None

def end_call_tracking(
    self,
    call_id: str,
    duration: int,
    outcome: str,
    conversation_history: list,
    sentiment_score: Optional[float] = None
) -> bool:
    """
    End call tracking with final details
    
    Args:
        call_id: Call ID
        duration: Call duration in seconds
        outcome: Call outcome
        conversation_history: Full conversation
        sentiment_score: Sentiment score
        
    Returns:
        True if successful
    """
    try:
        # Build transcript from conversation history
        transcript = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}"
            for msg in conversation_history
            if msg['role'] in ['user', 'assistant']
        ])
        
        # Build notes
        notes = f"AI Voice Assistant Call - Outcome: {outcome}"
        
        return self.calls_api.end_call(
            call_id=call_id,
            duration=duration,
            outcome=outcome,
            transcript=transcript,
            sentiment_score=sentiment_score,
            notes=notes
        )
        
    except Exception as e:
        logger.error(f"Error ending call tracking: {e}")
        return False
```

**1.3.3 Update Sales Agent to Track Calls**

**File**: `clara-backend/agents/sales_agent/agent.py`

Add to class initialization:
```python
def __init__(self):
    """Initialize Sales Agent"""
    super().__init__("sales")
    
    # ... existing init ...
    
    # Track active call IDs per session
    self.active_calls: Dict[str, str] = {}  # session_id -> call_id
    
    logger.info("Sales Agent fully initialized and ready")
```

Update `process` method to track calls:
```python
def process(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process incoming message and generate response"""
    try:
        session_id = self.extract_session_id(message_data)
        user_message = message_data.get("raw_message", "")
        
        # ... existing qualification and scoring logic ...
        
        # Step 4: Update CRM if lead is qualified enough
        crm_lead = None
        crm_updated = False
        call_id = None
        
        if self._should_update_crm(qualification_result, score_breakdown):
            crm_lead = self.crm_connector.create_or_update_lead(
                lead_info=self.lead_data[session_id],
                qualification_result=qualification_result,
                score_breakdown=score_breakdown
            )
            crm_updated = crm_lead is not None
            
            if crm_updated:
                logger.info(f"CRM updated successfully for session {session_id}")
                
                # Start call tracking if not already started
                if session_id not in self.active_calls:
                    call_id = self.crm_connector.start_call_tracking(
                        lead_id=crm_lead["id"],
                        session_id=session_id
                    )
                    if call_id:
                        self.active_calls[session_id] = call_id
                        logger.info(f"Started call tracking: {call_id}")
        
        # ... rest of response building ...
        
        response["metadata"]["call_id"] = self.active_calls.get(session_id)
        
        return response
        
    except Exception as e:
        logger.error(f"Error in Sales Agent processing: {e}")
        # ... error handling ...
```

Add method to end call:
```python
def end_call_session(self, session_id: str, outcome: str = "completed"):
    """
    End call tracking for a session
    
    Args:
        session_id: Session ID
        outcome: Call outcome
    """
    try:
        if session_id in self.active_calls:
            call_id = self.active_calls[session_id]
            conversation_history = self.get_conversation_history(session_id)
            
            # Calculate duration (rough estimate from conversation length)
            duration = len(conversation_history) * 30  # ~30 seconds per exchange
            
            # End call tracking
            success = self.crm_connector.end_call_tracking(
                call_id=call_id,
                duration=duration,
                outcome=outcome,
                conversation_history=conversation_history
            )
            
            if success:
                logger.info(f"Ended call tracking for session {session_id}")
                del self.active_calls[session_id]
            
    except Exception as e:
        logger.error(f"Error ending call session: {e}")
```

---

### **Iteration 1.4: Complete Leads Schema Alignment**

#### **Objective**: Ensure all TrendtialCRM lead fields are properly mapped

**File**: `clara-backend/crm_integration/leads_api.py`

**Update `create_lead` method** to include ALL TrendtialCRM fields:

```python
def create_lead(
    self,
    lead_data: Dict[str, Any],
    agent_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Create a new lead in the CRM"""
    try:
        # ... existing client creation logic ...
        
        # COMPLETE lead data with ALL TrendtialCRM fields
        lead_insert_data = {
            # Core relationships
            "client_id": client_id,
            "agent_id": agent_id,
            "created_by": agent_id,
            
            # Status & Classification (TrendtialCRM)
            "status_bucket": lead_data.get("status_bucket", "P3"),
            "qualification_status": lead_data.get("qualification_status", "unqualified"),
            "lead_score": lead_data.get("lead_score", 0),
            
            # Contact Info
            "contact_person": lead_data.get("contact_person"),
            "email": lead_data.get("email"),
            "phone": lead_data.get("phone"),
            
            # Business Details
            "deal_value": lead_data.get("deal_value"),
            "industry": lead_data.get("industry"),
            
            # Pipeline (TrendtialCRM)
            "pipeline_stage_id": lead_data.get("pipeline_stage_id"),
            "expected_close_date": lead_data.get("expected_close_date"),
            "win_probability": lead_data.get("win_probability", 0),
            
            # Progress & Next Steps
            "progress_details": lead_data.get("progress_details"),
            "next_step": lead_data.get("next_step", "Initial qualification"),
            "follow_up_due_date": lead_data.get("follow_up_due_date"),
            "notes": lead_data.get("notes"),
            
            # Source Tracking (TrendtialCRM)
            "lead_source": lead_data.get("lead_source", "voice_assistant"),
            "campaign_id": lead_data.get("campaign_id"),
            "utm_source": lead_data.get("utm_source"),
            "utm_medium": lead_data.get("utm_medium"),
            "utm_campaign": lead_data.get("utm_campaign"),
            "referrer_url": lead_data.get("referrer_url"),
            
            # BANT Fields (Clara's strength!)
            "budget": lead_data.get("budget"),
            "authority": lead_data.get("authority"),
            "need": lead_data.get("need"),
            "timeline": lead_data.get("timeline"),
            
            # AI Context (Clara-specific)
            "conversation_summary": lead_data.get("conversation_summary"),
            "extracted_info": lead_data.get("extracted_info"),
            
            # Metadata
            "tags": lead_data.get("tags", ["voice_lead", "ai_qualified"]),
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
            
            # Create initial activity
            self.add_activity(
                lead_id=created_lead['id'],
                activity_type="ai_interaction",
                subject="AI Voice Assistant - Initial Contact",
                description="Lead created through Clara AI voice assistant",
                created_by=agent_id,
                metadata={
                    "source": "voice_assistant",
                    "channel": "voice",
                    "initial_contact": True
                }
            )
            
            return created_lead
        else:
            logger.error("Failed to create lead")
            return None
            
    except Exception as e:
        logger.error(f"Error creating lead: {e}")
        return None
```

---

### **Phase 1 Testing Checklist** ✅

After completing Iteration 1.1-1.4, test the following:

- [ ] Clara can create leads with proper `agent_id` (UUID)
- [ ] Leads appear in TrendtialCRM dashboard
- [ ] Voice calls are logged in `calls` table
- [ ] Call transcripts are stored
- [ ] All lead fields match TrendtialCRM schema
- [ ] `status_bucket` (P1/P2/P3) is correctly set
- [ ] Activities are logged correctly
- [ ] No schema errors or foreign key violations

---

## **PHASE 2: Enhanced Features** 🟡

### **Iteration 2.1: Follow-ups Integration**

#### **Objective**: Allow Clara to create follow-up tasks

**New File**: `clara-backend/crm_integration/follow_ups_api.py`

```python
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
        ai_recommendation: Optional[str] = None
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
            
        Returns:
            Created follow-up or None
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
                "created_by": agent_id,
            }
            
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
    
    def suggest_follow_up_from_conversation(
        self,
        lead_id: str,
        agent_id: str,
        conversation_context: str,
        bant_timeline: str
    ) -> Optional[Dict[str, Any]]:
        """
        AI suggests a follow-up based on conversation
        
        Args:
            lead_id: Lead ID
            agent_id: Agent ID
            conversation_context: Summary of conversation
            bant_timeline: BANT timeline assessment
            
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
            ai_recommendation=ai_recommendation
        )
```

**Update CRM Connector**:

File: `clara-backend/agents/sales_agent/crm_connector.py`

```python
from crm_integration.follow_ups_api import FollowUpsAPI

class SalesCRMConnector:
    def __init__(self):
        # ... existing ...
        self.follow_ups_api = FollowUpsAPI()
    
    def create_auto_follow_up(
        self,
        lead_id: str,
        agent_id: str,
        bant_assessment: Dict[str, Any],
        conversation_summary: str
    ) -> Optional[Dict[str, Any]]:
        """Create automatic follow-up based on conversation"""
        timeline = bant_assessment.get("timeline", "unknown")
        
        return self.follow_ups_api.suggest_follow_up_from_conversation(
            lead_id=lead_id,
            agent_id=agent_id,
            conversation_context=conversation_summary,
            bant_timeline=timeline
        )
```

---

### **Iteration 2.2: Meetings Integration**

**New File**: `clara-backend/crm_integration/meetings_api.py`

```python
"""
Meetings API - Manage meetings
"""

from typing import Dict, Any, Optional
from datetime import datetime
from .supabase_client import get_supabase_client
from utils.logger import get_logger

logger = get_logger("meetings_api")

class MeetingsAPI:
    """API for managing meetings in Supabase CRM"""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    def create_meeting(
        self,
        lead_id: str,
        agent_id: str,
        title: str,
        start_time: datetime,
        end_time: datetime,
        location: Optional[str] = None,
        notes: Optional[str] = None,
        scheduled_by_ai: bool = True,
        meeting_type: str = "demo"
    ) -> Optional[Dict[str, Any]]:
        """
        Create a meeting
        
        Args:
            lead_id: Lead ID
            agent_id: Agent ID
            title: Meeting title
            start_time: Start time
            end_time: End time
            location: Location or meeting link
            notes: Meeting notes
            scheduled_by_ai: Whether AI scheduled this
            meeting_type: Type of meeting
            
        Returns:
            Created meeting or None
        """
        try:
            meeting_data = {
                "lead_id": lead_id,
                "agent_id": agent_id,
                "title": title,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "status": "Scheduled",
                "location": location,
                "notes": notes,
                "scheduled_by_ai": scheduled_by_ai,
                "meeting_type": meeting_type,
                "created_by": agent_id,
            }
            
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
```

---

### **Iteration 2.3: Pipeline Stages Connection**

**Update CRM Connector** to assign leads to pipeline stages:

```python
def _get_pipeline_stage_id(self, qualification_status: str, lead_score: int) -> Optional[str]:
    """
    Get appropriate pipeline stage based on lead status and score
    
    Args:
        qualification_status: Qualification status
        lead_score: Lead score (0-100)
        
    Returns:
        Pipeline stage ID or None
    """
    try:
        # Fetch pipeline stages (cache these for performance)
        stages = self.client.table("pipeline_stages").select("*").order(
            "order_position"
        ).execute()
        
        if not stages.data:
            return None
        
        # Map qualification status to stage
        stage_mapping = {
            "unqualified": "New Lead",
            "marketing_qualified": "Qualified",
            "sales_qualified": "Demo Scheduled",
            "opportunity": "Proposal Sent",
        }
        
        # Also consider score
        if lead_score >= 80:
            target_stage = "Negotiation"
        elif lead_score >= 60:
            target_stage = "Proposal Sent"
        elif qualification_status in stage_mapping:
            target_stage = stage_mapping[qualification_status]
        else:
            target_stage = "New Lead"
        
        # Find matching stage
        for stage in stages.data:
            if stage["name"] == target_stage:
                return stage["id"]
        
        # Default to first stage
        return stages.data[0]["id"]
        
    except Exception as e:
        logger.error(f"Error getting pipeline stage: {e}")
        return None
```

Update `_prepare_lead_data` to include pipeline stage:

```python
def _prepare_lead_data(
    self,
    lead_info: Dict[str, Any],
    qualification_result: Dict[str, Any],
    score_breakdown: Dict[str, Any]
) -> Dict[str, Any]:
    """Prepare lead data for CRM"""
    # ... existing code ...
    
    lead_data = {
        # ... existing fields ...
        
        # Add pipeline stage
        "pipeline_stage_id": self._get_pipeline_stage_id(
            qualification_result.get("qualification_status", "unqualified"),
            score_breakdown.get("total_score", 0)
        ),
        
        # ... rest of fields ...
    }
    
    return {k: v for k, v in lead_data.items() if v is not None}
```

---

### **Phase 2 Testing Checklist** ✅

- [ ] Clara creates follow-ups automatically based on BANT timeline
- [ ] Follow-ups appear in TrendtialCRM dashboard
- [ ] Meetings can be scheduled (if feature is added to voice agent)
- [ ] Leads are assigned to correct pipeline stages
- [ ] Pipeline stages update based on qualification status

---

## **PHASE 3: Advanced Integration & Testing** 🟢

### **Iteration 3.1: Complete Activity Logging**

Ensure ALL interactions are logged as activities:

```python
# In crm_connector.py

def log_ai_interaction(
    self,
    lead_id: str,
    user_message: str,
    ai_response: str,
    intent: Optional[str] = None,
    confidence: Optional[float] = None,
    metadata: Optional[Dict] = None
) -> bool:
    """Log AI interaction as activity"""
    try:
        activity = self.leads_api.add_activity(
            lead_id=lead_id,
            activity_type="ai_interaction",
            subject="AI Voice Assistant Conversation",
            description=f"User: {user_message[:100]}...\nAssistant: {ai_response[:100]}...",
            created_by=self.default_agent_id,
            metadata={
                "user_message": user_message,
                "ai_response": ai_response,
                "intent": intent,
                "confidence": confidence,
                "source": "voice_assistant",
                **(metadata or {})
            }
        )
        return activity is not None
    except Exception as e:
        logger.error(f"Error logging AI interaction: {e}")
        return False
```

---

### **Iteration 3.2: End-to-End Testing**

**Test Scenarios**:

1. **Scenario 1: New Lead Creation**
   - Start voice call
   - Clara qualifies lead using BANT
   - Lead is created in CRM
   - Call is tracked
   - Follow-up is auto-created
   - Verify in TrendtialCRM dashboard

2. **Scenario 2: Existing Lead Update**
   - Call with known email/phone
   - Clara updates qualification info
   - Lead score increases
   - Status bucket changes (P3 → P2)
   - Pipeline stage updates
   - Verify in dashboard

3. **Scenario 3: High-Score Lead**
   - Lead scores 80+
   - Auto-moves to P1
   - Demo meeting is suggested
   - Follow-up in 1 day
   - Verify urgent handling

---

### **Iteration 3.3: Database Migration Execution**

**Migration File**: `clara-backend/migrations/001_align_with_trendtialcrm.sql`

This migration should:
1. Add missing columns to existing tables
2. Create missing tables (if not using schema from scratch)
3. Update existing data types
4. Add proper foreign keys

**Note**: Since TrendtialCRM already has the complete schema, Clara just needs to ensure it's using it correctly.

---

## 📊 Success Metrics

### Technical Metrics
- [ ] 100% schema alignment between Clara and TrendtialCRM
- [ ] All voice calls logged in `calls` table
- [ ] All leads have proper `agent_id` (UUID FK)
- [ ] Zero foreign key violations
- [ ] All activities logged correctly

### Functional Metrics
- [ ] Leads created by Clara appear in TrendtialCRM dashboard immediately
- [ ] Call transcripts are searchable
- [ ] Follow-ups are auto-created based on BANT
- [ ] Lead scoring triggers correct status bucket
- [ ] Pipeline stages update automatically

### Business Metrics
- [ ] Average lead qualification time < 3 minutes
- [ ] Lead score accuracy > 80%
- [ ] Auto-follow-up acceptance rate > 70%
- [ ] No manual data entry required for voice leads

---

## 🔧 Development Tools & Scripts

### **Database Sync Check Script**

**New File**: `clara-backend/scripts/check_schema_alignment.py`

```python
"""
Check schema alignment between Clara and TrendtialCRM
"""

from crm_integration.supabase_client import get_supabase_client
from utils.logger import get_logger

logger = get_logger("schema_check")

def check_schema_alignment():
    """Check if all required tables and columns exist"""
    client = get_supabase_client()
    
    required_tables = [
        "users",
        "clients",
        "leads",
        "calls",
        "activities",
        "follow_ups",
        "meetings",
        "pipeline_stages",
    ]
    
    print("🔍 Checking schema alignment...\n")
    
    for table in required_tables:
        try:
            result = client.table(table).select("*").limit(1).execute()
            print(f"✅ {table}: EXISTS")
        except Exception as e:
            print(f"❌ {table}: MISSING or ERROR - {e}")
    
    print("\n✅ Schema check complete!")

if __name__ == "__main__":
    check_schema_alignment()
```

Run with: `python -m scripts.check_schema_alignment`

---

## 🚀 Deployment Strategy

### **Step 1: Backup Current Database**
```bash
# Export current leads and clients
supabase db dump --file backup_before_migration.sql
```

### **Step 2: Apply Migrations**
```bash
# Apply schema updates
supabase db reset
supabase db push
```

### **Step 3: Verify Integration**
```bash
# Run schema check
python -m scripts.check_schema_alignment

# Test CRM connection
python -m tests.test_crm_integration
```

### **Step 4: Deploy Clara Backend**
```bash
# Update environment variables
# Deploy to production
# Monitor logs for errors
```

---

## 📝 Implementation Priority Summary

### **Week 1 - Phase 1** 🔴
- **Day 1-2**: Schema analysis, users table integration (Iteration 1.1-1.2)
- **Day 3-4**: Call tracking integration (Iteration 1.3)
- **Day 5**: Complete leads alignment & testing (Iteration 1.4)

### **Week 2 - Phase 2** 🟡
- **Day 1-2**: Follow-ups API & integration (Iteration 2.1)
- **Day 3-4**: Meetings API (Iteration 2.2)
- **Day 5**: Pipeline stages connection (Iteration 2.3)

### **Week 3 - Phase 3** 🟢
- **Day 1-2**: Complete activity logging (Iteration 3.1)
- **Day 3-4**: End-to-end testing (Iteration 3.2)
- **Day 5**: Performance optimization & production deployment

---

## 🎯 Next Steps

**Immediate Actions**:
1. ✅ Review this plan
2. ⏳ Choose execution strategy (all-at-once vs iterative)
3. ⏳ Set up development/staging environment
4. ⏳ Start with Iteration 1.1 (Schema Updates)

**Tools Needed**:
- Supabase CLI
- Database migration tools
- Testing framework

---

## 📚 References

- **TrendtialCRM Schema**: `trendtialcrm/SUPABASE_DATABASE_SCHEMA.md`
- **Clara Schema**: `clara-backend/supabase_schema_trendtial_compatible.sql`
- **Alignment Analysis**: `clara-backend/TRENDTIALCRM_ALIGNMENT.md`
- **Supabase Docs**: https://supabase.com/docs

---

**END OF INTEGRATION PLAN**

Ready to start implementation! 🚀

