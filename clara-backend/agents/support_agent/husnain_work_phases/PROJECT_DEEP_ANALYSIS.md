# 🔍 Clara Multi-Agent CRM System - Complete Deep Analysis

**Analysis Date:** November 29, 2025
**Project Status:** Sales Agent Complete | Support Agent Pending (Your Task)

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Module-by-Module Breakdown](#module-by-module-breakdown)
5. [Integration Points](#integration-points)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Support Agent Implementation Guidelines](#support-agent-implementation-guidelines)
9. [Integration Strategy](#integration-strategy)
10. [Critical Considerations](#critical-considerations)

---

## 1. Executive Summary

### Project: Clara AI - Intelligent Multi-Agent CRM System

**Purpose:** Create an AI-powered CRM automation system where multiple specialized agents handle different customer interaction channels (voice, email, chatbot) and different business functions (sales, support, marketing).

### Team Structure:
- **Faheem** → Sales Agent + Voice Integration ✅ **COMPLETE**
- **Husnain (YOU)** → Support Agent + Email Integration ⏳ **YOUR RESPONSIBILITY**
- **Sheryar** → Marketing Agent + Chatbot Integration ⏳ PENDING

### What Makes This Unique:
This is NOT just a simple CRM. It's a **multi-agent orchestration system** where:
1. Multiple input channels (voice, email, chat) funnel into a central orchestrator
2. An intelligent classifier determines the intent and routes to the appropriate agent
3. Each specialized agent (Sales/Support/Marketing) processes requests in their domain
4. All agents share the same Supabase CRM backend
5. The React frontend displays everything in real-time

---

## 2. System Architecture Overview

### High-Level Flow:

```
┌──────────────────────────────────────────────────────────────┐
│                    INPUT CHANNELS                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │  Voice   │    │  Email   │    │ Chatbot  │               │
│  │ (Verbi)  │    │  Stream  │    │  Stream  │               │
│  │ (Faheem) │    │(Husnain) │    │(Sheryar) │               │
│  └─────┬────┘    └────┬─────┘    └────┬─────┘               │
└────────┼──────────────┼───────────────┼──────────────────────┘
         │              │               │
         │    Speech-to-Text (STT)     │
         │    Text from Email/Chat     │
         └──────────────┼───────────────┘
                        ↓
         ┌──────────────────────────────┐
         │    CLARA BACKEND             │
         │  ┌───────────────────────┐   │
         │  │   ORCHESTRATOR        │   │
         │  │  ┌─────────────────┐  │   │
         │  │  │ Message Parser  │  │   │
         │  │  └────────┬────────┘  │   │
         │  │           ↓           │   │
         │  │  ┌─────────────────┐  │   │
         │  │  │   Classifier    │  │   │
         │  │  │  (LLM-Powered)  │  │   │
         │  │  └────────┬────────┘  │   │
         │  │           ↓           │   │
         │  │  ┌─────────────────┐  │   │
         │  │  │     Router      │  │   │
         │  │  │  (Confidence)   │  │   │
         │  │  └────────┬────────┘  │   │
         │  └───────────┼───────────┘   │
         │              ↓               │
         │  ┌───────────────────────┐   │
         │  │   AGENT SELECTION     │   │
         │  └───────┬───┬───┬───────┘   │
         │          ↓   ↓   ↓           │
         │  ┌──────┐┌──────┐┌──────┐    │
         │  │Sales ││Support││Market│    │
         │  │Agent ││Agent ││Agent │    │
         │  │(Done)││(YOU) ││      │    │
         │  └───┬──┘└───┬──┘└───┬──┘    │
         └──────┼───────┼───────┼────────┘
                ↓       ↓       ↓
         ┌──────────────────────────────┐
         │    SUPABASE CRM DATABASE     │
         │  ┌────────┬────────┬───────┐ │
         │  │ Leads  │Tickets │ Notes │ │
         │  │ Clients│ Users  │ Logs  │ │
         │  └────────┴────────┴───────┘ │
         └───────────────┬──────────────┘
                        ↓
         ┌──────────────────────────────┐
         │   TRENDTIALCRM FRONTEND      │
         │         (React + TS)         │
         │                              │
         │  - Dashboard                 │
         │  - Leads Management          │
         │  - Support Tickets           │
         │  - Real-time Updates         │
         └──────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Clara Backend (Python - Multi-Agent System)

**Core Framework:**
- **Python 3.10+**: Main language
- **FastAPI**: REST API server (runs on port 8001)
- **Pydantic**: Data validation and settings management
- **Uvicorn**: ASGI server

**AI/LLM:**
- **OpenAI GPT-4**: Alternative LLM
- **Groq (Llama 3.3 70B)**: Primary LLM (faster, cheaper)
- **LLM Usage:**
  - Intent classification
  - Entity extraction
  - Conversational responses
  - Context understanding

**Database:**
- **Supabase (PostgreSQL)**: Main database
- **Supabase Python Client**: Database operations
- Row-level security enabled
- Real-time subscriptions

**Voice Processing (Verbi Integration):**
- **Groq Whisper**: Speech-to-Text (STT)
- **Deepgram/Cartesia**: Text-to-Speech (TTS)
- Audio recording/playback

**Utilities:**
- **Loguru**: Advanced logging
- **python-dotenv**: Environment management

### 3.2 Verbi (Voice Assistant)

**Location:** `Verbi/` folder

**Purpose:** Modular voice assistant framework that handles:
- Audio input/output
- Speech-to-Text conversion
- Text-to-Speech generation
- Voice activity detection (VAD)

**Key Features:**
- Supports multiple STT providers (OpenAI, Groq, Deepgram, local)
- Supports multiple TTS providers (OpenAI, Deepgram, ElevenLabs, local)
- Interruption handling
- Real-time audio streaming

**Integration Point:**
- Verbi captures voice → converts to text → sends to Clara Backend
- Clara Backend processes → returns text → Verbi converts to speech → plays audio

### 3.3 TrendtialCRM (Frontend)

**Location:** `trendtialcrm/` folder

**Technology:**
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool (fast HMR)
- **TailwindCSS**: Styling
- **shadcn/ui**: UI components
- **TanStack Query**: Data fetching/caching
- **Supabase JS Client**: Real-time database

**Features:**
- Role-based access (agent, manager, super_admin)
- Real-time updates via WebSocket
- Leads management (P1/P2/P3 priority buckets)
- Follow-ups tracking
- Meetings calendar
- Dashboard analytics
- Admin portal

**Pages:**
- `/dashboard` - Main dashboard
- `/leads` - Leads table
- `/followups` - Follow-ups Kanban board
- `/meetings` - Calendar view
- `/tickets` - Support tickets (for your agent)
- `/admin/*` - Admin management

---

## 4. Module-by-Module Breakdown

### 4.1 Clara Backend Structure

```
clara-backend/
├── orchestrator/              # Message routing & classification
│   ├── core.py               # Main orchestrator (processes all messages)
│   ├── classifier.py         # Intent classification (sales/support/marketing)
│   ├── router.py             # Routes to appropriate agent
│   └── message_parser.py     # Parses & sanitizes messages
│
├── agents/                    # AI Agents
│   ├── base_agent.py         # Abstract base class for all agents
│   │
│   ├── sales_agent/          # ✅ COMPLETE (Faheem)
│   │   ├── agent.py          # Main sales logic
│   │   ├── prompts.py        # LLM prompts
│   │   ├── lead_qualifier.py # BANT qualification
│   │   ├── lead_scorer.py    # Lead scoring (0-100)
│   │   └── crm_connector.py  # CRM operations
│   │
│   ├── support_agent/        # ⏳ YOUR RESPONSIBILITY (Husnain)
│   │   └── __init__.py       # Placeholder
│   │
│   └── marketing_agent/      # ⏳ PENDING (Sheryar)
│       └── __init__.py       # Placeholder
│
├── input_streams/             # Input channels
│   ├── voice_stream.py       # Voice I/O (Faheem)
│   ├── email_stream.py       # Email parser (YOU - Husnain)
│   └── chatbot_stream.py     # Chatbot (Sheryar)
│
├── crm_integration/           # Supabase integration
│   ├── supabase_client.py    # Client setup
│   ├── leads_api.py          # Lead CRUD operations
│   └── tickets_api.py        # Ticket operations (for YOU)
│
├── utils/                     # Utilities
│   ├── logger.py             # Logging setup
│   ├── validators.py         # Email, phone validation
│   └── formatters.py         # Data formatting
│
├── config.py                  # Global configuration
├── main.py                    # FastAPI application
└── requirements.txt           # Dependencies
```

### 4.2 Orchestrator Deep Dive

**File:** `orchestrator/core.py`

**Class:** `Orchestrator`

**Key Methods:**

1. **`process_message(raw_message, input_channel, user_info, session_id)`**
   - Main entry point for all messages
   - Steps:
     1. Parse message (sanitize, extract basic info)
     2. Classify intent using LLM (sales/support/marketing)
     3. Route to appropriate agent
     4. Return processed message with routing info

2. **`route_to_agent(processed_message, agent_instances)`**
   - Takes processed message
   - Calls the appropriate agent's `process()` method
   - Returns agent response

**Classification Logic:**

**File:** `orchestrator/classifier.py`

**How Intent is Determined:**
1. **Rule-based classification** (fallback):
   - Keyword matching
   - Urgency detection
   - Company info extraction

2. **LLM-based classification** (primary):
   - Uses GPT-4/Llama 3.3 70B
   - System prompt defines categories:
     - **sales**: Lead inquiries, product interest, pricing, demos
     - **support**: Technical issues, bugs, help requests, troubleshooting
     - **marketing**: Feedback, feature requests, suggestions, testimonials
   - Returns JSON with intent, confidence, entities

3. **Hybrid approach**:
   - If LLM confidence >= 0.75, use LLM classification
   - Otherwise, use rule-based with LLM enhancement

**Example Message Classification:**

```python
# Input message
"Hi, my email isn't syncing and I need help ASAP!"

# Orchestrator processes:
{
  "intent": "support",
  "confidence": 0.92,
  "entities": {
    "urgency": "high",
    "issue_type": "email_sync",
    "product_mentioned": "email"
  },
  "routing": {
    "target_agent": "support",  # Routes to YOUR agent
    "priority": 1,  # High priority
    "reason": "Technical support request with high urgency"
  }
}
```

### 4.3 Sales Agent (Faheem's Implementation) - YOUR REFERENCE

**File:** `agents/sales_agent/agent.py`

**Class:** `SalesAgent(BaseAgent)`

**Key Features:**

1. **Lead Qualification (BANT Framework)**:
   - **B**udget: Does prospect have budget?
   - **A**uthority: Are they decision-maker?
   - **N**eed: Do they have genuine need?
   - **T**imeline: When do they need solution?

2. **Lead Scoring (0-100)**:
   - Company Fit: 0-25 points
   - Engagement Level: 0-25 points
   - BANT Assessment: 0-30 points
   - Intent Signals: 0-20 points
   - **Grades:** A (90-100), B (70-89), C (50-69), D (30-49), F (0-29)

3. **CRM Operations**:
   - Create/update leads in Supabase
   - Add activities to timeline
   - Move leads between stages (P1/P2/P3)
   - Update lead scores

4. **Conversational Response**:
   - Uses LLM to generate natural responses
   - Maintains conversation context
   - Asks qualifying questions naturally
   - Provides product information

**Process Flow:**

```python
def process(message_data):
    # 1. Extract info from orchestrator
    session_id = extract_session_id(message_data)
    user_message = message_data["raw_message"]
    
    # 2. Add to conversation history
    add_to_conversation_history(session_id, "user", user_message)
    
    # 3. Qualify the lead
    qualification_result = qualifier.qualify_lead(
        conversation_history,
        latest_message,
        current_lead_info
    )
    
    # 4. Calculate lead score
    score_breakdown = scorer.calculate_score(
        lead_info,
        bant_assessment,
        conversation_history
    )
    
    # 5. Generate response using LLM
    response_text = _generate_response(
        conversation_history,
        lead_info,
        qualification_result,
        score_breakdown
    )
    
    # 6. Update CRM if qualified
    if should_update_crm():
        crm_connector.create_or_update_lead(...)
    
    # 7. Return formatted response
    return {
        "success": True,
        "agent": "sales",
        "message": response_text,
        "metadata": {
            "lead_score": 75,
            "qualification_status": "sales_qualified",
            "crm_updated": True
        }
    }
```

---

## 5. Integration Points

### 5.1 Voice → Clara Backend

**Flow:**
1. User speaks into microphone
2. Verbi captures audio
3. Verbi sends to Groq Whisper (STT)
4. Text returned
5. Text sent to Clara Backend `/api/message` endpoint
6. Clara processes and returns response
7. Verbi converts response to speech (TTS)
8. Plays audio to user

**API Endpoint:**
```
POST http://localhost:8001/api/message
{
  "message": "transcribed text",
  "input_channel": "voice",
  "session_id": "unique_session_id"
}
```

### 5.2 Email → Clara Backend (YOUR TASK)

**Flow (To Be Implemented):**
1. Email arrives in monitored inbox
2. Email parser extracts:
   - Subject
   - Body
   - Sender info
   - Attachments (optional)
3. Text sent to Clara Backend
4. Orchestrator classifies (likely "support")
5. YOUR support agent processes
6. Response sent back via email

**Implementation File:** `input_streams/email_stream.py`

### 5.3 Clara Backend → Supabase

**CRM Integration:**

**File:** `crm_integration/supabase_client.py`

```python
from supabase import create_client

def get_supabase_client():
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_KEY
    )
```

**Operations:**
- `leads_api.py`: Create/read/update leads
- `tickets_api.py`: Create/update support tickets (for YOU)
- Real-time updates via Supabase subscriptions

### 5.4 Supabase → Frontend

**Real-time Updates:**
- Frontend subscribes to database changes
- When agent updates CRM, frontend updates automatically
- Uses Supabase Realtime (WebSocket)

**Example:**
```typescript
// Frontend subscribes to leads table
supabase
  .channel('leads-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'leads' },
    (payload) => {
      // Update UI with new lead data
      console.log('Lead updated:', payload.new)
    }
  )
  .subscribe()
```

---

## 6. Database Schema

### Key Tables (Supabase PostgreSQL)

**File:** `clara-backend/supabase_schema_trendtial_compatible.sql`

### 6.1 `users` Table
```sql
- id (UUID)
- full_name (TEXT)
- email (TEXT) UNIQUE
- role (TEXT) -- 'agent', 'manager', 'super_admin'
- manager_id (UUID FK)
- phone, avatar_url, is_active
- created_at, updated_at
```

### 6.2 `clients` Table
```sql
- id (UUID)
- client_name (VARCHAR)
- email, phone, company
- industry, company_size, location, website
- physical_meeting_info
- expected_value (DECIMAL)
- tags (TEXT[])
- created_at, updated_at
```

### 6.3 `leads` Table (Sales Agent Data)
```sql
- id (UUID)
- client_id (UUID FK)
- agent_id (UUID FK)
- status_bucket (TEXT) -- 'P1', 'P2', 'P3'
- contact_person, email, phone
- deal_value (DECIMAL)

-- BANT Qualification (from Sales Agent)
- budget (VARCHAR)
- authority (VARCHAR)
- need (TEXT)
- timeline (VARCHAR)

-- Scoring
- qualification_status (VARCHAR) -- 'unqualified', 'marketing_qualified', 'sales_qualified', 'opportunity'
- lead_score (INTEGER) -- 0-100
- score_grade (VARCHAR) -- A, B, C, D, F

-- Pipeline
- pipeline_stage_id (UUID FK)
- expected_close_date (DATE)
- win_probability (INTEGER)
```

### 6.4 `tickets` Table (Support Agent Data - FOR YOU)
```sql
- id (UUID)
- client_id (UUID FK)
- agent_id (UUID FK)
- title (VARCHAR)
- description (TEXT)
- status (VARCHAR) -- 'open', 'in_progress', 'resolved', 'closed'
- priority (VARCHAR) -- 'low', 'medium', 'high', 'urgent'
- category (VARCHAR) -- 'technical', 'billing', 'general'
-
-- AI Support Agent Fields
- classification (VARCHAR) -- Auto-classified by support agent
- sentiment (VARCHAR) -- 'positive', 'neutral', 'negative'
- resolution_time (INTERVAL)
- first_response_time (INTERVAL)
- escalated (BOOLEAN)

-- Metadata
- created_at, updated_at, resolved_at, closed_at
```

### 6.5 `activities` Table (Timeline)
```sql
- id (UUID)
- entity_type (VARCHAR) -- 'lead', 'ticket', 'client'
- entity_id (UUID)
- agent_id (UUID FK)
- activity_type (VARCHAR) -- 'note', 'call', 'email', 'meeting', 'status_change'
- content (TEXT)
- metadata (JSONB) -- Additional info from agents
- created_at
```

---

## 7. API Endpoints

### Clara Backend (Port 8001)

#### Core Endpoints:

**1. Process Message**
```
POST /api/message
Body: {
  "message": "string",
  "input_channel": "voice|email|chatbot",
  "session_id": "string",
  "user_id": "string (optional)"
}
Response: {
  "success": true,
  "agent": "sales|support|marketing",
  "message": "Agent response text",
  "metadata": { ... },
  "actions": ["action1", "action2"]
}
```

**2. Voice Interaction**
```
POST /api/voice
- Captures voice input
- Processes through orchestrator
- Returns voice output
```

**3. Health Check**
```
GET /health
Response: {
  "status": "healthy",
  "orchestrator": "operational",
  "agents": { ... }
}
```

**4. Agent Status**
```
GET /api/agents/status
Response: {
  "enabled_agents": ["sales", "support"],
  "agent_details": { ... }
}
```

**5. Orchestrator Status**
```
GET /api/orchestrator/status
Response: {
  "status": "operational",
  "components": { ... },
  "enabled_agents": [ ... ],
  "routing_stats": { ... }
}
```

**6. Test Pipeline**
```
POST /api/test/pipeline?message=test
- Tests complete message flow
- Returns classification and routing info
```

**7. Reset Agent Session**
```
POST /api/agent/{agent_type}/reset/{session_id}
- Clears conversation history
- Resets agent state
```

---

## 8. Support Agent Implementation Guidelines

### 8.1 Your Responsibilities (Husnain)

You need to implement:

1. **Support Agent** (`agents/support_agent/agent.py`)
2. **Email Stream** (`input_streams/email_stream.py`)
3. **Ticket Handling** (`agents/support_agent/ticket_handler.py`)
4. **FAQ System** (`agents/support_agent/faq_handler.py`)
5. **CRM Ticket Operations** (extend `crm_integration/tickets_api.py`)

### 8.2 Support Agent Architecture

**Base Structure:**

```python
# agents/support_agent/agent.py

from agents.base_agent import BaseAgent
from .prompts import SUPPORT_AGENT_SYSTEM_PROMPT
from .ticket_handler import TicketHandler
from .faq_handler import FAQHandler

class SupportAgent(BaseAgent):
    def __init__(self):
        super().__init__("support")
        self.ticket_handler = TicketHandler()
        self.faq_handler = FAQHandler()
        # Initialize LLM client (similar to SalesAgent)
    
    def process(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process support request
        
        Steps:
        1. Classify issue type (technical/billing/general)
        2. Check FAQ for known solutions
        3. Analyze sentiment
        4. Create/update ticket in CRM
        5. Generate helpful response
        6. Determine if escalation needed
        """
        
        session_id = self.extract_session_id(message_data)
        user_message = message_data["raw_message"]
        
        # Add to conversation history
        self.add_to_conversation_history(session_id, "user", user_message)
        
        # Step 1: Classify issue
        issue_classification = self._classify_issue(user_message)
        # Returns: {
        #   "category": "technical|billing|general",
        #   "priority": "low|medium|high|urgent",
        #   "sentiment": "positive|neutral|negative"
        # }
        
        # Step 2: Check FAQ
        faq_match = self.faq_handler.find_solution(user_message)
        
        # Step 3: Create/update ticket
        ticket = self.ticket_handler.create_or_update_ticket({
            "title": self._extract_title(user_message),
            "description": user_message,
            "category": issue_classification["category"],
            "priority": issue_classification["priority"],
            "sentiment": issue_classification["sentiment"],
            # ... other fields
        })
        
        # Step 4: Generate response
        if faq_match and faq_match["confidence"] > 0.85:
            # Use FAQ answer
            response_text = self._format_faq_response(faq_match)
        else:
            # Generate custom response using LLM
            response_text = self._generate_response(
                conversation_history=self.get_conversation_history(session_id),
                issue_classification=issue_classification,
                ticket_info=ticket
            )
        
        # Step 5: Check if escalation needed
        needs_escalation = self._check_escalation_criteria(
            issue_classification,
            conversation_length=len(self.conversation_history.get(session_id, [])),
            sentiment=issue_classification["sentiment"]
        )
        
        if needs_escalation:
            self.ticket_handler.escalate_ticket(ticket["id"])
            response_text += "\n\nI've escalated this to our senior team for priority handling."
        
        # Step 6: Return response
        return self.format_response(
            message=response_text,
            success=True,
            metadata={
                "ticket_id": ticket["id"],
                "category": issue_classification["category"],
                "priority": issue_classification["priority"],
                "sentiment": issue_classification["sentiment"],
                "faq_matched": faq_match is not None,
                "escalated": needs_escalation
            },
            actions=[
                "analyzed_issue",
                "created_ticket",
                "generated_response"
            ]
        )
```

### 8.3 Key Components to Implement

#### A. Issue Classification

```python
def _classify_issue(self, message: str) -> Dict[str, Any]:
    """
    Classify support issue using LLM
    
    Categories:
    - technical: Bugs, errors, not working
    - billing: Payment, subscription, invoices
    - general: How-to, questions, info requests
    
    Priority:
    - urgent: System down, data loss, security
    - high: Feature broken, affecting workflow
    - medium: Minor issue, workaround exists
    - low: Question, enhancement request
    
    Sentiment:
    - negative: Angry, frustrated, disappointed
    - neutral: Matter-of-fact, informational
    - positive: Happy, satisfied, grateful
    """
    
    system_prompt = """You are a support ticket classifier.
    Analyze the message and classify it.
    
    Respond in JSON:
    {
        "category": "technical|billing|general",
        "priority": "urgent|high|medium|low",
        "sentiment": "negative|neutral|positive",
        "issue_type": "specific issue type",
        "keywords": ["key", "words"],
        "confidence": 0.0-1.0
    }"""
    
    # Use LLM to classify
    response = self.client.chat.completions.create(...)
    return classification
```

#### B. FAQ Handler

```python
# agents/support_agent/faq_handler.py

class FAQHandler:
    def __init__(self):
        self.faq_database = self._load_faq_database()
        # Could be from file, database, or vector store
    
    def find_solution(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Search FAQ for matching solution
        
        Methods:
        1. Keyword matching
        2. Semantic search (using embeddings)
        3. LLM-based matching
        """
        
        # Simple keyword matching
        for faq in self.faq_database:
            if self._calculate_similarity(query, faq["question"]) > 0.75:
                return {
                    "question": faq["question"],
                    "answer": faq["answer"],
                    "confidence": similarity_score,
                    "related_articles": faq.get("related_links", [])
                }
        
        return None
    
    def _load_faq_database(self) -> List[Dict]:
        """Load FAQ from file or database"""
        return [
            {
                "question": "How do I reset my password?",
                "answer": "Click 'Forgot Password' on login page...",
                "category": "account",
                "keywords": ["password", "reset", "login"]
            },
            {
                "question": "Email sync not working",
                "answer": "Check your IMAP settings...",
                "category": "technical",
                "keywords": ["email", "sync", "imap"]
            },
            # ... more FAQs
        ]
```

#### C. Ticket Handler

```python
# agents/support_agent/ticket_handler.py

from crm_integration.supabase_client import get_supabase_client

class TicketHandler:
    def __init__(self):
        self.client = get_supabase_client()
    
    def create_or_update_ticket(self, ticket_data: Dict) -> Dict:
        """
        Create new support ticket or update existing
        """
        
        # Check if open ticket exists for this user/email
        existing_ticket = self._find_open_ticket(
            email=ticket_data.get("email")
        )
        
        if existing_ticket:
            # Update existing ticket
            return self._update_ticket(existing_ticket["id"], ticket_data)
        else:
            # Create new ticket
            return self._create_ticket(ticket_data)
    
    def _create_ticket(self, ticket_data: Dict) -> Dict:
        """Create new ticket in Supabase"""
        
        ticket = {
            "title": ticket_data["title"],
            "description": ticket_data["description"],
            "status": "open",
            "priority": ticket_data["priority"],
            "category": ticket_data["category"],
            "sentiment": ticket_data.get("sentiment"),
            "classification": ticket_data.get("issue_type"),
            "source": "email",  # or "voice" or "chatbot"
            # ... other fields
        }
        
        result = self.client.table("tickets").insert(ticket).execute()
        
        # Log activity
        self._log_activity(result.data[0]["id"], "ticket_created")
        
        return result.data[0]
    
    def escalate_ticket(self, ticket_id: str):
        """Escalate ticket to manager/senior support"""
        
        self.client.table("tickets").update({
            "escalated": True,
            "priority": "urgent",  # Bump priority
            "escalated_at": datetime.now().isoformat()
        }).eq("id", ticket_id).execute()
        
        # Log activity
        self._log_activity(ticket_id, "ticket_escalated")
```

### 8.4 Email Stream Implementation

```python
# input_streams/email_stream.py

import imaplib
import email
from email.header import decode_header

class EmailStream:
    def __init__(self):
        self.imap_server = settings.IMAP_SERVER
        self.imap_port = settings.IMAP_PORT
        self.email_address = settings.EMAIL_ADDRESS
        self.email_password = settings.EMAIL_PASSWORD
    
    def connect(self):
        """Connect to email server"""
        self.imap = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
        self.imap.login(self.email_address, self.email_password)
    
    def fetch_unread_emails(self) -> List[Dict]:
        """Fetch unread emails from inbox"""
        
        self.imap.select("INBOX")
        
        # Search for unread emails
        status, messages = self.imap.search(None, "UNSEEN")
        
        emails = []
        for msg_num in messages[0].split():
            # Fetch email
            status, data = self.imap.fetch(msg_num, "(RFC822)")
            
            # Parse email
            email_message = email.message_from_bytes(data[0][1])
            
            # Extract details
            parsed_email = {
                "message_id": email_message["Message-ID"],
                "from": email_message["From"],
                "to": email_message["To"],
                "subject": self._decode_header(email_message["Subject"]),
                "body": self._extract_body(email_message),
                "date": email_message["Date"],
                "attachments": self._extract_attachments(email_message)
            }
            
            emails.append(parsed_email)
        
        return emails
    
    def process_emails(self, orchestrator, agents):
        """Process emails through Clara backend"""
        
        emails = self.fetch_unread_emails()
        
        for email_data in emails:
            # Prepare message for orchestrator
            full_message = f"Subject: {email_data['subject']}\n\n{email_data['body']}"
            
            # Process through orchestrator
            processed = orchestrator.process_message(
                raw_message=full_message,
                input_channel="email",
                user_info={
                    "email": email_data["from"],
                    "message_id": email_data["message_id"]
                }
            )
            
            # Route to agent
            response = orchestrator.route_to_agent(processed, agents)
            
            # Send email response
            self.send_email_response(
                to=email_data["from"],
                subject=f"Re: {email_data['subject']}",
                body=response["message"],
                in_reply_to=email_data["message_id"]
            )
    
    def send_email_response(self, to, subject, body, in_reply_to):
        """Send email response"""
        # Implement email sending (use smtplib)
        pass
```

---

## 9. Integration Strategy

### 9.1 How Your Support Agent Fits In

```
Email arrives → EmailStream captures
                      ↓
                Email parsed (subject + body)
                      ↓
                Sent to Orchestrator (/api/message)
                      ↓
                Classifier analyzes: "This is a support request"
                      ↓
                Router routes to: support agent
                      ↓
                YOUR SupportAgent.process() called
                      ↓
                - Classify issue (technical/billing/general)
                - Check FAQ
                - Create ticket in Supabase
                - Generate response using LLM
                - Check escalation criteria
                      ↓
                Response returned to EmailStream
                      ↓
                EmailStream sends reply email
                      ↓
                Frontend shows new ticket in UI
```

### 9.2 Shared Components

You will use the SAME components as Sales Agent:

1. **Base Agent Class**: `agents/base_agent.py`
   - Inherit from `BaseAgent`
   - Get conversation history methods
   - Format response methods

2. **Orchestrator**: Already built
   - You don't modify orchestrator
   - It will automatically route support intents to your agent

3. **CRM Integration**: `crm_integration/supabase_client.py`
   - Same Supabase client
   - Add new `tickets_api.py` for ticket operations

4. **Utilities**: `utils/`
   - Same logger, validators, formatters

### 9.3 Configuration

Add to `.env`:
```env
# Support Agent
SUPPORT_AGENT_ENABLED=true

# Email Integration
EMAIL_INPUT_ENABLED=true
IMAP_SERVER=imap.gmail.com
IMAP_PORT=993
EMAIL_ADDRESS=support@yourcompany.com
EMAIL_PASSWORD=your_app_password

# Support Agent Model
SUPPORT_AGENT_MODEL=llama-3.3-70b-versatile
```

Update `config.py`:
```python
# Enable support agent
SUPPORT_AGENT_ENABLED: bool = True

# Email settings
EMAIL_INPUT_ENABLED: bool = True
IMAP_SERVER: str = "imap.gmail.com"
# ... etc
```

### 9.4 Frontend Integration

The frontend (`trendtialcrm/`) already has pages for:
- Support tickets view
- Ticket details
- Ticket status updates

Your support agent will populate these pages automatically when it creates tickets in Supabase.

**Frontend pages you'll interact with:**
- `src/pages/TicketsPage.tsx` (might need to be created)
- `src/components/tickets/` (ticket components)

---

## 10. Critical Considerations

### 10.1 Follow Existing Patterns

**Study Sales Agent implementation** (`agents/sales_agent/`) as your template:

1. **Same structure**:
   - `agent.py` - Main logic
   - `prompts.py` - LLM prompts
   - `ticket_handler.py` - Similar to `lead_qualifier.py`
   - `faq_handler.py` - Similar to `lead_scorer.py`

2. **Same process flow**:
   - Extract session and message
   - Add to conversation history
   - Perform analysis (issue classification instead of lead qualification)
   - Generate response using LLM
   - Update CRM (tickets instead of leads)
   - Return formatted response

3. **Same response format**:
```python
return {
    "success": True,
    "agent": "support",
    "message": "response text",
    "metadata": {
        "ticket_id": "...",
        "category": "...",
        "priority": "...",
        # ...
    },
    "actions": ["created_ticket", "classified_issue"]
}
```

### 10.2 Database Compatibility

**IMPORTANT:** Your support agent must work with the existing TrendtialCRM database schema.

**Key tables:**
- `tickets` - Main support tickets
- `clients` - Customer information (shared with sales)
- `activities` - Timeline/audit log (shared)
- `users` - Agents and managers (shared)

**Field naming conventions:**
- Use `client_id` (not `customer_id`)
- Use `agent_id` (not `user_id` or `assigned_to`)
- Use `created_at`, `updated_at` (not `created_date`)

### 10.3 Error Handling

Follow same patterns as SalesAgent:

```python
try:
    # Process logic
    ...
except Exception as e:
    logger.error(f"Error in Support Agent: {e}")
    return self.format_response(
        message="I apologize, but I encountered an error. Please try again.",
        success=False,
        metadata={"error": str(e)}
    )
```

### 10.4 Logging

Use the same logger:

```python
from utils.logger import get_logger

logger = get_logger("support_agent")

logger.info("Processing support request...")
logger.debug(f"Issue classification: {classification}")
logger.error(f"Failed to create ticket: {e}")
```

### 10.5 LLM Usage

Use the same LLM configuration:

```python
from config import get_api_key, get_agent_model

# Initialize LLM client
api_key = get_api_key("groq") or get_api_key("openai")

if api_key.startswith("gsk_"):
    from groq import Groq
    self.client = Groq(api_key=api_key)
    self.model = "llama-3.3-70b-versatile"
else:
    from openai import OpenAI
    self.client = OpenAI(api_key=api_key)
    self.model = "gpt-4-turbo-preview"
```

### 10.6 Testing

Create similar test cases:

```python
# test_support_agent.py

def test_support_agent_initialization():
    agent = SupportAgent()
    assert agent.agent_type == "support"
    assert agent.ticket_handler is not None

def test_issue_classification():
    agent = SupportAgent()
    classification = agent._classify_issue("My email is not syncing")
    assert classification["category"] in ["technical", "billing", "general"]
    assert classification["priority"] in ["urgent", "high", "medium", "low"]

def test_ticket_creation():
    agent = SupportAgent()
    ticket = agent.ticket_handler.create_ticket({
        "title": "Email sync issue",
        "description": "Email not syncing since yesterday",
        "category": "technical",
        "priority": "high"
    })
    assert ticket["id"] is not None
    assert ticket["status"] == "open"

def test_complete_support_flow():
    # Test end-to-end
    message_data = {
        "raw_message": "Help! My account is locked!",
        "input_channel": "email",
        "user_info": {"email": "user@example.com"}
    }
    
    agent = SupportAgent()
    response = agent.process(message_data)
    
    assert response["success"] == True
    assert "ticket_id" in response["metadata"]
    assert len(response["message"]) > 0
```

---

## 11. Key Files You Need to Read

### Must Read (in order):

1. **`IMPLEMENTATION_PLAN.md`** - Overall architecture ✅ You've read this
2. **`clara-backend/agents/base_agent.py`** - Base class you'll inherit from
3. **`clara-backend/agents/sales_agent/agent.py`** - Reference implementation
4. **`clara-backend/orchestrator/core.py`** - How orchestrator works
5. **`clara-backend/orchestrator/classifier.py`** - How intents are classified
6. **`clara-backend/config.py`** - Configuration settings
7. **`clara-backend/main.py`** - FastAPI app structure

### Database:

8. **`clara-backend/supabase_schema_trendtial_compatible.sql`** - Database schema
9. **`clara-backend/crm_integration/supabase_client.py`** - How to connect
10. **`clara-backend/crm_integration/leads_api.py`** - Example CRM operations

### Reference:

11. **`Verbi/README.md`** - How voice integration works
12. **`trendtialcrm/README.md`** - Frontend CRM system
13. **`clara-backend/TESTING_GUIDE.md`** - How to test your agent

---

## 12. Next Steps for You (Husnain)

### Phase 1: Understanding (Now)
- ✅ Read this analysis document
- ✅ Read `IMPLEMENTATION_PLAN.md`
- ✅ Study `agents/sales_agent/agent.py` thoroughly
- ✅ Understand orchestrator flow

### Phase 2: Setup (Day 1)
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Setup `.env` with API keys
- [ ] Run test pipeline: `python test_pipeline.py`
- [ ] Verify orchestrator works

### Phase 3: Implementation (Days 2-7)

**Day 2-3: Support Agent Core**
- [ ] Create `agents/support_agent/agent.py`
- [ ] Implement `SupportAgent` class (inherit from `BaseAgent`)
- [ ] Add issue classification method
- [ ] Test basic agent initialization

**Day 4: Ticket Handling**
- [ ] Create `agents/support_agent/ticket_handler.py`
- [ ] Implement ticket CRUD operations
- [ ] Create tickets table in Supabase (if not exists)
- [ ] Test ticket creation

**Day 5: FAQ System**
- [ ] Create `agents/support_agent/faq_handler.py`
- [ ] Build FAQ database (JSON file or database)
- [ ] Implement FAQ matching logic
- [ ] Test FAQ responses

**Day 6-7: Email Integration**
- [ ] Create `input_streams/email_stream.py`
- [ ] Implement email fetching (IMAP)
- [ ] Implement email sending (SMTP)
- [ ] Test email processing flow

### Phase 4: Integration (Days 8-10)
- [ ] Connect support agent to orchestrator
- [ ] Test: Email → Orchestrator → Support Agent → CRM
- [ ] Add logging and error handling
- [ ] Create activities in timeline

### Phase 5: Testing & Polish (Days 11-14)
- [ ] Write unit tests for support agent
- [ ] Write integration tests
- [ ] Test with various support scenarios
- [ ] Fix bugs and edge cases
- [ ] Write documentation

---

## 13. Example Support Agent Prompts

### System Prompt:

```python
SUPPORT_AGENT_SYSTEM_PROMPT = """You are a professional technical support agent for [Company Name].

Your responsibilities:
1. Understand and classify customer issues
2. Provide clear, helpful solutions
3. Maintain a calm, empathetic tone
4. Create support tickets for tracking
5. Escalate critical issues when needed

Guidelines:
- Always acknowledge the customer's frustration
- Provide step-by-step solutions when possible
- Ask clarifying questions if needed
- Use simple, non-technical language
- Be patient and supportive

Available resources:
- Knowledge base / FAQ
- Troubleshooting guides
- Escalation to senior support
- Direct access to engineering team (for critical issues)

Response format:
- Acknowledge the issue
- Provide solution or next steps
- Ask if additional help needed
- Set expectations for resolution time
"""
```

### Classification Prompt:

```python
CLASSIFICATION_PROMPT = """Analyze this support request and classify it.

Categories:
- technical: Software bugs, errors, not working, broken features
- billing: Payments, subscriptions, refunds, invoices
- general: Questions, how-to, information requests, account settings

Priority:
- urgent: System completely down, data loss, security breach, VIP customer
- high: Major feature broken, significant impact on workflow, multiple users affected
- medium: Minor issue, workaround available, single user affected
- low: Question, enhancement request, cosmetic issue

Sentiment:
- negative: Frustrated, angry, disappointed, threatening to leave
- neutral: Matter-of-fact, just reporting an issue
- positive: Satisfied, grateful, providing positive feedback

Message: {user_message}

Respond with JSON containing category, priority, sentiment, and confidence.
"""
```

---

## 14. Code Quality Standards

### Follow these conventions:

1. **Type Hints**: Always use type hints
```python
def process(self, message_data: Dict[str, Any]) -> Dict[str, Any]:
```

2. **Docstrings**: Document all functions
```python
def classify_issue(self, message: str) -> Dict[str, Any]:
    """
    Classify support issue using LLM
    
    Args:
        message: Support request text
        
    Returns:
        Classification dict with category, priority, sentiment
    """
```

3. **Error Handling**: Always use try-except
```python
try:
    result = self.process_ticket(...)
except Exception as e:
    logger.error(f"Error processing ticket: {e}")
    return error_response
```

4. **Logging**: Log important events
```python
logger.info("Support agent initialized")
logger.debug(f"Classified as {category}")
logger.error(f"Failed to create ticket: {e}")
```

5. **Constants**: Use config file for constants
```python
# Don't hardcode
priority = "high"

# Use config
priority = settings.DEFAULT_PRIORITY
```

---

## 15. Communication & Collaboration

### With Team:

1. **Faheem (Sales Agent)**:
   - His agent is complete and working
   - Use his code as reference
   - Ask him about orchestrator integration
   - Test your agent doesn't interfere with his

2. **Sheryar (Marketing Agent)**:
   - He's also building his agent
   - Coordinate on orchestrator usage
   - Ensure routing works for all agents

3. **All (Orchestrator)**:
   - Don't modify orchestrator core logic
   - If you need changes, discuss with team
   - Test classification accuracy together

### Testing Together:

- Test messages that could be ambiguous:
  - "I want to cancel my subscription" → Support or Sales?
  - "Can you help me with setup?" → Support or Sales?
  - "Your product is great!" → Marketing or Sales?

- Ensure orchestrator routes correctly
- Verify CRM doesn't have conflicts

---

## 16. Success Metrics for Your Support Agent

### Performance Goals:

1. **Accuracy**: 
   - Issue classification accuracy > 90%
   - FAQ matching accuracy > 85%

2. **Speed**:
   - Response generation < 3 seconds
   - Ticket creation < 1 second

3. **Quality**:
   - Helpful responses (qualitative)
   - Escalation only when needed (<10% of tickets)
   - Proper ticket categorization

4. **Integration**:
   - 100% of emails processed
   - 100% of tickets created in CRM
   - Frontend displays tickets correctly

---

## 17. Final Checklist

Before saying "Support Agent is complete":

- [ ] Support agent initializes without errors
- [ ] Issue classification works (test with 20+ examples)
- [ ] FAQ system returns correct answers
- [ ] Tickets created in Supabase successfully
- [ ] Email stream fetches emails correctly
- [ ] Email responses sent successfully
- [ ] Frontend displays tickets
- [ ] Orchestrator routes support intents correctly
- [ ] Conversation history maintained across messages
- [ ] Escalation logic works
- [ ] Sentiment analysis works
- [ ] All tests passing
- [ ] Code follows same patterns as sales agent
- [ ] Documentation written
- [ ] Demo video recorded

---

## 18. Resources & References

### Documentation:
- **FastAPI**: https://fastapi.tiangolo.com/
- **Supabase Python**: https://supabase.com/docs/reference/python/introduction
- **Groq API**: https://console.groq.com/docs
- **OpenAI API**: https://platform.openai.com/docs

### Tools:
- **Cursor AI**: Use AI assistance for coding
- **Postman**: Test API endpoints
- **Supabase Studio**: View database
- **GitHub**: Version control

### Example Repositories:
- Look at Faheem's sales agent implementation
- Study open-source support ticket systems
- Reference LangChain documentation for agent patterns

---

## Summary

This FYP project is a **sophisticated multi-agent orchestration system** that combines:

1. **AI/LLM Intelligence**: Groq Llama 3.3 70B for understanding and generating responses
2. **Multi-Channel Input**: Voice (Faheem), Email (You), Chatbot (Sheryar)
3. **Specialized Agents**: Sales, Support, Marketing - each with domain expertise
4. **Smart Routing**: Orchestrator classifies and routes to correct agent
5. **CRM Integration**: All agents update same Supabase database
6. **Real-time Frontend**: React app displays everything instantly

**Your role (Husnain):** Build the Support Agent that handles customer support requests coming via email, classifies issues, checks FAQ, creates tickets, and provides helpful responses - all integrated professionally with the existing system.

**Key to success:**
1. Study Sales Agent implementation (it's your template)
2. Follow same patterns and conventions
3. Test thoroughly at each step
4. Coordinate with team members
5. Document everything you build

You have all the infrastructure ready (orchestrator, database, frontend). You just need to implement the support-specific logic. Good luck! 🚀

---

**Document Created:** November 29, 2025
**Created For:** Husnain (Support Agent Developer)
**Project:** Clara Multi-Agent CRM System - FYP 2025
