# 🚀 Clara ↔ TrendtialCRM Integration - Quick Start

> **Ready to use!** Clara Backend is now fully integrated with TrendtialCRM.

---

## ✅ What's Integrated

- **Users Management** - Clara AI agent user for all operations
- **Call Tracking** - Every voice conversation tracked in `calls` table
- **Lead Management** - Full lead creation with BANT qualification
- **Activity Logging** - All AI interactions logged automatically
- **Follow-ups** - Auto-created based on conversation timeline
- **Meetings** - API ready for scheduling demos

---

## 🏁 Quick Start

### **1. Verify Integration**

```bash
cd clara-backend
python -m scripts.verify_crm_integration
```

Expected output:
```
✅ Supabase Connection
✅ Required Tables
✅ Clara AI Agent
✅ API Initialization
✅ Lead Creation Flow
✅ Call Tracking

🎉 All checks passed! Integration is ready!
```

### **2. Environment Variables**

Ensure these are set in `.env`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here

# LLM (for sales agent)
GROQ_API_KEY=your-groq-key-here
# OR
OPENAI_API_KEY=your-openai-key-here
```

### **3. Run Clara Backend**

```bash
# Start the server
python main.py

# Or with uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### **4. Test Voice Integration**

#### **Option A: API Test**

```bash
curl -X POST http://localhost:8001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I am looking for a CRM solution for my startup",
    "input_channel": "voice",
    "session_id": "test-session-123"
  }'
```

#### **Option B: Voice Test (if enabled)**

```bash
curl -X POST http://localhost:8001/api/voice/continuous
```

Then speak naturally to Clara.

---

## 📊 Verify in TrendtialCRM Dashboard

1. Open TrendtialCRM web interface
2. Navigate to **Leads** page
3. You should see:
   - ✅ New lead created from voice
   - ✅ Agent: "Clara AI Voice Assistant"
   - ✅ Status bucket (P1/P2/P3) assigned
   - ✅ Lead score visible
   - ✅ BANT information captured

4. Click on the lead to see:
   - ✅ Full activity timeline
   - ✅ Call records with transcripts
   - ✅ AI-generated notes

---

## 🔧 Common Issues & Solutions

### **Issue 1: "Clara AI Agent not found"**

**Solution:**
```sql
-- Manually create Clara AI agent in Supabase SQL Editor
INSERT INTO public.users (email, full_name, role)
VALUES ('clara@trendtialcrm.ai', 'Clara AI Voice Assistant', 'agent');
```

### **Issue 2: "Table 'calls' does not exist"**

**Solution:**
```bash
# Run the schema migration
# In Supabase SQL Editor, execute:
# clara-backend/supabase_schema_trendtial_compatible.sql
```

Or use the TrendtialCRM schema which already has all tables.

### **Issue 3: Foreign Key Violations**

**Solution:**
- Ensure TrendtialCRM database schema is applied first
- Verify all tables exist: `users`, `clients`, `leads`, `calls`, `lead_activities`
- Check that Clara AI agent user exists

---

## 📖 API Usage Examples

### **Create a Lead (Programmatically)**

```python
from crm_integration import LeadsAPI, UsersAPI

users_api = UsersAPI()
leads_api = LeadsAPI()

# Get Clara AI agent
clara = users_api.get_default_agent()

# Create lead
lead = leads_api.create_lead(
    lead_data={
        "company_name": "Acme Corp",
        "contact_person": "John Doe",
        "email": "john@acme.com",
        "phone": "+1234567890",
        "industry": "Technology",
        "status_bucket": "P2",
        "qualification_status": "marketing_qualified",
        "lead_score": 65,
        "lead_source": "voice_assistant",
        # BANT fields
        "budget": "medium",
        "authority": "yes",
        "need": "high",
        "timeline": "this_quarter",
    },
    agent_id=clara["id"]
)

print(f"Lead created: {lead['id']}")
```

### **Track a Call**

