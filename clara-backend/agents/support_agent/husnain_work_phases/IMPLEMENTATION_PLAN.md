# 🚀 Multi-Agent CRM System - Implementation Plan

## Project: Clara AI - Intelligent CRM Assistant
**Team Members:**
- **Faheem** → Sales Agent + Voice Integration
- **Husnain** → Support Agent + Email Integration
- **Sheryar** → Marketing Agent + Chatbot Integration
- **All** → Orchestrator + Testing + Integration

---

## 📁 Project Structure

```
Clara/
├── Verbi/                          # Voice Assistant (existing)
│   └── voice_assistant/
│       ├── transcription.py
│       ├── response_generation.py
│       └── ...
│
├── trendtialcrm/                   # CRM Frontend (existing)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── types/
│   └── supabase/
│
├── clara-backend/                  # NEW: Multi-Agent Backend
│   ├── orchestrator/              # Shared by all team members
│   │   ├── __init__.py
│   │   ├── core.py               # Main orchestrator logic
│   │   ├── classifier.py         # Intent classification
│   │   ├── router.py             # Route to appropriate agent
│   │   ├── message_parser.py     # Parse incoming messages
│   │   └── config.py             # Orchestrator config
│   │
│   ├── agents/                    # Individual agent modules
│   │   ├── __init__.py
│   │   ├── base_agent.py         # Base class for all agents
│   │   │
│   │   ├── sales_agent/          # FAHEEM'S RESPONSIBILITY
│   │   │   ├── __init__.py
│   │   │   ├── agent.py          # Main sales agent logic
│   │   │   ├── lead_qualifier.py # Lead qualification
│   │   │   ├── lead_scorer.py    # Lead scoring
│   │   │   ├── prompts.py        # LLM prompts for sales
│   │   │   └── crm_connector.py  # Connect to Supabase CRM
│   │   │
│   │   ├── support_agent/         # HUSNAIN'S RESPONSIBILITY
│   │   │   ├── __init__.py
│   │   │   ├── agent.py
│   │   │   ├── ticket_handler.py
│   │   │   ├── faq_handler.py
│   │   │   └── prompts.py
│   │   │
│   │   └── marketing_agent/       # SHERYAR'S RESPONSIBILITY
│   │       ├── __init__.py
│   │       ├── agent.py
│   │       ├── sentiment_analyzer.py
│   │       ├── campaign_suggester.py
│   │       └── prompts.py
│   │
│   ├── input_streams/             # Different input channels
│   │   ├── __init__.py
│   │   ├── voice_stream.py       # FAHEEM: Voice → Orchestrator
│   │   ├── email_stream.py       # HUSNAIN: Email → Orchestrator
│   │   └── chatbot_stream.py     # SHERYAR: Chatbot → Orchestrator
│   │
│   ├── crm_integration/           # Supabase CRM Integration
│   │   ├── __init__.py
│   │   ├── supabase_client.py    # Supabase connection
│   │   ├── leads_api.py          # Lead operations
│   │   ├── tickets_api.py        # Ticket operations
│   │   └── notes_api.py          # Notes operations
│   │
│   ├── utils/                     # Shared utilities
│   │   ├── __init__.py
│   │   ├── logger.py
│   │   ├── validators.py
│   │   └── formatters.py
│   │
│   ├── tests/                     # Unit and integration tests
│   │   ├── test_orchestrator.py
│   │   ├── test_sales_agent.py
│   │   ├── test_support_agent.py
│   │   └── test_marketing_agent.py
│   │
│   ├── config.py                  # Global configuration
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment variables template
│   └── main.py                    # Main entry point
│
└── IMPLEMENTATION_PLAN.md         # This file
```

---

## 🔄 Orchestrator Design (Shared - All Team Members)

### Orchestrator JSON Format

```json
{
  "message_id": "uuid",
  "timestamp": "2024-11-22T10:00:00Z",
  "input_channel": "voice" | "email" | "chatbot",
  "user_info": {
    "user_id": "optional",
    "session_id": "required",
    "contact_info": "email or phone"
  },
  "raw_message": "The original message text",
  "parsed_message": {
    "intent": "sales_inquiry" | "support_request" | "marketing_feedback",
    "entities": {
      "company_name": "extracted if present",
      "product": "extracted if present",
      "urgency": "high" | "medium" | "low"
    },
    "confidence": 0.95
  },
  "routing": {
    "target_agent": "sales" | "support" | "marketing",
    "priority": 1-5,
    "reason": "Why this agent was selected"
  }
}
```

### Classification Categories

1. **Sales Intent**
   - Lead inquiry (new customer)
   - Product interest
   - Pricing questions
   - Demo requests
   - Follow-up conversations

2. **Support Intent**
   - Technical issues
   - Bug reports
   - How-to questions
   - Account problems
   - Escalation requests

3. **Marketing Intent**
   - General feedback
   - Feature requests
   - Campaign responses
   - Suggestions
   - Testimonials

---

## 🎯 Sales Agent Design (FAHEEM)

### Core Responsibilities

1. **Lead Qualification**
   - Extract company info, contact details
   - Assess lead quality (budget, authority, need, timeline - BANT)
   - Assign qualification status

2. **Lead Scoring**
   - Calculate lead score based on:
     - Company size
     - Industry match
     - Engagement level
     - Response quality
   - Assign score 0-100

3. **CRM Integration**
   - Create new leads in Supabase
   - Update lead stages (P1/P2/P3)
   - Add notes and activities
   - Schedule follow-ups

4. **Conversation Management**
   - Maintain context
   - Ask qualifying questions
   - Provide product information
   - Handle objections

### Sales Agent Workflow

