# Clara — AI-Powered Multi-Agent CRM System
## Final Implementation Report · FYP 1 · Group F25-388-D

**Project Title:** AI-Powered CRM with MultiAgents  
**Group:** F25-388-D  
**Institution:** NUCES FAST ISLAMABAD
**Semester:** 8  
**Report Date:** April 17, 2026  
**Status:** Active Development — Iteration 3 Complete

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Iteration 1 — Core System Foundation (November 2025)](#3-iteration-1--core-system-foundation-november-2025)
4. [Iteration 2 — Agent Intelligence & Marketing Hub (December 2025)](#4-iteration-2--agent-intelligence--marketing-hub-december-2025)
5. [Iteration 3 — Advanced Features & Integration (April 2026)](#5-iteration-3--advanced-features--integration-april-2026)
6. [Test Suite & Coverage](#6-test-suite--coverage)
7. [Cumulative Achievement Summary](#7-cumulative-achievement-summary)
8. [Technology Stack](#8-technology-stack)
9. [Running the System](#9-running-the-system)

---

## 1. Project Overview

AI-Ensemble is a production-grade, AI-powered multi-agent CRM automation system built to replace manual sales, marketing, and support workflows. It intelligently routes incoming customer conversations to specialized AI agents — Sales, Marketing, and Support — each powered by large language models and connected to a live Supabase (PostgreSQL) backend.

### Core Philosophy

- **Conversational-first:** All interactions happen through natural language — voice or text
- **Agent specialization:** Each business domain (sales, marketing, support) has its own dedicated AI agent
- **Full CRM integration:** Every agent action is persisted to Supabase in real-time
- **Local-first AI where possible:** RoBERTa, Sentence Transformers, Piper TTS, and MeloTTS run on-device

### Team Responsibilities

| Member | Primary Responsibility |
|---|---|
| Faheem | Orchestrator · Sales Agent · Voice Integration · CRM Backend · Test Suite |
| Husnain | Support Agent · Ticket System · RAG Knowledge Base · Email Ingestion |
| Sheryar | Marketing Agent · Content Generation · Campaign Automation · React Frontend |

---

## 2. System Architecture

### 2.1 High-Level Flow

```
Voice / Text Input
       │
       ▼
┌──────────────────────────────────┐
│         Orchestrator             │
│  ┌─────────────────────────┐    │
│  │  Message Parser          │    │
│  │  Intent Classifier       │    │  ← Groq LLM + Rule-based fallback
│  │  Agent Router            │    │
│  └─────────────────────────┘    │
└──────┬──────────┬──────────┬────┘
       │          │          │
       ▼          ▼          ▼
 Sales Agent  Support     Marketing
              Agent       Agent
       │          │          │
       └──────────┴──────────┘
                  │
                  ▼
          Supabase CRM
    (Leads · Tickets · Calls ·
     Meetings · Follow-ups · KB)
                  │
                  ▼
     TrendtialCRM Frontend
         (React / TypeScript)
```

### 2.2 Repository Structure

```
Clara/
├── clara-backend/               ← Python FastAPI backend (primary)
│   ├── orchestrator/            ← Message routing & classification
│   ├── agents/
│   │   ├── sales_agent/         ← BANT qualification, lead scoring, CRM
│   │   ├── support_agent/       ← Ticket CRUD, RAG KB, RoBERTa
│   │   └── marketing_agent/     ← Content gen, campaign mgmt, email
│   ├── crm_integration/         ← Supabase API wrappers
│   ├── input_streams/           ← Voice STT/TTS pipeline
│   ├── routes/                  ← FastAPI route handlers
│   ├── services/                ← Voice call service
│   ├── tests/                   ← 222-test automated suite
│   ├── main.py                  ← Primary app (port 8001)
│   └── main_husnain.py          ← Support app (shared port)
│
├── Verbi/                       ← Voice assistant framework
│   ├── piper_server.py          ← Piper TTS HTTP server
│   └── voice_assistant/         ← STT, TTS, config modules
│
└── trendtialcrm/                ← React/TypeScript CRM frontend
    └── src/
        ├── components/
        │   ├── SalesAgent.tsx
        │   ├── SupportChatbox.tsx
        │   ├── MarketingChatbox.tsx
        │   └── ...
        └── pages/
```

---

## 3. Iteration 1 — Core System Foundation (November 2025)

**Period:** November 2025  
**Lead:** Faheem  
**Status:** Complete

### 3.1 Orchestrator Implementation

The central routing intelligence of the system. All incoming messages pass through the orchestrator before being dispatched to an agent.

**Files created:**

| File | Purpose | Lines |
|---|---|---|
| `orchestrator/core.py` | Main orchestrator logic | ~250 |
| `orchestrator/classifier.py` | Dual-mode intent classification | ~224 |
| `orchestrator/router.py` | Priority-based agent routing | ~180 |
| `orchestrator/message_parser.py` | Message sanitization & entity extraction | ~200 |

**Classification pipeline:**

The classifier runs in two modes:
1. **Rule-based (fast path):** Keyword matching against 50+ domain signals for each intent category
2. **LLM fallback:** Groq `llama-3.3-70b-versatile` invoked when rule-based confidence falls below threshold

Intent categories: `sales` · `support` · `marketing`

**Key capabilities:**
- Confidence scoring (0.0–1.0) for every classification
- Entity extraction: company name, industry, budget signals, urgency level
- Conversation context preservation across multi-turn sessions
- Priority assignment (P1/P2/P3) based on urgency signals

### 3.2 Sales Agent — Core (Faheem)

**Files created:**

| File | Purpose | Lines |
|---|---|---|
| `agents/sales_agent/agent.py` | Main agent logic | 517 |
| `agents/sales_agent/lead_qualifier.py` | BANT framework qualification | ~310 |
| `agents/sales_agent/lead_scorer.py` | 0–100 lead scoring algorithm | ~370 |
| `agents/sales_agent/crm_connector.py` | CRM operations bridge | 821 |
| `agents/sales_agent/prompts.py` | LLM prompt templates | ~200 |

**BANT Framework implementation:**

| BANT Dimension | Values Tracked | Points (0–30) |
|---|---|---|
| Budget | high / medium / low / unknown | 0–10 |
| Authority | yes / no / unknown | 0–8 |
| Need | urgent / high / medium / low / unknown | 0–8 |
| Timeline | immediate / this_week / this_month / this_quarter / future | 0–4 |

**Lead scoring breakdown (0–100 total):**

| Dimension | Max Points |
|---|---|
| Company fit (size, industry) | 25 |
| Engagement level (turns, responses) | 25 |
| BANT qualification score | 30 |
| Intent signals (buying language) | 20 |

**Stage progression:** Unqualified → Marketing Qualified → Sales Qualified → Opportunity (P3 → P2 → P1)

### 3.3 Voice Integration (Faheem)

**File:** `input_streams/voice_stream.py` (~500 lines)

Full duplex voice pipeline with support for multiple STT/TTS providers:

| Layer | Providers Supported |
|---|---|
| STT (Speech-to-Text) | Groq Whisper · OpenAI Whisper · Deepgram |
| TTS (Text-to-Speech) | Piper (local) · MeloTTS (local) · OpenAI TTS · Deepgram Aura |

**Verbi framework** (`Verbi/`) provides:
- Voice Activity Detection (VAD)
- Interruption handling during playback
- Piper TTS HTTP server (`piper_server.py` on port 5000)

### 3.4 CRM Integration — Foundation (Faheem)

**Files created:**

| File | Purpose |
|---|---|
| `crm_integration/supabase_client.py` | Supabase connection, auth, health check |
| `crm_integration/leads_api.py` | Full lead CRUD, stage movement, scoring |
| `crm_integration/users_api.py` | Agent user management, Clara AI agent identity |
| `crm_integration/calls_api.py` | Call lifecycle: create → start → transcript → end |
| `crm_integration/follow_ups_api.py` | Follow-up creation, listing, completion |
| `crm_integration/meetings_api.py` | Meeting creation, status, scheduling |

**Database tables integrated:** `leads` · `clients` · `calls` · `users` · `follow_ups` · `meetings` · `lead_activities`

### 3.5 API Server

`main.py` — FastAPI application on port 8001 with:
- `/api/message` — Primary conversation endpoint
- `/health` — System health with agent status
- `/api/agents/status` — Per-agent operational status
- `/api/orchestrator/status` — Classifier and router status
- `/api/sales/calls/*` — Full voice call API (12 endpoints)
- CORS configured for the React frontend

---

## 4. Iteration 2 — Agent Intelligence & Marketing Hub (December 2025)

**Period:** December 2025  
**Lead:** Husnain (Support) · Sheryar (Marketing)  
**Status:** Complete

### 4.1 Support Agent — Ticket System (Husnain)

#### 4.1.1 Phase 1 — Ticket Foundation

A dedicated FastAPI application (`main_husnain.py`) serving all support endpoints.

**Core ticket CRUD:**
- `POST /api/tickets` — Create ticket with auto-classification
- `GET /api/tickets` — List with filters (status, category, priority)
- `GET /api/tickets/{id}` — Retrieve with customer info
- `PATCH /api/tickets/{id}` — Update status, priority, resolution
- `DELETE /api/tickets/{id}` — Remove ticket
- `GET /api/tickets/stats` — Aggregate statistics

**Database tables:** `tickets` · `customers` · `ticket_history` · `ticket_messages`

#### 4.1.2 Phase 2A — RoBERTa Ticket Classification (Husnain)

Every new ticket is automatically classified by a fine-tuned RoBERTa model before it is saved.

**Training pipeline:**

| Component | Detail |
|---|---|
| Base model | `roberta-base` (HuggingFace) |
| Training data | 50 base examples → ~275 augmented samples |
| Categories | `account` · `billing` · `technical` · `product` · `general` |
| Augmentation | 5× prefix injection: "Customer:", "User report:", "Issue:", "Ticket:", bare text |
| Training epochs | Up to 10, early stop on validation loss |
| Final accuracy | ~100% on augmented validation set |
| Hardware | PyTorch · CUDA (RTX 4050 if available, else CPU) |

**Priority auto-assignment:**

```
billing / technical → high
account             → normal
product             → low
general             → normal (default)
```

**Files:**
- `agents/support_agent/train_roberta_classifier.py` — Training script
- `agents/support_agent/roberta_classifier.py` — Inference helper
- `models/roberta_ticket_category/` — Saved weights + tokenizer + label map

#### 4.1.3 Phase 2B — RAG Knowledge Base (Husnain)

A Retrieval-Augmented Generation pipeline that answers support tickets using a seeded FAQ knowledge base.

**Knowledge base construction:**

| Step | Component | Detail |
|---|---|---|
| 1 | Seed articles | `seed_kb_faqs.py` — ~42 FAQ articles inserted into `kb_articles` |
| 2 | Chunking | `build_kb_index.py` — Split each article into ≤600-char chunks |
| 3 | Embedding | `sentence-transformers/all-MiniLM-L12-v2` (384-dim vectors) |
| 4 | Storage | `kb_chunks` + `kb_embeddings` tables in Supabase |

**RAG pipeline flow:**
```
Ticket ID → Retrieve ticket subject + description
          → search_kb(question, top_k=5)  [cosine similarity on embeddings]
          → call_llama_knowledge_answer(question, top_5_chunks)
          → POST /api/tickets/{id}/answer → {answer, sources, confidence}
```

**LLM:** Llama 3.1 8B via Ollama (`localhost:11434`) — fully local, free, private

**Auto-resolution logic:**
- KB similarity score ≥ 0.85 → ticket marked `resolved`, `needs_human_review = false`
- Score < 0.85 → `needs_human_review = true`, enters escalation queue

#### 4.1.4 Phase 3 — Email Ingestion & Escalation Queue (Husnain)

**Email ingestion:** `POST /api/tickets/email_ingest`
- Converts raw email (from, subject, body) into a support ticket
- Runs the same RoBERTa classification and priority derivation
- Returns a full `TicketResponse` with assigned `id`

**Escalation queue:** `GET /api/tickets/escalated`
- Returns all tickets where `needs_human_review = true`
- Ordered by creation time (newest first)
- Gives support agents a live queue of AI-flagged tickets

**Knowledge base endpoints:**
- `GET /api/kb/articles` — List articles with optional limit/filter
- `GET /api/kb/articles/{id}` — Retrieve single article
- `GET /api/kb/categories` — All categories
- `GET /api/kb/search?q=` — Semantic search (cosine similarity)
- `GET /api/kb/stats` — Article count, category breakdown

### 4.2 Marketing Hub — AI Content Engine (Sheryar)

#### 4.2.1 Backend Modules

Three specialized Python modules powering all marketing AI:

**Campaign Manager** (`agents/marketing_agent/campaign_manager.py`):
- `generate_campaign_ideas()` — 3 campaign concepts with channels, ROI, metrics
- `optimize_campaign()` — Performance analysis with 3–5 recommendations
- `generate_campaign_content()` — Headlines, body copy, CTAs, A/B variants
- `analyze_campaign_performance()` — Scoring and insight extraction

**Email Campaign Manager** (`agents/marketing_agent/email_campaign_manager.py`):
- `generate_subject_lines()` — 5 subject lines with power words per audience
- `generate_email_content()` — Full email: greeting, body, CTA, closing signature
- `create_email_sequence()` — 3–7 email nurture sequences with send-day offsets
- `optimize_send_time()` — Best day/time by industry segment
- `analyze_email_performance()` — Open rate + CTR analysis with recommendations
- `generate_ab_test_variants()` — Subject line A/B variants

**Social Media Manager** (`agents/marketing_agent/social_media_manager.py`):
- `generate_social_post()` — Platform-adapted content for Facebook, LinkedIn, Twitter, TikTok, Instagram
- `generate_hashtags()` — Relevant hashtag research respecting platform limits
- `create_content_calendar()` — 7–30 day posting schedule
- `optimize_posting_schedule()` — Peak engagement times by platform × industry
- `analyze_post_performance()` — Engagement rate analysis
- `generate_caption_variations()` — A/B caption variants

**Platform specifications enforced:**

| Platform | Char Limit | Hashtag Limit | Tone |
|---|---|---|---|
| Facebook | 250 optimal | 30 max | Friendly |
| Twitter/X | 250 optimal | 2 max | Concise |
| LinkedIn | 150 optimal | 5 max | Professional |
| Instagram | 150 optimal | 30 max | Visual |
| TikTok | 150 optimal | 5 max | Casual |

**LLM:** Ollama `llama3.1` — local, zero API cost, GDPR-compliant

#### 4.2.2 Marketing API Endpoints (Sheryar)

**Campaign endpoints:**
- `POST /api/marketing/campaigns/ideas` — AI campaign ideation
- `POST /api/marketing/campaigns/optimize` — Campaign optimization

**Email endpoints:**
- `POST /api/marketing/email/subject-lines` — Subject line generation
- `POST /api/marketing/email/content` — Full email generation
- `POST /api/marketing/email/sequence` — Nurture sequence creation

**Social media endpoints:**
- `POST /api/marketing/social/post` — Platform-specific post
- `POST /api/marketing/social/hashtags` — Hashtag generation
- `POST /api/marketing/social/calendar` — Content calendar

**Lead analytics endpoints:**
- `POST /api/marketing/analyze-lead` — Individual lead analysis
- `POST /api/marketing/analyze-batch` — Batch lead analysis by stage
- `GET /api/marketing/lead-temperature/{id}` — Hot/warm/cold classification
- `GET /api/marketing/leads-by-temperature` — Leads grouped by temperature
- `GET /api/marketing/leads-by-stage/{stage}` — Leads by pipeline stage (P1/P2/P3)
- `GET /api/marketing/campaign-insights` — Aggregate campaign intelligence
- `POST /api/marketing/generate-email` — Personalized email for a lead
- `POST /api/marketing/generate-sms` — SMS content for a lead
- `POST /api/marketing/generate-call-script` — Sales call script
- `POST /api/marketing/generate-ad-copy` — Platform-specific ad copy
- `GET /api/marketing/sequences` — Available nurturing sequences
- `GET /api/marketing/nurturing-sequence/{id}` — Sequence for a specific lead
- `GET /api/marketing/next-action/{id}` — AI-recommended next action

#### 4.2.3 Marketing Agent Chatbot (Sheryar)

The `agents/marketing_agent/agent.py` implements a conversational marketing intelligence agent:
- Analyzes campaign performance from natural language descriptions
- Generates content recommendations inline in chat
- Provides A/B testing suggestions
- Routes complex requests to appropriate sub-modules
- Maintains session context across multi-turn marketing conversations

---

## 5. Iteration 3 — Advanced Features & Integration (April 2026)

**Period:** April 2026  
**Status:** Complete  
**Focus:** Voice-enabled chatboxes · Sales automation · Notification system · Email delivery

This iteration represents the culmination of FYP 1. The team implemented four major cross-cutting features that transform AI-Ensemble from a backend AI pipeline into a fully integrated, production-like CRM experience.

---

### 5.1 Voice Commands for Marketing & Support Agent Chatboxes (Sheryar + Faheem)

**What was built:** Both the Marketing and Support chatbox components in the React frontend now support real-time voice input, enabling users to speak directly into the CRM interface rather than type.

#### 5.1.1 Implementation Overview

Voice input is captured directly in the browser using the Web Speech API (`SpeechRecognition`) and processed through the existing Verbi/Piper TTS backend pipeline.

**Components modified:**

| Component | File | Change |
|---|---|---|
| Marketing Chatbox | `trendtialcrm/src/components/MarketingChatbox.tsx` | Voice input button, transcript display, STT integration |
| Support Chatbox | `trendtialcrm/src/components/SupportChatbox.tsx` | Voice input button, live transcript, send-on-silence |
| Voice Hook | `trendtialcrm/src/hooks/useVoiceInput.ts` | Reusable React hook for voice capture |

**User experience flow:**
```
User clicks mic button
        ↓
Browser SpeechRecognition activates
        ↓
Live transcript shown in input field as user speaks
        ↓
Silence detected (or stop button pressed)
        ↓
Transcript auto-submitted to /api/message or /api/tickets
        ↓
Agent response displayed in chat + optionally spoken via Piper TTS
```

#### 5.1.2 Technical Details

**Frontend voice hook (`useVoiceInput.ts`):**
- Manages `SpeechRecognition` lifecycle (start / stop / error)
- Provides `isListening`, `transcript`, `startListening`, `stopListening` state
- Handles browser compatibility (Chrome/Edge supported, graceful degradation)
- Triggers callback on final transcript receipt

**Marketing Chatbox integration:**
- Floating mic button with animated pulse indicator during recording
- Real-time transcript preview in the message input field
- Automatic message dispatch on silence detection (1.5s threshold)
- Visual feedback: mic icon color change (blue → red when active)
- TTS playback of marketing agent responses using Piper server

**Support Chatbox integration:**
- Same mic button UX with distinct visual treatment
- Voice input transcribed and submitted as a ticket message
- Agent's RAG-generated answer optionally played back via TTS
- Transcript logged to ticket message history in Supabase

**Backend endpoints consumed:**
- `POST /api/message` (marketing routing)
- `POST /api/tickets/{id}/messages` (support ticket messages)
- `POST http://localhost:5000/synthesize/` (Piper TTS for playback)

---

### 5.2 Manual Follow-up Management System (Faheem)

**What was built:** A comprehensive, full-featured follow-up management module integrated into TrendtialCRM that gives sales agents granular, human-controlled visibility and control over every follow-up in the pipeline. The system covers follow-up creation, scheduling, filtering, outcome logging, overdue detection, and real-time activity tracking — all driven by the sales agent's judgment rather than blind automation.

#### 5.2.1 Design Rationale

Sales follow-ups are high-stakes, context-sensitive actions. An AI agent can suggest that a follow-up is needed, but the right timing, channel, and tone depend on the relationship history that only the sales agent knows. Rather than blindly auto-scheduling records that may be wrong or intrusive, Clara surfaces AI-enriched lead context and empowers the agent to make an informed follow-up decision in seconds. The result is a system that combines AI intelligence with human control — the most reliable approach in a production CRM environment.

#### 5.2.2 Frontend — Follow-up Management UI

**Files created:**
- `trendtialcrm/src/pages/FollowUpsPage.tsx` — Dedicated full-page follow-up management view
- `trendtialcrm/src/components/FollowUps.tsx` — Reusable follow-up list component (embedded in lead detail views)
- `trendtialcrm/src/components/FollowUpForm.tsx` — Controlled form for creating and editing follow-ups

**Follow-up creation form fields:**

| Field | Type | Description |
|---|---|---|
| Lead | Searchable dropdown | Link follow-up to a specific lead (with live CRM search) |
| Type | Select | `Call` · `Email` · `Meeting` · `Demo` · `Other` |
| Due Date | Date + time picker | When the follow-up must be actioned |
| Priority | Select | `High` · `Normal` · `Low` |
| Notes | Textarea | Context for what needs to be discussed |
| Assigned Agent | Select | Defaults to logged-in user; reassignable |

**Follow-up list view features:**
- Color-coded status badges for instant visual scanning:
  - **Green** — Completed
  - **Blue** — Pending (future date)
  - **Amber** — Due Today
  - **Red** — Overdue (past due date, not completed)
- Sortable columns: Due Date, Lead Name, Priority, Type, Status
- Filter bar: filter by Status, Type, Priority, Assigned Agent, Date Range
- Paginated table (25 rows per page) with total count header
- Inline quick-action buttons on each row (no page navigation required):
  - **Mark Complete** — Opens outcome notes dialog; sets status to `completed`
  - **Reschedule** — Opens date picker inline; updates `follow_up_date`
  - **Add Note** — Appends a timestamped note without changing status
  - **Edit** — Opens full edit form in a slide-over panel
  - **Delete** — Soft delete with confirmation dialog

**Follow-up detail panel:**
- Accessible by clicking any row; slides in from the right without leaving the page
- Shows full follow-up metadata, complete edit form, and a timestamped change history log
- Related lead card embedded at the top: lead score, BANT summary, last interaction date
- Outcome logging: when marking complete, agent selects outcome (`Interested` · `Not Interested` · `Needs More Time` · `Demo Booked` · `Converted`) and adds free-text notes

#### 5.2.3 Backend — Follow-up API

**Files modified:**
- `crm_integration/follow_ups_api.py` — Full follow-up CRUD with filtering and overdue logic
- `routes/follow_ups.py` — FastAPI route handlers

**API methods in `follow_ups_api.py`:**

```python
def create_follow_up(
    lead_id: str,
    agent_id: str,
    follow_up_date: str,     # ISO-8601 datetime
    follow_up_type: str,     # call | email | meeting | demo | other
    notes: str,
    priority: str = "normal" # high | normal | low
) -> dict:
    """Create a new manual follow-up and log the creation to lead_activities."""

def list_follow_ups(
    status: Optional[str] = None,       # pending | completed | overdue
    agent_id: Optional[str] = None,
    lead_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    follow_up_type: Optional[str] = None,
    limit: int = 25,
    offset: int = 0,
) -> List[dict]:
    """Return paginated follow-ups matching the given filters."""

def update_follow_up(
    follow_up_id: str,
    fields: dict   # any subset of: follow_up_date, notes, type, priority, assigned_agent_id
) -> dict:
    """Update an existing follow-up record. Logs change to lead_activities."""

def complete_follow_up(
    follow_up_id: str,
    outcome: str,       # interested | not_interested | needs_more_time | demo_booked | converted
    outcome_notes: str
) -> dict:
    """Mark a follow-up as completed. Writes full outcome to lead_activities."""

def get_overdue_follow_ups(agent_id: Optional[str] = None) -> List[dict]:
    """
    Returns all follow-ups where follow_up_date < now() AND status != 'completed'.
    Used by the notification panel to surface urgent items.
    """

def get_lead_follow_ups(lead_id: str) -> List[dict]:
    """All follow-ups for a specific lead, ordered by due date ascending."""

def delete_follow_up(follow_up_id: str) -> bool:
    """Soft-delete: sets deleted_at timestamp, excludes from normal list queries."""
```

**REST endpoints (FastAPI):**

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/follow-ups` | Create a new follow-up |
| `GET` | `/api/follow-ups` | List with filters (status, agent, lead, date range) |
| `GET` | `/api/follow-ups/overdue` | All overdue follow-ups across the team |
| `GET` | `/api/follow-ups/{id}` | Retrieve a single follow-up with full detail |
| `PATCH` | `/api/follow-ups/{id}` | Update fields (reschedule, edit notes, reassign) |
| `POST` | `/api/follow-ups/{id}/complete` | Mark complete with outcome |
| `DELETE` | `/api/follow-ups/{id}` | Soft-delete |
| `GET` | `/api/leads/{id}/follow-ups` | All follow-ups for a specific lead |

#### 5.2.4 Activity Log Integration

Every follow-up action is written to the `lead_activities` table, creating a permanent, auditable trail:

| Action | Activity Type | Description Written |
|---|---|---|
| Follow-up created | `follow_up_created` | `"Follow-up scheduled for [date] — Type: Call, Priority: High"` |
| Follow-up completed | `follow_up_completed` | `"Follow-up completed — Outcome: Demo Booked. Notes: [agent notes]"` |
| Follow-up rescheduled | `follow_up_rescheduled` | `"Follow-up rescheduled from [old date] to [new date]"` |
| Note added | `follow_up_note` | `"Note added to follow-up: [note text]"` |
| Follow-up deleted | `follow_up_deleted` | `"Follow-up removed by [agent name]"` |

This means a sales agent reviewing any lead's timeline can see the complete follow-up history — what was planned, when it was actioned, and what the outcome was — without switching views.

#### 5.2.5 Overdue Detection & Notification Integration

The overdue detection runs in two places:
1. **Backend query:** `GET /api/follow-ups/overdue` performs a Supabase query: `follow_up_date < now() AND status != 'completed'` — executed on-demand or by the notification hook
2. **Frontend notification hook:** `useNotifications.ts` polls this endpoint every 60 seconds and surfaces overdue follow-ups as red notification cards in the notification panel (Section 5.3)

The combination of the manual follow-up workflow and real-time overdue notifications ensures no follow-up slips through unnoticed, regardless of how busy the sales pipeline is.

---

### 5.3 Manual Meeting Scheduling & Notification System in Sales Agent (Faheem)

**What was built:** A full manual meeting scheduling module within TrendtialCRM that gives sales agents complete control over creating, viewing, editing, and completing meetings against any lead. Alongside this, a real-time notification panel surfaces upcoming meetings and overdue follow-ups without the agent needing to check separate pages.

#### 5.3.1 Design Rationale

Meeting scheduling is one of the most relationship-sensitive activities in a sales process. The right meeting time, format (demo, discovery, check-in), and agenda depend on context that only the sales agent holds — previous conversations, the lead's availability signals, and the stage of negotiation. Rather than having the system blindly create meeting records based on lead score thresholds, Clara provides a frictionless manual scheduling interface that puts the agent in full control, backed by AI-enriched lead context to inform the decision.

#### 5.3.2 Frontend — Meeting Management UI

**Files created:**
- `trendtialcrm/src/pages/MeetingsPage.tsx` — Dedicated full-page meetings management view
- `trendtialcrm/src/components/MeetingForm.tsx` — Controlled form for creating and editing meetings
- `trendtialcrm/src/components/MeetingCard.tsx` — Meeting summary card used in lead detail view
- `trendtialcrm/src/components/MeetingsList.tsx` — Filterable meeting list component

**Meeting creation form fields:**

| Field | Type | Description |
|---|---|---|
| Lead | Searchable dropdown | Associate meeting with a lead (live CRM search) |
| Title | Text input | Meeting name (e.g. "Demo — GlobalTech") |
| Type | Select | `Discovery Call` · `Product Demo` · `Check-in` · `Proposal Review` · `Closing` |
| Start Date & Time | Date + time picker | When the meeting begins |
| Duration | Select | 15 / 30 / 45 / 60 / 90 minutes |
| Location / Link | Text input | Physical address or virtual meeting link |
| Attendees | Tag input | Email addresses of participants |
| Agenda | Textarea | Meeting objectives and talking points |
| Assigned Agent | Select | Defaults to logged-in user |

**Meeting list view features:**
- Sortable columns: Date, Lead Name, Type, Status, Duration
- Color-coded status badges:
  - **Blue** — Scheduled (upcoming)
  - **Green** — Completed
  - **Red** — Cancelled or no-show
  - **Amber** — Rescheduled
- Filter bar: Type, Status, Assigned Agent, Date Range
- Inline quick-actions on each row:
  - **Mark Complete** — Opens outcome dialog with notes field and result (Positive / Neutral / Negative / No Show)
  - **Reschedule** — Opens date/time picker inline; updates start time in Supabase
  - **Cancel** — Marks meeting as cancelled with optional reason
  - **Edit** — Opens full edit form in slide-over panel
- Calendar view toggle: switch between list and a weekly calendar grid

**Lead detail integration:**
- All meetings for a lead visible in the lead's detail sidebar under "Meetings" tab
- "Schedule Meeting" shortcut button available on the lead card and quick-view panel (Section 5.5)
- Meeting history included in the lead's activity timeline

#### 5.3.3 Backend — Meetings API

**Files modified:**
- `crm_integration/meetings_api.py` — Full meeting CRUD with filtering and outcome logic
- `routes/meetings.py` — FastAPI route handlers

**API methods in `meetings_api.py`:**

```python
def create_meeting(
    lead_id: str,
    agent_id: str,
    title: str,
    meeting_type: str,         # discovery | demo | check_in | proposal | closing
    start_time: str,           # ISO-8601 datetime
    duration_minutes: int,
    location: Optional[str],
    attendees: List[str],
    agenda: Optional[str]
) -> dict:
    """Create a meeting record and log creation to lead_activities."""

def list_meetings(
    status: Optional[str] = None,     # scheduled | completed | cancelled | rescheduled
    agent_id: Optional[str] = None,
    lead_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    meeting_type: Optional[str] = None,
    limit: int = 25,
    offset: int = 0,
) -> List[dict]:
    """Return paginated meetings matching the given filters."""

def update_meeting(meeting_id: str, fields: dict) -> dict:
    """Update meeting fields (reschedule, edit agenda, change type). Logs to lead_activities."""

def complete_meeting(
    meeting_id: str,
    outcome: str,         # positive | neutral | negative | no_show
    outcome_notes: str
) -> dict:
    """Mark meeting as completed. Writes outcome to lead_activities."""

def cancel_meeting(meeting_id: str, reason: Optional[str]) -> dict:
    """Cancel a meeting. Logs cancellation to lead_activities."""

def get_upcoming_meetings(agent_id: str, hours_ahead: int = 24) -> List[dict]:
    """
    Returns meetings starting within the next `hours_ahead` hours for the agent.
    Used by the notification hook to surface upcoming meeting alerts.
    """

def get_lead_meetings(lead_id: str) -> List[dict]:
    """All meetings for a specific lead, ordered by start_time descending."""
```

**REST endpoints (FastAPI):**

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/meetings` | Create a new meeting |
| `GET` | `/api/meetings` | List with filters (status, agent, lead, date range) |
| `GET` | `/api/meetings/upcoming` | Meetings within the next 24 hours for the active agent |
| `GET` | `/api/meetings/{id}` | Retrieve a single meeting with full detail |
| `PATCH` | `/api/meetings/{id}` | Update fields (reschedule, edit agenda, change attendees) |
| `POST` | `/api/meetings/{id}/complete` | Mark complete with outcome and notes |
| `POST` | `/api/meetings/{id}/cancel` | Cancel with optional reason |
| `GET` | `/api/leads/{id}/meetings` | All meetings for a specific lead |

#### 5.3.4 Activity Log Integration

Every meeting action is written to `lead_activities`:

| Action | Activity Type | Description Written |
|---|---|---|
| Meeting created | `meeting_created` | `"Meeting scheduled: 'Demo — GlobalTech' on [date] at [time]"` |
| Meeting completed | `meeting_completed` | `"Meeting completed — Outcome: Positive. Notes: [agent notes]"` |
| Meeting rescheduled | `meeting_rescheduled` | `"Meeting rescheduled from [old time] to [new time]"` |
| Meeting cancelled | `meeting_cancelled` | `"Meeting cancelled — Reason: Lead requested postponement"` |

#### 5.3.5 Notification System in the Frontend

**Files modified/created:**
- `trendtialcrm/src/components/SalesAgent.tsx` — Notification panel integrated
- `trendtialcrm/src/hooks/useNotifications.ts` — Notification data hook (polls both meetings and follow-ups)
- `trendtialcrm/src/components/NotificationBadge.tsx` — Badge counter + notification drawer component

**Notification hook (`useNotifications.ts`):**

Polls two backend endpoints every 60 seconds:
1. `GET /api/meetings/upcoming` — Meetings starting within the next 24 hours for the active agent
2. `GET /api/follow-ups/overdue` — All overdue follow-ups for the active agent

**Notification types surfaced in the UI:**

| Notification Type | Trigger | Display |
|---|---|---|
| Meeting Today | Meeting start time within 24 hours | Blue card with meeting title, lead name, and start time |
| Meeting Starting Soon | Meeting start time within 30 minutes | Pulsing blue card with countdown |
| Follow-up Due Today | Follow-up date = today | Amber card with lead name and follow-up notes |
| Follow-up Overdue | Follow-up date < today | Red card with days-overdue indicator |
| Meeting Outcome Needed | Completed meeting with no outcome logged | Grey card prompting agent to log result |

**UI panel layout:**
- Collapsible notification drawer on the right side of the Sales Agent dashboard
- Unread badge counter on the Sales Agent nav item (clears when drawer is opened)
- Each card is actionable: click opens the relevant meeting or follow-up record directly
- Dismiss button per notification (persisted in localStorage for the session)
- "Mark all read" bulk action at the top of the drawer

**Integration with Supabase Realtime:**
- Supabase `on('postgres_changes')` subscription on `meetings` and `follow_ups` tables
- When a colleague creates a meeting or follow-up for a shared lead, the notification surfaces without a page refresh

---

### 5.4 Email Sending in Marketing Agent (Sheryar)

**What was built:** The Marketing Agent now sends real transactional emails to leads directly from the CRM, using the content it generates. Emails are dispatched via SMTP (configurable) and logged in the Supabase `lead_activities` table for full auditability.

#### 5.4.1 Problem Addressed

Previously, the Marketing Agent could generate high-quality, personalized email content (subject lines, body copy, CTAs) but the output was displayed in the UI only — no actual email was ever sent. Marketers had to manually copy-paste the generated content into an email client. This iteration closes that loop completely.

#### 5.4.2 Email Service Implementation

**Files created/modified:**
- `agents/marketing_agent/email_service.py` — New SMTP email dispatch module
- `agents/marketing_agent/agent.py` — Email send integration
- `routes/marketing.py` — New send endpoint
- `config.py` — SMTP configuration settings

**Email service (`email_service.py`):**

```python
class EmailService:
    """Handles actual email dispatch via SMTP."""

    def send_lead_email(
        self,
        lead_email: str,
        lead_name: str,
        subject: str,
        html_body: str,
        plain_body: str,
        campaign_id: Optional[str] = None,
    ) -> dict:
        """
        Send a personalized email to a lead.
        Returns: {success, message_id, sent_at, error}
        """

    def send_campaign_batch(
        self,
        leads: List[dict],
        subject_template: str,
        body_template: str,
        campaign_name: str,
    ) -> dict:
        """
        Send personalized emails to a batch of leads.
        Returns: {sent, failed, total, campaign_id}
        """
```

**SMTP configuration (`.env`):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=clara-crm@yourdomain.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=Clara CRM
```

**Supported providers:** Gmail SMTP · SendGrid · Amazon SES · Mailgun (configured via env vars)

#### 5.4.3 New API Endpoints

**`POST /api/marketing/send-email`** — Send a single personalized email to a lead:
```json
Request:
{
  "lead_id": "uuid",
  "subject": "Ready to transform your CRM?",
  "body": "Hi {{name}}, based on your interest in...",
  "campaign_id": "optional-uuid"
}

Response:
{
  "success": true,
  "message_id": "smtp-msg-id",
  "sent_at": "2026-04-17T10:30:00Z",
  "lead_email": "prospect@company.com"
}
```

**`POST /api/marketing/send-campaign-batch`** — Send to multiple leads:
```json
Request:
{
  "stage": "P2",
  "temperature": "warm",
  "subject_template": "Exclusive offer for {{company}}",
  "campaign_name": "April Warm Lead Campaign",
  "limit": 50
}

Response:
{
  "sent": 47,
  "failed": 3,
  "total": 50,
  "campaign_id": "uuid",
  "started_at": "2026-04-17T10:00:00Z"
}
```

**`GET /api/marketing/email-history/{lead_id}`** — Retrieve email history for a lead:
- Returns all emails sent, with timestamps, subjects, and open/click tracking status

#### 5.4.4 Activity Logging

Every sent email is recorded in the `lead_activities` table:

```json
{
  "lead_id": "uuid",
  "activity_type": "email_sent",
  "subject": "Email subject line",
  "description": "Marketing email sent: 'Subject here'",
  "metadata": {
    "message_id": "smtp-id",
    "campaign_id": "uuid",
    "sent_at": "ISO timestamp",
    "template": "warm_lead_nurture"
  }
}
```

This means every email is fully visible in the lead timeline within TrendtialCRM, giving sales agents a complete view of all marketing touchpoints.

#### 5.4.5 End-to-End Marketing Email Flow

```
Marketing Agent Chat: "Send a follow-up email to all warm leads about our April offer"
                ↓
Marketing Agent (agent.py) extracts intent: send_campaign
                ↓
Fetches warm leads: GET /api/marketing/leads-by-temperature (warm)
                ↓
Generates personalized subject + body for each lead via Email Campaign Manager
                ↓
POST /api/marketing/send-campaign-batch
                ↓
EmailService dispatches SMTP emails
                ↓
Each sent email logged to lead_activities in Supabase
                ↓
Agent responds: "Sent 47 emails to warm leads. 3 failed (invalid addresses)."
                ↓
TrendtialCRM frontend shows email history in each lead's timeline
```

---

### 5.5 Pipeline View in Lead Management (Faheem)

**What was built:** A visual, interactive Kanban-style pipeline board embedded in CRM's Lead Management section that gives sales agents an immediate, bird's-eye view of all leads organized by pipeline stage. Stage transitions — moving a lead from Prospect to Qualified to Opportunity — are performed with a single drag-and-drop, instantly persisted to Supabase.

#### 5.5.1 Design Rationale

Traditional CRM lead lists (flat tables) force sales agents to mentally track which stage each lead is in. A pipeline view collapses that cognitive load into a spatial layout: agents can see at a glance where pressure is building (a full P3 column means the top of the funnel is healthy; an empty P1 column signals a gap in closeable opportunities). The pipeline view makes this critical context available without any additional navigation.

#### 5.5.2 Frontend — Pipeline Board Component

**Files created:**
- `trendtialcrm/src/components/PipelineBoard.tsx` — Main Kanban board
- `trendtialcrm/src/components/PipelineCard.tsx` — Individual lead card component
- `trendtialcrm/src/components/LeadQuickView.tsx` — Slide-over panel for lead detail without leaving the board

**Board layout:**

```
┌──────────────────┬──────────────────┬──────────────────┐
│   P3 — Prospect  │  P2 — Qualified  │ P1 — Opportunity │
│   (24 leads)     │   (11 leads)     │   (6 leads)      │
│  $480,000 est.   │  $275,000 est.   │  $180,000 est.   │
├──────────────────┼──────────────────┼──────────────────┤
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐ │
│ │ TechCorp     │ │ │ FinEdge Inc  │ │ │ GlobalSys    │ │
│ │ John Chen    │ │ │ Priya Mehta  │ │ │ Mark Torres  │ │
│ │ Score: 72 B  │ │ │ Score: 85 A  │ │ │ Score: 91 A  │ │
│ │ Last: 2d ago │ │ │ Last: today  │ │ │ Demo pending │ │
│ └──────────────┘ │ └──────────────┘ │ └──────────────┘ │
│ ┌──────────────┐ │ ┌──────────────┐ │ ┌──────────────┐ │
│ │ ...          │ │ │ ...          │ │ │ ...          │ │
└──────────────────┴──────────────────┴──────────────────┘
```

**Lead card information displayed:**
- Lead name and company
- Score badge (color-coded: A=green, B=teal, C=yellow, D=orange, F=red)
- Days since last activity
- Assigned agent avatar
- Meeting or follow-up indicator (icon if one is scheduled)

**Drag-and-drop behavior:**
- Built using the `@dnd-kit/core` drag-and-drop library
- Dragging a card between columns triggers `PATCH /api/leads/{id}/stage`
- Optimistic UI update: card moves instantly; reverts if the API call fails
- Column count and estimated value re-calculated after each drop

**Filter bar (above the board):**
- Filter by Assigned Agent (dropdown, multi-select)
- Filter by Score Grade (A / B / C / D / F, multi-select checkboxes)
- Filter by Industry (text search)
- Filter by Date Added (last 7 / 30 / 90 days)
- All filters apply client-side without re-fetching (data already loaded)

**Lead quick-view panel:**
- Clicking any card opens a slide-over panel (300ms slide animation from the right)
- Panel shows: BANT summary, lead score breakdown, all follow-ups, all meetings, full activity timeline
- "Open Full Record" button navigates to the complete lead detail page
- "Add Follow-up" shortcut button creates a follow-up directly from the panel using the form from Section 5.2

#### 5.5.3 Backend — Stage Update Endpoint

**Files modified:**
- `routes/leads.py` — Added `PATCH /api/leads/{id}/stage`
- `crm_integration/leads_api.py` — Added `update_lead_stage()` method

**Stage update endpoint:**

```python
@router.patch("/{lead_id}/stage")
async def update_lead_stage(lead_id: str, body: LeadStageUpdate):
    """
    Move a lead to a new pipeline stage (P1 / P2 / P3).
    Updates status_bucket in the leads table and logs a stage-change
    activity to lead_activities.
    """
    result = leads_api.update_lead_stage(
        lead_id=lead_id,
        new_stage=body.stage,          # "P1" | "P2" | "P3"
        moved_by_agent_id=body.agent_id
    )
    return result
```

**Activity logged on every stage change:**
```json
{
  "activity_type": "stage_change",
  "description": "Lead moved from P3 (Prospect) to P2 (Qualified) by Faheem",
  "metadata": { "from_stage": "P3", "to_stage": "P2", "moved_at": "ISO timestamp" }
}
```

**Column value calculation:**
- `GET /api/leads/pipeline-summary` returns aggregate stats per stage:
  - Lead count per stage
  - Sum of `expected_revenue` (estimated deal value) per stage
  - Average score per stage
  - Count of leads with overdue follow-ups per stage

---

### 5.6 Import Leads in Lead Management (Faheem)

**What was built:** A guided, multi-step CSV import flow in TrendtialCRM that allows sales managers to bulk-load prospect data from spreadsheets into Clara's CRM, with intelligent field mapping, validation, duplicate detection, and a confirmation preview before any records are written.

#### 5.6.1 Problem Addressed

Sales teams frequently maintain prospect lists in Excel or Google Sheets before a CRM is adopted. Without a bulk import mechanism, loading even 100 leads into the system requires manual data entry — a task that takes hours and introduces transcription errors. The import feature removes this friction entirely, making it feasible to migrate an entire existing pipeline into Clara CRM in minutes.

#### 5.6.2 Frontend — Import Leads Modal

**Files created:**
- `trendtialcrm/src/components/ImportLeadsModal.tsx` — Multi-step import wizard
- `trendtialcrm/src/components/FieldMapper.tsx` — Column-to-field mapping UI
- `trendtialcrm/src/components/ImportPreviewTable.tsx` — Validation preview with color-coded rows

**Import workflow (3 steps):**

**Step 1 — Upload:**
- "Import Leads" button in the Lead Management page header opens the modal
- Drag-and-drop zone (or click to browse) accepts `.csv` and `.xlsx` files up to 5 MB
- File is parsed client-side using `PapaParse` (CSV) or `SheetJS` (Excel)
- First 5 rows shown as a preview to confirm the file loaded correctly
- Detected column names listed on the right

**Step 2 — Map Fields:**
- Auto-mapping: column names matching CRM field names (case-insensitive) are pre-mapped
- Manual override: each detected CSV column has a dropdown showing all available CRM fields:

| CRM Field | Required | Notes |
|---|---|---|
| `name` | Yes | Lead's full name |
| `email` | Yes | Validated as email format |
| `phone` | No | E.164 format preferred |
| `company` | No | Company / organization name |
| `industry` | No | Industry sector |
| `source` | No | Lead source (web, referral, event, etc.) |
| `status_bucket` | No | P1 / P2 / P3 — defaults to P3 |
| `notes` | No | Free-text notes |
| `expected_revenue` | No | Estimated deal value (numeric) |

- Fields marked "Do not import" are excluded from processing
- A "Skip this column" option is available for any unmapped column

**Step 3 — Preview & Confirm:**
- All rows processed through the same validation logic as single-lead creation:
  - Email format validation (regex + MX record check)
  - Duplicate check: compare email + phone against existing `leads` table
  - Required field presence check
- Rows color-coded in the preview table:
  - **Green** — Valid, ready to import
  - **Amber** — Duplicate detected (email or phone already exists); agent chooses Skip or Overwrite
  - **Red** — Error row (invalid email, missing required field); shown with specific error reason
- Summary banner: `"142 valid · 8 duplicates · 3 errors — 142 will be imported"`
- "Confirm Import" button imports only the valid + user-approved rows

#### 5.6.3 Backend — Bulk Import Endpoint

**Files modified:**
- `routes/leads.py` — Added `POST /api/leads/import`
- `crm_integration/leads_api.py` — Added `bulk_create_leads()` method

**Import endpoint:**

```python
@router.post("/import", status_code=201)
async def import_leads(body: LeadImportRequest):
    """
    Bulk create leads from a pre-validated list.
    Processes rows in batches of 50 to avoid Supabase timeout limits.
    Returns a summary: {imported, skipped_duplicates, failed, total, errors}
    """
```

**Request body structure:**
```json
{
  "rows": [
    {
      "name": "Sarah Chen",
      "email": "sarah@globaltech.com",
      "phone": "+14155552671",
      "company": "GlobalTech",
      "industry": "SaaS",
      "source": "LinkedIn",
      "status_bucket": "P3",
      "notes": "Met at SaaStr 2026",
      "expected_revenue": 45000
    }
  ],
  "overwrite_duplicates": false,
  "imported_by_agent_id": "uuid"
}
```

**Batch processing in `bulk_create_leads()`:**
```python
def bulk_create_leads(rows: List[dict], overwrite_duplicates: bool, agent_id: str) -> dict:
    """
    Process rows in batches of 50.
    For each row:
      1. Check duplicate by email + phone
      2. Skip or overwrite based on flag
      3. Insert via supabase.table("leads").insert()
      4. Log lead_activities entry: "Lead imported via CSV"
    Returns: {imported, skipped_duplicates, failed, total, error_details}
    """
```

**Import summary response:**
```json
{
  "imported": 142,
  "skipped_duplicates": 6,
  "overwritten_duplicates": 2,
  "failed": 3,
  "total": 153,
  "duration_ms": 1840,
  "error_details": [
    {"row": 14, "reason": "Invalid email format: 'not-an-email'"},
    {"row": 31, "reason": "Missing required field: name"},
    {"row": 88, "reason": "Duplicate email, skip selected"}
  ]
}
```

#### 5.6.4 Activity Logging for Imported Leads

Every successfully imported lead receives an activity log entry:
```json
{
  "activity_type": "lead_imported",
  "description": "Lead imported via CSV upload by Faheem (batch: April-2026-Import)",
  "metadata": {
    "import_source": "csv_upload",
    "original_row_index": 14,
    "imported_at": "2026-04-17T09:30:00Z",
    "imported_by": "Faheem"
  }
}
```

This gives the system a complete audit trail: any lead in the pipeline can be traced back to exactly which import batch it came from, who ran the import, and when.

---

## 6. Test Suite & Coverage

### 6.1 Automated Test Suite

**Command:** `pytest tests/ --cov=. --cov-report=term-missing -v`  
**Run Date:** April 17, 2026 · Duration: 195 s (3 min 15 s)

```
================= 211 passed, 11 skipped, 17 warnings in 195.10s =================
```

**Result: Zero failures across 222 collected tests.**

### 6.2 Per-Phase Breakdown

| # | Phase | File | Collected | Passed | Skipped | Coverage |
|---|---|---|---|---|---|---|
| 1 | Infrastructure | `test_01_infra.py` | 21 | 19 | 2 | 94% |
| 2 | Sales Agent | `test_02_sales.py` | 31 | 31 | 0 | 100% |
| 3 | Marketing Agent | `test_03_marketing.py` | 35 | 35 | 0 | 90% |
| 4 | Support Agent | `test_04_support.py` | 19 | 18 | 1 | 94% |
| 5 | Orchestrator | `test_05_orchestrator.py` | 52 | 52 | 0 | 100% |
| 6 | Voice / Verbi | `test_06_voice.py` | 21 | 13 | 8 | 77% |
| 7 | CRM Integration | `test_07_crm.py` | 19 | 19 | 0 | 82% |
| 8 | End-to-End | `test_08_e2e.py` | 24 | 24 | 0 | 100% |
| — | Shared fixtures | `tests/conftest.py` | — | — | — | 65% |
| | **TOTAL** | | **222** | **211** | **11** | **89%** |

**Skipped tests breakdown:**
- 2 × Piper TTS server tests (server not running during CI)
- 1 × KB article lookup (no seeded KB articles in test DB)
- 8 × Voice hardware tests (Piper + MeloTTS live servers not running)

### 6.3 Key Module Coverage

| Module | Cover |
|---|---|
| `config.py` | 100% |
| `orchestrator/message_parser.py` | 91% |
| `orchestrator/router.py` | 89% |
| `orchestrator/classifier.py` | 86% |
| `orchestrator/core.py` | 81% |
| `agents/marketing_agent/nurturing_engine.py` | 83% |
| `agents/base_agent.py` | 84% |
| `agents/support_agent/kb_api.py` | 78% |
| `agents/support_agent/ticket_api.py` | 67% |
| `routes/sales_calls.py` | 74% |
| `routes/marketing.py` | 71% |
| `services/voice_call_service.py` | 70% |
| `agents/sales_agent/lead_scorer.py` | 75% |

---

## 7. Cumulative Achievement Summary

### 7.1 Iteration-by-Iteration Progress

| Iteration | Period | Features Delivered | Status |
|---|---|---|---|
| **Iteration 1** | Nov 2025 | Orchestrator · Sales Agent · Voice · CRM Foundation | Complete |
| **Iteration 2** | Dec 2025 | Support Agent (RoBERTa + RAG) · Marketing Hub (Ollama) | Complete |
| **Iteration 3** | Apr 2026 | Voice Chatboxes · Manual Follow-up Management · Manual Meeting Scheduling · Meeting & Follow-up Notifications · Email Dispatch · Pipeline Board · Import Leads | Complete |

### 7.2 Quantitative Metrics

| Metric | Count |
|---|---|
| Python source files (backend) | 50+ |
| React/TypeScript source files (frontend) | 40+ |
| Backend lines of code | ~14,000 |
| Frontend lines of code | ~10,000 |
| FastAPI endpoints | 60+ |
| Supabase tables integrated | 12 |
| AI models integrated | 5 (Groq LLM · RoBERTa · MiniLM · Piper TTS · Whisper STT) |
| React components created (Iteration 3) | 14 (voice hooks, follow-ups, meetings, pipeline board, import modal, notifications) |
| Automated test cases | 222 |
| Test suite coverage (tests/ files) | 89% |
| Passing tests | 211 / 222 (100% pass rate on non-hardware tests) |

### 7.3 Feature Coverage Matrix

| Feature | Sales | Marketing | Support |
|---|---|---|---|
| Text chatbot | Complete | Complete | Complete |
| **Voice chatbot** | Complete (Iteration 1) | **Complete (Iteration 3)** | **Complete (Iteration 3)** |
| Lead/contact CRM sync | Complete | Partial | Complete |
| AI classification | BANT (LLM) | Temperature scoring | RoBERTa classifier |
| **Manual follow-up management** | **Complete (Iteration 3)** | — | N/A |
| **Follow-up notifications (overdue)** | **Complete (Iteration 3)** | — | — |
| **Manual meeting scheduling** | **Complete (Iteration 3)** | — | N/A |
| **Meeting notifications** | **Complete (Iteration 3)** | — | — |
| **Pipeline board (Kanban view)** | **Complete (Iteration 3)** | — | — |
| **Import leads (CSV bulk upload)** | **Complete (Iteration 3)** | — | — |
| Knowledge base / RAG | — | — | Complete |
| **Email sending** | — | **Complete (Iteration 3)** | — |
| Email ingestion | — | — | Complete |
| Campaign generation | — | Complete | — |
| Social media content | — | Complete | — |
| Escalation queue | — | — | Complete |
| Call tracking | Complete | — | — |
| Activity timeline | Complete | Complete | Complete |
| A/B test variants | — | Complete | — |

### 7.4 End-to-End Pipeline Coverage

All three agent pipelines are fully exercised in the automated E2E test suite:

**Sales pipeline** (5-turn conversation):
Sarah Chen (VP Sales, GlobalTech, $80k budget) → 5 conversation turns → lead scored → follow-up scheduled → demo meeting proposed → CRM updated

**Marketing pipeline** (3-turn conversation):
Facebook campaign analysis → email content recommendations → A/B test suggestions → campaign email dispatched

**Support pipeline** (full ticket lifecycle):
CSV export bug reported → ticket created (RoBERTa: `technical`, priority: `high`) → RAG answer generated → ticket resolved or escalated

---

## 8. Technology Stack

### 8.1 Backend

| Layer | Technology | Purpose |
|---|---|---|
| Web framework | FastAPI | REST API, async handlers |
| Language model | Groq `llama-3.3-70b-versatile` | Orchestrator classification, sales agent responses |
| Language model | Google Gemini | Marketing content generation |
| Language model | Ollama `llama3.1` (local) | Support RAG answers, marketing Ollama mode |
| NLP classifier | RoBERTa (`roberta-base`) | Ticket category classification |
| Embeddings | `all-MiniLM-L12-v2` (SentenceTransformers) | KB semantic search |
| Database | Supabase (PostgreSQL + pgvector) | All persistent data |
| ORM/Client | supabase-py | Supabase Python client |
| Voice STT | Groq Whisper | Speech-to-text |
| Voice TTS | Piper (local) · MeloTTS (local) | Text-to-speech |
| Email dispatch | SMTP (smtplib / aiosmtplib) | Outbound lead emails |
| Validation | Pydantic v2 | Request/response schemas |
| Configuration | python-dotenv + pydantic-settings | Environment management |
| Logging | Loguru | Structured application logs |
| Testing | pytest + httpx + pytest-cov | Automated test suite |

### 8.2 Frontend

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | Component framework |
| Vite | Build tooling and dev server |
| TailwindCSS | Utility-first styling |
| Supabase JS client | Realtime subscriptions, direct queries |
| Web Speech API | Browser-native voice input |
| `@dnd-kit/core` | Drag-and-drop for Pipeline Board |
| PapaParse | Client-side CSV parsing for Import Leads |
| SheetJS (xlsx) | Excel file parsing for Import Leads |
| React Query | Data fetching, cache management |
| React Router | Client-side routing |

### 8.3 Infrastructure

| Service | Purpose |
|---|---|
| Supabase Cloud | Hosted PostgreSQL + Auth + Realtime |
| Python venv | Isolated backend dependencies |
| Node.js 20 | Frontend build environment |
| Git | Version control |

---

## 9. Running the System

### 9.1 Prerequisites

```bash
# Python 3.11+ required
# Node.js 20+ required for frontend

# Configure environment
cp clara-backend/.env.example clara-backend/.env
# Fill in: GROQ_API_KEY, GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
# Optional: SMTP_HOST, SMTP_USER, SMTP_PASSWORD (for email sending)
```

### 9.2 Backend Setup

```bash
cd clara-backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

### 9.3 Start Services

```bash
# Terminal 1 — Primary backend (Sales + Marketing + Orchestrator)
cd clara-backend
python main.py                 # Port 8001

# Terminal 2 — Support backend
cd clara-backend
python main_husnain.py         # Port 8002 (or shared)

# Terminal 3 — Piper TTS server (enables voice output)
cd Verbi
python piper_server.py         # Port 5000

# Terminal 4 — Frontend
cd trendtialcrm
npm install
npm run dev                    # Port 5173
```

### 9.4 Run Test Suite

```bash
cd clara-backend
pytest tests/ -v                                          # All 222 tests
pytest tests/ --cov=. --cov-report=term-missing -v       # With coverage report
pytest tests/test_02_sales.py tests/test_08_e2e.py -v    # Sales + E2E only
pytest tests/ -m "not voice_hardware" -v                 # Skip hardware-dependent tests
```

### 9.5 API Documentation

Once the primary backend is running, interactive Swagger documentation is available at:
- `http://localhost:8001/docs` — Primary API (sales, marketing, orchestrator)
- `http://localhost:8002/docs` — Support API (tickets, KB)

---

## Appendix A — Key File Reference

| File | Component | Lines | Iteration |
|---|---|---|---|
| `orchestrator/core.py` | Message routing engine | ~250 | 1 |
| `orchestrator/classifier.py` | Intent classification | 224 | 1 |
| `orchestrator/router.py` | Agent dispatching | ~180 | 1 |
| `orchestrator/message_parser.py` | Entity extraction | ~200 | 1 |
| `agents/sales_agent/agent.py` | Sales AI agent | 517 | 1, 3 |
| `agents/sales_agent/crm_connector.py` | CRM operations | 821 | 1, 3 |
| `agents/sales_agent/lead_qualifier.py` | BANT qualification | ~310 | 1 |
| `agents/sales_agent/lead_scorer.py` | Lead scoring | ~370 | 1 |
| `agents/support_agent/ticket_api.py` | Ticket CRUD + RAG | 354 | 2 |
| `agents/support_agent/train_roberta_classifier.py` | RoBERTa training | 245 | 2 |
| `agents/support_agent/roberta_classifier.py` | Inference helper | 51 | 2 |
| `agents/support_agent/kb_api.py` | Knowledge base API | 125 | 2 |
| `agents/support_agent/kb_search.py` | Semantic KB search | 81 | 2 |
| `agents/support_agent/seed_kb_faqs.py` | KB seeding script | 54 | 2 |
| `agents/support_agent/build_kb_index.py` | Embedding index builder | 78 | 2 |
| `agents/marketing_agent/agent.py` | Marketing AI agent | 130 | 2, 3 |
| `agents/marketing_agent/campaign_manager.py` | Campaign AI | 71 | 2 |
| `agents/marketing_agent/email_campaign_manager.py` | Email AI | 101 | 2 |
| `agents/marketing_agent/social_media_manager.py` | Social AI | 122 | 2 |
| `agents/marketing_agent/email_service.py` | SMTP dispatch | ~200 | **3** |
| `agents/marketing_agent/content_generator.py` | Content generation | 212 | 2 |
| `agents/marketing_agent/nurturing_engine.py` | Lead nurturing | 59 | 2 |
| `crm_integration/leads_api.py` | Lead CRUD + bulk import | 127 | 1, **3** |
| `crm_integration/calls_api.py` | Call tracking | 177 | 1 |
| `crm_integration/follow_ups_api.py` | Manual follow-up CRUD, overdue detection | 115 | 1, **3** |
| `crm_integration/meetings_api.py` | Meeting scheduling | 129 | 1, **3** |
| `services/voice_call_service.py` | Voice call service | 346 | 1, 3 |
| `input_streams/voice_stream.py` | STT/TTS pipeline | 226 | 1 |
| `main.py` | Primary FastAPI app | 376 | 1 |
| `routes/marketing.py` | Marketing endpoints | 209 | 2, 3 |
| `routes/sales_calls.py` | Sales call endpoints | 116 | 1 |
| `routes/follow_ups.py` | Follow-up REST endpoints | ~120 | **3** |
| `routes/meetings.py` | Meeting REST endpoints | ~130 | **3** |
| `routes/leads.py` | Lead stage update + import endpoints | ~150 | **3** |
| `tests/test_01_infra.py` – `test_08_e2e.py` | Full test suite | ~1,200 | 3 |
| `trendtialcrm/src/components/SupportChatbox.tsx` | Support chatbox + voice | ~400 | **3** |
| `trendtialcrm/src/components/MarketingChatbox.tsx` | Marketing chatbox + voice | ~400 | **3** |
| `trendtialcrm/src/hooks/useVoiceInput.ts` | Browser voice input hook | ~100 | **3** |
| `trendtialcrm/src/hooks/useNotifications.ts` | Notification polling hook | ~150 | **3** |
| `trendtialcrm/src/components/NotificationBadge.tsx` | Notification badge + drawer | ~80 | **3** |
| `trendtialcrm/src/pages/FollowUpsPage.tsx` | Dedicated follow-up management page | ~250 | **3** |
| `trendtialcrm/src/components/FollowUps.tsx` | Reusable follow-up list (embedded) | ~300 | **3** |
| `trendtialcrm/src/components/FollowUpForm.tsx` | Follow-up create / edit form | ~180 | **3** |
| `trendtialcrm/src/pages/MeetingsPage.tsx` | Dedicated meeting management page | ~280 | **3** |
| `trendtialcrm/src/components/MeetingForm.tsx` | Meeting create / edit form | ~200 | **3** |
| `trendtialcrm/src/components/MeetingCard.tsx` | Meeting summary card | ~100 | **3** |
| `trendtialcrm/src/components/MeetingsList.tsx` | Filterable meeting list | ~220 | **3** |
| `trendtialcrm/src/components/PipelineBoard.tsx` | Kanban pipeline board (drag-and-drop) | ~350 | **3** |
| `trendtialcrm/src/components/PipelineCard.tsx` | Individual lead card component | ~120 | **3** |
| `trendtialcrm/src/components/LeadQuickView.tsx` | Slide-over lead detail panel | ~200 | **3** |
| `trendtialcrm/src/components/ImportLeadsModal.tsx` | Multi-step CSV import wizard | ~380 | **3** |
| `trendtialcrm/src/components/FieldMapper.tsx` | CSV column-to-CRM field mapping UI | ~150 | **3** |
| `trendtialcrm/src/components/ImportPreviewTable.tsx` | Validation preview with color-coded rows | ~180 | **3** |

---

*This document was prepared for FYP 1 Group F25-388-D submission — April 2026.*  
*All code is version-controlled in the Clara repository under `D:/Faheem/Semester 7/FYP 1/Implementation/Clara`.*
