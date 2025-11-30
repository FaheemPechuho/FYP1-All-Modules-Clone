# 🎙️ Clara Voice AI Agent - Test Conversation Scripts

Complete guide with realistic conversation scenarios to test Clara's voice AI capabilities with CRM integration.

---

## 📋 Table of Contents

1. [Quick Start Conversations](#quick-start-conversations)
2. [Complete Sales Scenarios](#complete-sales-scenarios)
3. [BANT Qualification Scripts](#bant-qualification-scripts)
4. [Objection Handling Scripts](#objection-handling-scripts)
5. [Multi-Turn Complex Scenarios](#multi-turn-complex-scenarios)
6. [Edge Cases & Testing](#edge-cases--testing)

---

## 🚀 Quick Start Conversations

### Scenario 1: Simple Lead Qualification (2-3 minutes)

**Purpose:** Quick qualification, basic information gathering

```
You: Hi, I'm looking for a CRM solution.

Clara: [Responds with greeting and qualification questions]

You: My name is Sarah Johnson from TechStart Inc.

Clara: [Asks about company details]

You: We're a software company with about 30 employees. We need better sales tracking.

Clara: [Asks about budget/timeline]

You: Our budget is around $20,000 per year. We want to implement something in the next month.

Clara: [Confirms and suggests next steps]

You: That sounds good. Can you send me more information?
```

**Expected Clara Actions:**
- ✅ Creates lead for "TechStart Inc"
- ✅ Tracks call with transcript
- ✅ Records BANT: Budget $20k, Timeline 1 month
- ✅ Schedules follow-up task


### Scenario 2: Hot Lead - High Intent (1-2 minutes)

**Purpose:** Test quick qualification with high buying signals

```
You: Hi, I need a CRM urgently. We're switching from Salesforce.

Clara: [Responds with interest]

You: I'm Michael Chen, VP of Sales at DataFlow Corporation. 
     We have 100 sales reps and a budget of $150,000 annually.

Clara: [Shows enthusiasm, asks about timeline]

You: We need to migrate within 3 weeks. Our Salesforce contract expires.

Clara: [Offers immediate demo/meeting]

You: Yes, let's schedule a demo for tomorrow if possible.
```

**Expected Clara Actions:**
- ✅ Creates high-value lead ($150k)
- ✅ High lead score (90+)
- ✅ Status: "Sales Qualified"
- ✅ Schedules urgent demo meeting
- ✅ Tags: "hot-lead", "urgent", "salesforce-migration"

---

## 📊 Complete Sales Scenarios

### Scenario 3: Full Discovery Call (5-7 minutes)

**Purpose:** Complete BANT qualification with detailed discovery

```
Clara: Hello! This is Clara from TrendtialCRM. How can I help you today?

You: Hi Clara, I came across your website and I'm interested in learning 
     more about your CRM solution.

Clara: [Asks qualifying questions]

You: I'm Jennifer Martinez, Director of Sales at GrowthTech Solutions.

Clara: Great to meet you, Jennifer! Tell me about your current situation.

You: We're using Excel and Google Sheets to track our sales pipeline. 
     It's becoming really inefficient as we've grown.

Clara: I understand. How many people are on your sales team?

You: We have 25 sales representatives across 3 different regions.

Clara: And what are the main pain points you're experiencing?

You: Three main issues:
     1. No visibility into our pipeline
     2. Sales reps spending too much time on data entry
     3. Management can't get real-time reports

Clara: Those are common challenges we help solve. What budget have you 
       allocated for a CRM solution?

You: We're looking at between $40,000 to $60,000 per year, depending 
     on the features and value we get.

Clara: That's helpful. Are you the decision maker for this purchase?

You: I'll be making the recommendation, but our CFO needs to approve 
     any purchase over $50,000. I have strong influence though.

Clara: Perfect. What's your timeline for making this decision?

You: We want to have something in place by the start of next quarter, 
     so about 6-8 weeks from now.

Clara: Excellent. Based on what you've shared, I think TrendtialCRM 
       would be a great fit. Would you like to schedule a product demo?

You: Yes, that would be great. Can we do it next Tuesday at 2 PM?

Clara: [Confirms meeting details]

You: Perfect. Also, can you send me some pricing information beforehand?

Clara: Absolutely. I'll email you our pricing guide and a comparison 
       sheet within the next hour.

You: Great, thank you Clara!
```

**Expected Clara Actions:**
- ✅ Lead created: GrowthTech Solutions
- ✅ Contact: Jennifer Martinez, Director of Sales
- ✅ BANT recorded:
  - Budget: $40-60k annually
  - Authority: Influencer, CFO approval needed
  - Need: Pipeline visibility, reduce data entry, real-time reporting
  - Timeline: 6-8 weeks
- ✅ Lead score: 75-80
- ✅ Demo meeting scheduled for next Tuesday 2 PM
- ✅ Follow-up: Send pricing information
- ✅ Call duration and sentiment tracked
- ✅ Activity logged: "Discovery call completed"


### Scenario 4: Enterprise Deal (8-10 minutes)

**Purpose:** Complex enterprise sale with multiple stakeholders

```
You: Good morning, I'm calling about your enterprise CRM solution.

Clara: [Professional greeting]

You: I'm Robert Williams, Chief Revenue Officer at MegaCorp Industries. 
     We're a Fortune 500 company evaluating CRM platforms.

Clara: [Shows appropriate reverence for enterprise prospect]

You: We have 500 sales representatives globally, across 15 countries. 
     Our current CRM is outdated and we're doing a complete overhaul.

Clara: That's a significant project. What's driving this change?

You: Multiple factors:
     - Integration issues with our ERP system
     - Poor mobile experience for field reps
     - Lack of AI-powered insights
     - No multi-currency support
     - Compliance concerns in EU markets

Clara: [Acknowledges complexity, asks about requirements]

You: We need enterprise-grade security, SOC 2 compliance, custom workflows, 
     and integration with SAP. Budget isn't the primary concern - we're 
     looking at $800,000 to $1.2 million annually.

Clara: [Responds appropriately to enterprise budget]

You: The buying committee includes myself, our CTO, Head of IT Security, 
     and ultimately needs CEO approval. We're looking at a 6-month 
     evaluation and implementation process.

Clara: [Acknowledges complexity, proposes structured approach]

You: We'll need a comprehensive demo, security audit, references from 
     similar-sized clients, and a detailed implementation plan.

Clara: [Offers to connect with enterprise sales team]

You: Yes, let's set up an initial call with your enterprise team. 
     I'll bring our CTO and Head of Sales Operations.
```

**Expected Clara Actions:**
- ✅ Lead created: MegaCorp Industries (Enterprise)
- ✅ High-value deal: $800k-$1.2M
- ✅ Lead score: 95+ (enterprise, clear budget, defined timeline)
- ✅ Multiple stakeholders noted in CRM
- ✅ Special tags: "enterprise", "fortune-500", "complex-requirements"
- ✅ Escalation note: "Route to enterprise sales team"
- ✅ Meeting scheduled with multiple participants
- ✅ Follow-up tasks: Security docs, references, implementation plan

---

## 🎯 BANT Qualification Scripts

### Scenario 5: Strong BANT - All Positive Signals

```
You: Hi, I'm David Lee from Innovate Labs.

Clara: [Greeting and qualification start]

You: We're actively looking for a CRM. We've already evaluated 
     Salesforce and HubSpot, but they're too expensive or too basic.

Clara: Tell me about your requirements.

You: We have 40 sales people, need mobile access, and integration 
     with our existing tools.

Clara: What budget are you working with?

You: We've allocated $60,000 for the first year in our approved budget.

Clara: Who's involved in the decision?

You: I'm the VP of Sales and I have full authority to make this decision. 
     Just need to notify our CFO, but that's a formality.

Clara: What's your timeline?

You: We want to start onboarding by March 1st, so we need to decide 
     by mid-February. That's about 3 weeks from now.

Clara: [Recognizes qualified lead, moves to close]

You: Can we schedule a demo this week?
```

**BANT Score: 100/100**
- Budget: ✅ Approved and specific
- Authority: ✅ Full decision authority
- Need: ✅ Clear and urgent
- Timeline: ✅ Immediate (3 weeks)


### Scenario 6: Weak BANT - Research Phase

```
You: Hi, I'm just exploring CRM options.

Clara: [Asks qualifying questions]

You: I'm Alex from a small startup. We're just 5 people right now.

Clara: What's prompting you to look at CRMs?

You: Well, we don't really have a problem yet, but I heard we should 
     get one. Maybe in the future when we grow.

Clara: What budget are you considering?

You: Honestly, we don't have a budget for this. Hoping to find 
     something free or very cheap.

Clara: Are you the decision maker?

You: I'd have to talk to my co-founder about any purchases.

Clara: What's your timeline?

You: No rush. Maybe later this year, or next year. Just researching now.
```

**BANT Score: 20/100**
- Budget: ❌ No budget allocated
- Authority: ❌ Not decision maker
- Need: ❌ No clear pain point
- Timeline: ❌ No timeline (researching only)

**Expected Actions:**
- ✅ Lead created but marked as "unqualified"
- ✅ Lower priority follow-up (nurture campaign)
- ✅ Status: "Marketing Qualified" at best


### Scenario 7: Mixed BANT - Needs Nurturing

```
You: Hi, I'm Lisa Thompson from Acme Corp.

Clara: [Qualification questions]

You: We're having real problems with our current system. It keeps 
     crashing and we're losing data. We need something more reliable.

Clara: That sounds frustrating. What budget do you have?

You: We haven't really discussed budget yet. I need to make a case 
     to my boss first.

Clara: Who would need to approve this?

You: My manager, the IT director, and probably the CFO for final approval.

Clara: What's your timeline?

You: We need something soon, but probably need a few months to go 
     through our procurement process. Maybe Q2?
```

**BANT Score: 60/100**
- Budget: ⚠️ Unclear, needs to be defined
- Authority: ⚠️ Multiple approvers, not primary decision maker
- Need: ✅ Clear and urgent pain point
- Timeline: ⚠️ 2-3 months (moderate urgency)

**Expected Actions:**
- ✅ Lead qualified as "Marketing Qualified"
- ✅ Next step: Send ROI calculator and case study
- ✅ Follow-up: Help build business case for management

---

## 🛡️ Objection Handling Scripts

### Scenario 8: Price Objection

```
You: I'm interested, but your pricing seems high compared to competitors.

Clara: [Handles objection, asks about value perception]

You: HubSpot offers similar features for $10,000 less per year.

Clara: [Discusses value differentiation]

You: Can you offer any discount or flexible pricing?

Clara: [Explains value, may offer to connect with sales manager]

You: Let me think about it and compare the options.
```

**Expected Actions:**
- ✅ Objection logged: "Price concern"
- ✅ Competitor noted: HubSpot
- ✅ Follow-up: Send ROI analysis and value comparison
- ✅ Status: "Negotiation" stage


### Scenario 9: "Not Right Time" Objection

```
You: This looks great, but now isn't the right time for us.

Clara: [Asks clarifying questions]

You: We're in the middle of a company reorganization. 
     Everything is on hold until Q3.

Clara: [Acknowledges timing, asks about staying in touch]

You: Yes, please reach out to me in about 4 months.
```

**Expected Actions:**
- ✅ Lead status: "Timing - Follow up Q3"
- ✅ Scheduled follow-up: 4 months
- ✅ Stay in nurture campaign
- ✅ Note: "Reorg in progress, revisit Q3"


### Scenario 10: Competition Objection

```
You: We're also looking at Salesforce and Zoho.

Clara: [Asks about evaluation criteria]

You: Salesforce seems more established, and Zoho is cheaper.

Clara: [Discusses comparative advantages]

You: What makes you different from them?

Clara: [Highlights unique value propositions]

You: Can you send me a comparison chart?
```

**Expected Actions:**
- ✅ Competitors logged: Salesforce, Zoho
- ✅ Send competitive comparison document
- ✅ Follow-up: Case studies vs competitors
- ✅ Status remains: "Evaluation phase"

---

## 🔄 Multi-Turn Complex Scenarios

### Scenario 11: Progressive Information Disclosure (10+ turns)

```
Turn 1:
You: Hi, I need help with sales automation.
Clara: [Opens conversation]

Turn 2:
You: We're a B2B company selling software.
Clara: [Asks about team size]

Turn 3:
You: About 35 people in sales.
Clara: [Asks about current tools]

Turn 4:
You: Using a mix of Salesforce and custom spreadsheets.
Clara: [Asks about pain points]

Turn 5:
You: Salesforce is too complex and expensive. Spreadsheets are manual.
Clara: [Explores budget]

Turn 6:
You: We're spending $70k on Salesforce now. Want something more efficient.
Clara: [Discusses authority]

Turn 7:
You: I'm the Head of Sales. I can make the decision with CEO approval.
Clara: [Asks about timeline]

Turn 8:
You: Our Salesforce contract renews in 2 months. Want to switch before then.
Clara: [Summarizes and proposes next steps]

Turn 9:
You: What's the migration process like?
Clara: [Explains migration]

Turn 10:
You: Can you guarantee data won't be lost?
Clara: [Addresses concern]

Turn 11:
You: Okay, let's schedule a demo with your migration team.
Clara: [Schedules meeting]
```

**Expected Actions:**
- ✅ Tracks all conversation context
- ✅ Builds complete lead profile progressively
- ✅ Identifies competitor (Salesforce)
- ✅ Notes: Migration concern, data security important
- ✅ Schedules specialized demo (migration focus)


### Scenario 12: Multiple Decision Points

```
You: We're evaluating CRMs. Tell me about your product.

Clara: [Product overview]

You: Sounds interesting. How does reporting work?

Clara: [Explains reporting features]

You: Can it integrate with QuickBooks?

Clara: [Discusses integrations]

You: What about mobile access?

Clara: [Mobile capabilities]

You: How much training do users need?

Clara: [Training and onboarding]

You: What's included in support?

Clara: [Support details]

You: If we have custom requirements, can you accommodate?

Clara: [Custom development options]

You: Let me discuss with my team and get back to you.
```

**Expected Actions:**
- ✅ All questions logged as "concerns/interests"
- ✅ Focus areas noted: Reporting, integrations, mobile, training, customization
- ✅ Status: "Information gathering"
- ✅ Follow-up: Send detailed feature documentation

---

## 🧪 Edge Cases & Testing

### Scenario 13: Unclear Information

```
You: Hi, we need some kind of system.

Clara: [Clarifying questions]

You: Um, I'm not sure exactly. Something for sales maybe?

Clara: [More specific questions]

You: I don't know the details. My boss asked me to call.
```

**Expected Actions:**
- ✅ Politely gathers what information is available
- ✅ Suggests connecting with appropriate decision maker
- ✅ Status: "Needs qualification"


### Scenario 14: Very Technical Questions

```
You: Does your system support OAuth 2.0 with PKCE?

Clara: [Responds or defers to technical expert]

You: What about webhook retries and exponential backoff?

Clara: [Technical discussion or escalation]

You: Can we get API documentation before purchasing?
```

**Expected Actions:**
- ✅ Identifies technical buyer persona
- ✅ Offers to connect with solutions architect
- ✅ Sends technical documentation


### Scenario 15: International/Multi-Region

```
You: We operate in 12 countries across Europe and Asia.

Clara: [Asks about specific requirements]

You: We need GDPR compliance, multi-currency, and 24/7 support 
     across time zones.

Clara: [Discusses global capabilities]

You: Can data be stored in EU data centers for GDPR?
```

**Expected Actions:**
- ✅ Flags as: "International", "GDPR", "Multi-region"
- ✅ Routes to appropriate regional team
- ✅ Notes compliance requirements

---

## 🎬 Quick Test Commands

### Run Single Scenario Test:

```python
# In Python console
from agents.sales_agent import SalesAgent

agent = SalesAgent()
response = agent.process(
    user_input="Hi, I'm looking for a CRM for my 50-person sales team. Budget is $75k.",
    session_id="scenario-test-001"
)
print(response)
```

### Run Conversation Flow:

```python
# Multi-turn conversation
agent = SalesAgent()
session = "flow-test-001"

messages = [
    "Hi, I need a CRM solution",
    "I'm John from TechCorp, we have 30 sales people",
    "Budget is around $40,000 per year",
    "We need it within 2 months"
]

for msg in messages:
    response = agent.process(user_input=msg, session_id=session)
    print(f"You: {msg}")
    print(f"Clara: {response}\n")
```

### Check CRM Data Created:

```python
# Verify lead was created
from crm_integration import LeadsAPI

leads_api = LeadsAPI()
leads = leads_api.list_leads(limit=5)

for lead in leads:
    print(f"Lead: {lead['contact_person']} | Score: {lead['lead_score']} | Status: {lead['qualification_status']}")
```

---

## 📊 Success Metrics to Check

After each conversation, verify:

1. **✅ Lead Created**
   - Company name captured
   - Contact information stored
   - Industry/company size noted

2. **✅ BANT Assessed**
   - Budget range documented
   - Decision authority identified
   - Clear need articulated
   - Timeline established

3. **✅ Call Tracked**
   - Call duration recorded
   - Transcript saved
   - Sentiment score calculated
   - Intent detected

4. **✅ Next Actions**
   - Follow-ups scheduled
   - Meetings booked
   - Materials sent

5. **✅ Scoring**
   - Lead score calculated (0-100)
   - Qualification status set
   - Pipeline stage assigned

---

## 🚀 Running the Complete Test Suite

Execute all scenarios automatically:

```bash
# Run comprehensive test suite
python scripts/test_voice_crm_integration.py
```

This will test:
- ✅ Lead creation
- ✅ Call tracking
- ✅ BANT qualification
- ✅ Follow-up scheduling
- ✅ Meeting scheduling
- ✅ Activity logging
- ✅ Lead scoring
- ✅ Pipeline management
- ✅ Conversation handling
- ✅ Data retrieval

---

## 📝 Notes for Testing

1. **Session IDs**: Use unique session IDs for each test conversation to track separately
2. **Test Data**: All test leads can be easily identified and cleaned up later
3. **Verification**: After each conversation, check Supabase Dashboard to see created data
4. **Edge Cases**: Test both happy paths and difficult scenarios
5. **Performance**: Note response times and system behavior under load

---

## 🎯 What to Look For

### Good Signs ✅:
- Clara asks relevant follow-up questions
- Information is extracted and stored correctly
- Lead scores are reasonable
- Next actions are appropriate
- Conversations feel natural

### Red Flags ❌:
- Missing critical information
- Incorrect BANT assessment
- No follow-up actions suggested
- Conversation loops or confusion
- Data not saved to CRM

---

## 📞 Ready to Test!

Choose a scenario, start a conversation with Clara, and watch the CRM integration in action!

**Pro Tip**: Start with Scenario 1-3 for quick wins, then try complex scenarios to stress-test the system.