```
Voice Input → STT (Verbi) → Text
                            ↓
                     Orchestrator
                    (Classify intent)
                            ↓
                      Sales Agent
                            ↓
                  ┌─────────┴─────────┐
                  ↓                   ↓
          Lead Qualification    CRM Update
                  ↓                   ↓
          Generate Response    Update Database
                  ↓                   ↓
                  └─────────┬─────────┘
                            ↓
                      TTS (Voice)
                            ↓
                    Play to User
```

### Sales Agent Prompt Template

```python
SALES_AGENT_PROMPT = """
You are a professional sales assistant for [Company Name]. 
Your goal is to:
1. Qualify leads by gathering: company name, industry, contact person, needs
2. Understand their requirements and pain points
3. Match their needs to our products/services
4. Schedule follow-ups or demos when appropriate

Current conversation context:
{conversation_history}

Lead information gathered so far:
{lead_data}

User's latest message:
{user_message}

Respond professionally and ask ONE relevant qualifying question if needed.
"""
```

---

## 📅 Day-by-Day Implementation (Faheem's Tasks)

### ✅ Day 1 - System Setup (Today)
- [x] Review existing codebase
- [x] Create implementation plan
- [ ] Setup project structure
- [ ] Create requirements.txt
- [ ] Setup .env files

### Day 2 - Voice Integration
- [ ] Create `input_streams/voice_stream.py`
- [ ] Integrate with Verbi transcription
- [ ] Test Voice → Text conversion
- [ ] Connect to Orchestrator

### Day 3 - Orchestrator Base (Collaborative)
- [ ] Define message JSON format
- [ ] Implement classifier.py
- [ ] Implement router.py
- [ ] Create basic routing logic

### Days 4-5 - Sales Agent Phase 1
- [ ] Create `agents/sales_agent/agent.py`
- [ ] Implement lead qualification logic
- [ ] Create LLM prompt templates
- [ ] Build conversation state management
- [ ] Add lead scoring algorithm

### Day 6 - Orchestrator Integration
- [ ] Connect Sales Agent to Orchestrator
- [ ] Test routing with mock data
- [ ] Debug and fix issues

### Days 7-8 - CRM Integration
- [ ] Create `crm_integration/leads_api.py`
- [ ] Implement Supabase connection
- [ ] Create/Update lead functions
- [ ] Add activity logging
- [ ] Test full pipeline

### Day 9 - Full Pipeline Test
- [ ] Test: Voice → Text → Orchestrator → Sales Agent → CRM
- [ ] Test different scenarios (new lead, existing lead, follow-up)
- [ ] Fix bugs and edge cases

### Days 10-11 - Enhancement
- [ ] Improve lead scoring algorithm
- [ ] Add advanced qualification questions
- [ ] Enhance CRM mapping
- [ ] Add error handling and retries

### Day 12 - Orchestrator Enhancement (Collaborative)
- [ ] Add confidence scoring
- [ ] Implement retry logic
- [ ] Add logging and monitoring
- [ ] Improve routing accuracy

### Day 13 - Frontend Integration
- [ ] Update CRM frontend to show agent activities
- [ ] Add "Agent Conversation Log" view
- [ ] Display lead updates from agent

### Day 14 - Final Testing
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Documentation
- [ ] Bug fixes

---

## 🔧 Technical Stack

### Backend
- **Python 3.10+**
- **FastAPI** - API endpoints for orchestrator
- **OpenAI API** - LLM for agent intelligence
- **Supabase Python Client** - CRM database operations
- **Pydantic** - Data validation
- **Python-dotenv** - Environment management

### Voice Integration
- **Groq/OpenAI Whisper** - Speech-to-Text
- **Deepgram/OpenAI TTS** - Text-to-Speech
- **Verbi** - Existing voice assistant framework

### CRM
- **Supabase** - PostgreSQL database
- **React + TypeScript** - Frontend (existing)

---

## 📊 Success Metrics

### Sales Agent Performance
- ✅ Successfully qualifies 90%+ of leads
- ✅ Accurate lead scoring (±10 points)
- ✅ Proper CRM updates 100% of time
- ✅ Response time < 3 seconds
- ✅ Natural conversation flow

### Orchestrator Performance
- ✅ Routing accuracy > 95%
- ✅ Classification confidence > 0.85
- ✅ Processing time < 500ms
- ✅ Error handling 100%

---

## 🔐 Environment Variables

```env
# OpenAI / LLM
OPENAI_API_KEY=your_key
GROQ_API_KEY=your_key

# Supabase
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key

# Orchestrator
ORCHESTRATOR_PORT=8001
LOG_LEVEL=INFO

# Agents
SALES_AGENT_ENABLED=true
SUPPORT_AGENT_ENABLED=false
MARKETING_AGENT_ENABLED=false
```

---

## 🚀 Getting Started

### For Faheem (Sales Agent + Voice)
1. Setup clara-backend project structure
2. Create orchestrator base (with team)
3. Implement Sales Agent
4. Integrate with Voice (Verbi)
5. Connect to Supabase CRM
6. Test end-to-end pipeline

### For Husnain (Support Agent + Email)
1. Wait for orchestrator base structure
2. Implement Support Agent
3. Integrate with Email Parser
4. Connect to Supabase (tickets)
5. Test end-to-end pipeline

### For Sheryar (Marketing Agent + Chatbot)
1. Wait for orchestrator base structure
2. Implement Marketing Agent
3. Integrate with Chatbot
4. Connect to Supabase (notes)
5. Test end-to-end pipeline

---

## 📝 Notes

- Keep code modular and well-documented
- Follow Python PEP 8 style guide
- Write unit tests for critical functions
- Use type hints everywhere
- Log all important events
- Handle errors gracefully

---

**Created by:** Faheem
**Date:** November 22, 2025
**Version:** 1.0

