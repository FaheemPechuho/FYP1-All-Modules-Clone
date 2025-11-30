# 🚀 Quick Test Guide - Clara Voice AI

**5-Minute Quick Start for Testing Voice AI + CRM Integration**

---

## ⚡ Super Quick Test (30 seconds)

```python
from agents.sales_agent import SalesAgent

agent = SalesAgent()
response = agent.process(
    user_input="Hi, I'm Sarah from TechCorp. We need a CRM for 30 people. Budget is $40k. Need it in 2 months.",
    session_id="quick-test-001"
)
print(response)
```

**Then check Supabase Dashboard** → Leads table → You should see TechCorp!

---

## 🎯 3 Essential Test Scenarios

### 1️⃣ Hot Lead (High Quality)
```
"Hi, I'm the VP of Sales at MegaCorp. We have 100 reps and $150k budget. 
Need CRM within 3 weeks. Currently using Salesforce but it's too expensive. 
Can we schedule a demo tomorrow?"
```
**Expected**: Lead score 90+, Demo scheduled, Status: Sales Qualified

---

### 2️⃣ Qualified Lead (Medium Quality)  
```
"Hello, I'm Jennifer from GrowthTech. We're a team of 25 using Excel. 
Budget around $50k annually. Want to implement next quarter. 
What features do you offer?"
```
**Expected**: Lead score 70-80, Follow-up scheduled, Status: Qualified

---

### 3️⃣ Research Phase (Low Quality)
```
"Hi, I'm just exploring options for my 5-person startup. 
No budget yet, maybe later this year. 
What's your cheapest option?"
```
**Expected**: Lead score 20-30, Nurture campaign, Status: Unqualified

---

## 🔍 Verify Results

### Check Lead Created:
```python
from crm_integration import LeadsAPI
leads_api = LeadsAPI()
leads = leads_api.list_leads(limit=5)
print(f"Latest leads: {[(l['contact_person'], l['lead_score']) for l in leads]}")
```

### Check Call Tracked:
```python
from crm_integration import CallsAPI
calls_api = CallsAPI()
calls = calls_api.list_calls_for_lead(lead_id="your-lead-id")
print(f"Calls: {len(calls)} tracked")
```

### Check Activities:
```sql
-- Run in Supabase SQL Editor
SELECT * FROM lead_activities 
WHERE created_by = '1ea495af-ca21-48bd-b0e1-5ececa05546f'
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📊 Full Integration Test

**Run comprehensive test suite:**
```bash
cd clara-backend
python scripts/test_voice_crm_integration.py
```

**This tests 10 features in ~2 minutes:**
1. ✅ Lead creation
2. ✅ Call tracking  
3. ✅ BANT qualification
4. ✅ Follow-up scheduling
5. ✅ Meeting scheduling
6. ✅ Activity logging
7. ✅ Lead updates
8. ✅ Pipeline management
9. ✅ Conversation handling
10. ✅ Data retrieval

---

## 🎙️ Multi-Turn Conversation Test

```python
from agents.sales_agent import SalesAgent

agent = SalesAgent()
session_id = "conversation-001"

# Simulate realistic conversation
conversation = [
    "Hi, I'm interested in CRM",
    "I'm David from Innovate Labs",
    "We have 40 sales people",
    "Budget is $60,000 per year",
    "Need it within 3 weeks",
    "Yes, let's schedule a demo"
]

for user_input in conversation:
    response = agent.process(user_input, session_id)
    print(f"\n👤 You: {user_input}")
    print(f"🤖 Clara: {response[:200]}...")
```

---

## ✅ Success Checklist

After running tests, verify:

- [ ] Lead created in `leads` table
- [ ] Client created in `clients` table  
- [ ] Call tracked in `calls` table
- [ ] Activities logged in `lead_activities` table
- [ ] BANT fields populated (budget, authority, need, timeline)
- [ ] Lead score calculated (0-100)
- [ ] Qualification status set
- [ ] Follow-ups or meetings scheduled (if appropriate)
- [ ] Clara AI agent ID assigned to records
- [ ] Conversation summary generated

---

## 🔧 Quick Troubleshooting

**Issue**: Lead not created
- Check: `.env` has correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Check: Clara AI agent exists (`1ea495af-ca21-48bd-b0e1-5ececa05546f`)
- Run: `python scripts/verify_crm_integration.py`

**Issue**: Call not tracked
- Check: `calls` table exists in database
- Check: `CallsAPI` initialized correctly
- Verify: Lead ID exists before tracking call

**Issue**: Low lead scores
- This is normal for low-quality leads
- Check BANT assessment logic in code
- Verify qualification status matches score

---

## 📝 View Test Data

**Supabase Dashboard:**
- Leads: https://app.supabase.com/project/jtdrwkwsbufwhzahfesu/editor?table=leads
- Calls: https://app.supabase.com/project/jtdrwkwsbufwhzahfesu/editor?table=calls
- Activities: https://app.supabase.com/project/jtdrwkwsbufwhzahfesu/editor?table=lead_activities

**Via Python:**
```python
from crm_integration.supabase_client import get_supabase_client
supabase = get_supabase_client()

# View all test leads
leads = supabase.table("leads").select("*").order("created_at", desc=True).limit(5).execute()
for lead in leads.data:
    print(f"{lead['contact_person']}: Score {lead['lead_score']}, Status {lead['qualification_status']}")
```

---

## 🎯 Next Steps

1. ✅ Test with simple scenarios (above)
2. ✅ Try complex scenarios from `VOICE_AGENT_TEST_SCRIPTS.md`
3. ✅ Review created data in Supabase Dashboard
4. ✅ Integrate with actual voice platform
5. ✅ Start processing real calls!

---

## 📚 Full Documentation

- **Detailed Scripts**: See `VOICE_AGENT_TEST_SCRIPTS.md`
- **Integration Guide**: See `CLARA_INTEGRATION_QUICKSTART.md`
- **Database Schema**: See `DATABASE_CLONE_GUIDE.md`

---

**🎉 Ready to test Clara Voice AI!**

Start with the Super Quick Test above, then explore more scenarios! ⬆️