```python
from crm_integration import CallsAPI
from datetime import datetime

calls_api = CallsAPI()

# Start call
call = calls_api.create_call(
    lead_id="lead-uuid-here",
    user_id="clara-agent-uuid",
    session_id="voice-session-123",
    call_type="ai_voice"
)

# ... conversation happens ...

# End call
calls_api.end_call(
    call_id=call["id"],
    duration=180,  # 3 minutes
    outcome="qualified",
    transcript="Full conversation transcript here...",
    intent_detected="sales_qualified",
    confidence_score=0.85
)
```

### **Create Follow-up**

```python
from crm_integration import FollowUpsAPI
from datetime import datetime, timedelta

follow_ups_api = FollowUpsAPI()

# Auto-suggest based on conversation
follow_up = follow_ups_api.suggest_follow_up_from_conversation(
    lead_id="lead-uuid",
    agent_id="clara-agent-uuid",
    conversation_context="Discussed pricing, interested in enterprise plan",
    bant_timeline="immediate"
)

print(f"Follow-up scheduled for: {follow_up['due_date']}")
```

---

## 🎯 Integration Features

### **✅ Automatic Features**

These happen automatically when Clara processes a voice conversation:

1. **Lead Creation**
   - Company info extracted
   - Contact details captured
   - BANT assessment done
   - Lead score calculated
   - Status bucket assigned (P1/P2/P3)

2. **Call Tracking**
   - Call start time logged
   - Session ID tracked
   - Transcript saved
   - Duration calculated
   - Outcome recorded

3. **Activity Logging**
   - Every interaction logged
   - Timeline created automatically
   - Agent attribution correct
   - Metadata enriched

### **⏳ Manual Features**

These require explicit API calls (can be automated in future):

1. **Follow-ups**
   - Use `FollowUpsAPI.suggest_follow_up_from_conversation()`
   - Or create manually with custom due dates

2. **Meetings**
   - Use `MeetingsAPI.suggest_demo_meeting()`
   - Or schedule manually with specific times

3. **Pipeline Movement**
   - Automatic stage assignment based on score
   - Manual stage changes via TrendtialCRM UI

---

## 📚 Documentation

- **Integration Plan**: `CLARA_TRENDTIALCRM_INTEGRATION_PLAN.md`
- **Implementation Summary**: `CLARA_INTEGRATION_PHASE1_COMPLETE.md`
- **TrendtialCRM Schema**: `trendtialcrm/SUPABASE_DATABASE_SCHEMA.md`
- **API Documentation**: See docstrings in `crm_integration/` files

---

## 🛠️ Development Workflow

### **Adding New Features**

1. **Create API** in `crm_integration/` folder
2. **Update `__init__.py`** to export new API
3. **Integrate in CRM Connector** (`agents/sales_agent/crm_connector.py`)
4. **Update Sales Agent** if needed (`agents/sales_agent/agent.py`)
5. **Test** with verification script
6. **Document** in README

### **Debugging**

```bash
# Check logs
tail -f logs/clara-backend.log

# Filter for specific components
tail -f logs/clara-backend.log | grep "sales_agent"
tail -f logs/clara-backend.log | grep "leads_api"
tail -f logs/clara-backend.log | grep "calls_api"

# Check Supabase connection
tail -f logs/clara-backend.log | grep "supabase"
```

### **Testing Checklist**

- [ ] Run `verify_crm_integration.py` - all checks pass
- [ ] Create test lead via voice - appears in TrendtialCRM
- [ ] Check call tracking - call record in database
- [ ] Verify activities - timeline complete
- [ ] Test follow-up creation - follow-up appears
- [ ] Check BANT data - all fields populated

---

## ✅ Success Criteria

Your integration is working correctly when:

- ✅ Voice conversations create leads in TrendtialCRM
- ✅ All leads show "Clara AI Voice Assistant" as agent
- ✅ Call records have complete transcripts
- ✅ BANT assessment is captured
- ✅ Lead scores are calculated correctly
- ✅ Activity timeline is complete
- ✅ No foreign key errors
- ✅ TrendtialCRM dashboard shows all data

---

## 🎉 You're Ready!

Start Clara Backend and begin converting voice conversations to qualified leads!

```bash
python main.py
```

Then open TrendtialCRM and watch the leads flow in! 🚀

---

**Questions?** Check the full integration plan or review the API documentation in each module.

