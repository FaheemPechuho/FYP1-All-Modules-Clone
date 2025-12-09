# 🎯 HUSNAIN'S COMPLETE IMPLEMENTATION GUIDE
## Support Agent + Admin Panel + Meeting System

**Project:** Clara AI - Multi-Agent CRM System  
**Your Role:** Support Agent Owner + Admin Infrastructure  
**Constraint:** ⚠️ **NO PAID APIs ALLOWED** (100% Free/Open-Source)  
**Timeline:** 4-6 weeks intensive development

---

## 📊 TASK ANALYSIS: WHAT YOU ACTUALLY NEED TO BUILD

### **Your Responsibilities (From Images + Text):**

```
┌─────────────────────────────────────────────────────────┐
│  HUSNAIN'S WORK BREAKDOWN                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🤖 SUPPORT AGENT (70% of work)                         │
│     ├── Ticket System (CRUD + Logic)                   │
│     ├── FAQ System (RAG with free tools)               │
│     ├── Escalation Workflow                            │
│     ├── NLP Classification (free models)               │
│     └── Email Integration                              │
│                                                         │
│  👨‍💼 ADMIN PANEL (20% of work)                          │
│     ├── Admin User Management                          │
│     ├── RBAC (Role-Based Access Control)              │
│     ├── Team Progress Dashboard                        │
│     └── System Security                                │
│                                                         │
│  📅 MEETING SYSTEM (10% of work)                        │
│     ├── Meeting Scheduler                              │
│     ├── Meeting CRUD                                   │
│     ├── Todo/Task System                               │
│     └── Team Coordination                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🆓 FREE ALTERNATIVES TO PAID APIs

### **Problem: Technical Spec Assumes Paid Services**
```
Spec Says:           You Must Use (FREE):
─────────────────    ──────────────────────────────────
OpenAI GPT-4      →  Llama 3.1 8B (Local/Ollama)
OpenAI Embeddings →  all-MiniLM-L6-v2 (HuggingFace)
Groq API          →  Ollama (Run models locally)
Deepgram STT      →  Whisper.cpp (Local)
Paid Vector DB    →  pgvector (PostgreSQL, 100% free)
```

### **Your Complete Free Tech Stack:**

**1. Large Language Models (LLM) - For RAG Answers**
```python
Option A: Ollama (RECOMMENDED) ⭐
├── Install: Download from ollama.ai (free)
├── Models: Llama 3.1 8B, Mistral 7B, Phi-3
├── Local: Runs on your machine (GPU optional)
├── API: Compatible with OpenAI API format
└── Speed: Fast enough for demo/FYP

Command: ollama pull llama3.1:8b
Usage:   import ollama
         response = ollama.chat(model='llama3.1:8b', messages=[...])

Option B: Hugging Face Transformers
├── Models: Flan-T5, GPT-2, smaller models
├── Local: Run inference locally
├── Control: Full control over model
└── Issue: Slower, needs more setup

Option C: LM Studio (Windows-friendly)
├── GUI: Easy to use interface
├── Models: Same as Ollama
└── API: Local API server
```

**2. Embeddings - For Semantic Search**
```python
FREE: sentence-transformers (HuggingFace) ⭐

from sentence_transformers import SentenceTransformer

# Download once (free, 80MB)
model = SentenceTransformer('all-MiniLM-L6-v2')

# Generate embeddings
texts = ["How do I reset my password?", "Login issues"]
embeddings = model.encode(texts)  # 384-dimensional vectors

# Store in pgvector
# Search with cosine similarity
```

**3. NLP Classification - For Ticket Categorization**
```python
Option A: scikit-learn (Classical ML) ⭐
├── TF-IDF Vectorizer + SVM/Logistic Regression
├── Fast: < 50ms inference
├── Accurate: 85-90% with 1000+ training samples
└── Easy: Standard ML pipeline

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000)),
    ('classifier', SVC(kernel='linear', probability=True))
])

pipeline.fit(train_texts, train_labels)
prediction = pipeline.predict(["My login is broken"])

Option B: Fine-tuned DistilBERT (Deep Learning)
├── HuggingFace Transformers
├── Accuracy: 90-95% (better than classical ML)
├── Speed: 100-200ms (slower but acceptable)
└── Effort: Needs GPU for training (Google Colab free)

from transformers import DistilBertForSequenceClassification
# Fine-tune on your ticket data
```

**4. Speech-to-Text (STT) - For Voice**
```python
FREE: Whisper (OpenAI's open-source model) ⭐

Option A: faster-whisper (RECOMMENDED)
├── Install: pip install faster-whisper
├── Models: tiny, base, small, medium (choose based on laptop)
├── Speed: 2-5x faster than original Whisper
├── Accuracy: 95%+ for clear audio
└── Local: 100% offline

from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu")
segments, info = model.transcribe("audio.mp3")

for segment in segments:
    print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")

Option B: Vosk (Lightweight)
├── Smaller models (< 50MB)
├── Faster than Whisper
└── Lower accuracy (~85%)
```

**5. Text-to-Speech (TTS) - For Voice Responses**
```python
FREE: pyttsx3 (Offline) or Coqui TTS ⭐

Option A: pyttsx3 (Simple)
import pyttsx3

engine = pyttsx3.init()
engine.say("Your ticket has been created")
engine.runAndWait()

Option B: Coqui TTS (Better quality)
from TTS.api import TTS

tts = TTS("tts_models/en/ljspeech/tacotron2-DDC")
tts.tts_to_file(text="Hello", file_path="output.wav")
```

**6. Vector Database - For RAG**
```sql
FREE: pgvector (PostgreSQL extension) ⭐

-- Install extension
CREATE EXTENSION vector;

-- Create table
CREATE TABLE kb_embedding (
    id UUID PRIMARY KEY,
    chunk_id UUID,
    embedding VECTOR(384),  -- all-MiniLM-L6-v2 dimensions
    content TEXT
);

-- Create index for fast search
CREATE INDEX ON kb_embedding USING ivfflat (embedding vector_cosine_ops);

-- Semantic search
SELECT content, 1 - (embedding <=> query_embedding) as similarity
FROM kb_embedding
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

**7. Email Integration**
```python
FREE: Built-in Python libraries ⭐

import imaplib
import smtplib
from email.mime.text import MIMEText

# IMAP (Receive emails)
mail = imaplib.IMAP4_SSL('imap.gmail.com')
mail.login('support@company.com', 'app_password')
mail.select('inbox')

# SMTP (Send emails)
msg = MIMEText('Your ticket is resolved!')
msg['Subject'] = 'Re: Ticket #12345'
msg['From'] = 'support@company.com'
msg['To'] = 'customer@email.com'

smtp = smtplib.SMTP_SSL('smtp.gmail.com', 465)
smtp.login('support@company.com', 'app_password')
smtp.send_message(msg)
smtp.quit()
```

---

## 🏗️ ARCHITECTURE: HOW YOUR COMPONENTS FIT

```
┌──────────────────────────────────────────────────────────────┐
│                    CLARA AI SYSTEM                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Faheem    │  │   Sheryar   │  │   HUSNAIN   │        │
│  │ Sales Agent │  │ Marketing   │  │ SUPPORT ⭐  │        │
│  │  + Backend  │  │   Agent     │  │ Agent+Admin │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │
│         └────────┬───────┴────────────────┘                │
│                  │                                          │
│            ┌─────▼──────┐                                  │
│            │ Orchestrator│ (Faheem's backend work)         │
│            │ Message     │                                  │
│            │ Classifier  │                                  │
│            └─────┬──────┘                                  │
│                  │                                          │
│         ┌────────┴────────┐                                │
│         │   Routes to     │                                │
│         │   Your Agent    │                                │
│         └────────┬────────┘                                │
│                  │                                          │
│        ┌─────────▼──────────────────────────────┐         │
│        │  YOUR SUPPORT AGENT (support_agent.py) │         │
│        ├────────────────────────────────────────┤         │
│        │ 1. Ticket Manager                      │         │
│        │ 2. FAQ Handler (RAG)                   │         │
│        │ 3. Escalation Logic                    │         │
│        │ 4. Email Integration                   │         │
│        │ 5. Classification (NLP)                │         │
│        └─────────┬──────────────────────────────┘         │
│                  │                                          │
│        ┌─────────▼──────────┐                              │
│        │  PostgreSQL + CRM  │                              │
│        ├────────────────────┤                              │
│        │ tickets            │ ← YOU create                 │
│        │ ticket_history     │ ← YOU create                 │
│        │ kb_article         │ ← YOU create                 │
│        │ kb_chunk           │ ← YOU create                 │
│        │ kb_embedding       │ ← YOU create                 │
│        │ queues, slas       │ ← YOU create                 │
│        │ admin_users        │ ← YOU create                 │
│        │ meetings           │ ← YOU create                 │
│        │ tasks              │ ← YOU create                 │
│        └────────────────────┘                              │
│                                                              │
│        ┌──────────────────────────────────┐                │
│        │  YOUR ADMIN PANEL (React)        │                │
│        ├──────────────────────────────────┤                │
│        │ Dashboard (Team Overview)        │                │
│        │ User Management (RBAC)           │                │
│        │ Meeting Scheduler                │                │
│        │ Task/Todo Manager                │                │
│        │ System Logs & Monitoring         │                │
│        └──────────────────────────────────┘                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📝 DETAILED IMPLEMENTATION PLAN

### **PHASE 1: SUPPORT AGENT CORE (WEEKS 1-2)**

#### **Week 1: Ticket System Foundation**

**Day 1-2: Database Setup**

```sql
-- File: clara-backend/database/support_schema.sql

-- 1. Tickets Table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    assignee_id UUID REFERENCES users(id),
    queue_id UUID REFERENCES queues(id),
    
    -- Content
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    channel TEXT CHECK (channel IN ('email', 'chat', 'voice', 'web')),
    
    -- Classification (your NLP fills this)
    intent TEXT,  -- e.g., "password_reset", "billing_issue"
    category TEXT CHECK (category IN ('technical', 'billing', 'general')),
    priority TEXT CHECK (priority IN ('urgent', 'high', 'normal', 'low')) DEFAULT 'normal',
    
    -- Status tracking
    status TEXT CHECK (status IN ('open', 'pending', 'resolved', 'escalated', 'closed')) DEFAULT 'open',
    
    -- Metadata
    transcript TEXT,  -- for voice tickets
    metadata JSONB DEFAULT '{}',  -- flexible storage
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- Indexes for fast queries
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX idx_tickets_customer ON tickets(customer_id);

-- 2. Ticket History (audit trail)
CREATE TABLE ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    
    changed_by UUID REFERENCES users(id),
    action TEXT NOT NULL,  -- 'created', 'updated', 'escalated', 'closed'
    
    old_values JSONB,
    new_values JSONB,
    
    comment TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_history_ticket ON ticket_history(ticket_id);

-- 3. Queues (for ticket routing)
CREATE TABLE queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    team TEXT,  -- 'support_tier1', 'support_tier2', 'escalations'
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default queues
INSERT INTO queues (name, description, team) VALUES
    ('General Support', 'Default queue for all tickets', 'support_tier1'),
    ('Technical Issues', 'Complex technical problems', 'support_tier2'),
    ('Billing & Payments', 'Payment and billing inquiries', 'billing_team'),
    ('Escalations', 'High-priority escalated tickets', 'senior_support');

-- 4. SLAs (Service Level Agreements)
CREATE TABLE slas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    
    respond_within INTERVAL NOT NULL,  -- e.g., '2 hours'
    resolve_within INTERVAL NOT NULL,  -- e.g., '24 hours'
    
    applies_to_priority TEXT[],  -- ['urgent', 'high']
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default SLAs
INSERT INTO slas (name, respond_within, resolve_within, applies_to_priority) VALUES
    ('Urgent SLA', '30 minutes', '4 hours', ARRAY['urgent']),
    ('High Priority SLA', '2 hours', '24 hours', ARRAY['high']),
    ('Normal SLA', '12 hours', '72 hours', ARRAY['normal']),
    ('Low Priority SLA', '24 hours', '168 hours', ARRAY['low']);

-- 5. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

**Day 3-4: Ticket API (FastAPI)**

```python
# File: clara-backend/agents/support_agent/ticket_manager.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime
from enum import Enum

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


# ─────────────────────────────────────────────────────────────
# PYDANTIC MODELS (Request/Response)
# ─────────────────────────────────────────────────────────────

class TicketChannel(str, Enum):
    EMAIL = "email"
    CHAT = "chat"
    VOICE = "voice"
    WEB = "web"


class TicketCategory(str, Enum):
    TECHNICAL = "technical"
    BILLING = "billing"
    GENERAL = "general"


class TicketPriority(str, Enum):
    URGENT = "urgent"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class TicketStatus(str, Enum):
    OPEN = "open"
    PENDING = "pending"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    CLOSED = "closed"


class TicketCreate(BaseModel):
    customer_id: UUID
    subject: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    channel: TicketChannel
    
    # Optional (auto-filled by NLP if not provided)
    category: Optional[TicketCategory] = None
    priority: Optional[TicketPriority] = TicketPriority.NORMAL


class TicketUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assignee_id: Optional[UUID] = None
    queue_id: Optional[UUID] = None


class TicketResponse(BaseModel):
    id: UUID
    customer_id: UUID
    assignee_id: Optional[UUID]
    queue_id: Optional[UUID]
    
    subject: str
    description: str
    channel: TicketChannel
    
    intent: Optional[str]
    category: Optional[TicketCategory]
    priority: TicketPriority
    status: TicketStatus
    
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# DATABASE CONNECTION (use Supabase or direct PostgreSQL)
# ─────────────────────────────────────────────────────────────

from supabase import create_client
import os

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)


# ─────────────────────────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────────────────────────

@router.post("/", response_model=TicketResponse, status_code=201)
async def create_ticket(ticket: TicketCreate):
    """
    Create a new support ticket.
    
    If category/priority not provided, will be auto-classified by NLP.
    """
    
    # 1. Auto-classify if needed
    if not ticket.category or not ticket.intent:
        from .classifier import classify_ticket
        classification = classify_ticket(ticket.subject, ticket.description)
        
        ticket.category = classification['category']
        ticket.priority = classification['priority']
        intent = classification['intent']
    else:
        intent = None
    
    # 2. Auto-assign to queue
    from .router import assign_queue
    queue_id = assign_queue(ticket.category, ticket.priority)
    
    # 3. Insert into database
    ticket_data = {
        "id": str(uuid4()),
        "customer_id": str(ticket.customer_id),
        "subject": ticket.subject,
        "description": ticket.description,
        "channel": ticket.channel.value,
        "category": ticket.category.value if ticket.category else None,
        "priority": ticket.priority.value,
        "intent": intent,
        "queue_id": str(queue_id) if queue_id else None,
        "status": "open",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    response = supabase.table("tickets").insert(ticket_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create ticket")
    
    # 4. Log to ticket_history
    history_data = {
        "ticket_id": ticket_data["id"],
        "action": "created",
        "new_values": ticket_data,
        "created_at": datetime.utcnow().isoformat(),
    }
    supabase.table("ticket_history").insert(history_data).execute()
    
    # 5. Check if auto-resolve possible
    from .faq_handler import try_auto_resolve
    auto_response = try_auto_resolve(ticket.subject, ticket.description)
    
    if auto_response and auto_response['confidence'] > 0.85:
        # Auto-close with RAG answer
        update_data = {
            "status": "resolved",
            "resolved_at": datetime.utcnow().isoformat(),
            "metadata": {
                "auto_resolved": True,
                "answer": auto_response['answer'],
                "citations": auto_response['citations'],
            }
        }
        supabase.table("tickets").update(update_data).eq("id", ticket_data["id"]).execute()
        
        # Send email with answer
        from .email_handler import send_ticket_response
        send_ticket_response(ticket_data["id"], auto_response['answer'])
    
    return response.data[0]


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: UUID):
    """Get a single ticket by ID."""
    
    response = supabase.table("tickets").select("*").eq("id", str(ticket_id)).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return response.data[0]


@router.get("/", response_model=List[TicketResponse])
async def list_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    assignee_id: Optional[UUID] = None,
    queue_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    List tickets with optional filters.
    
    Examples:
    - GET /api/tickets?status=open&priority=urgent
    - GET /api/tickets?assignee_id=uuid&limit=10
    """
    
    query = supabase.table("tickets").select("*")
    
    if status:
        query = query.eq("status", status.value)
    if priority:
        query = query.eq("priority", priority.value)
    if assignee_id:
        query = query.eq("assignee_id", str(assignee_id))
    if queue_id:
        query = query.eq("queue_id", str(queue_id))
    
    query = query.order("created_at", desc=True).limit(limit).offset(offset)
    
    response = query.execute()
    
    return response.data


@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(ticket_id: UUID, update: TicketUpdate):
    """Update a ticket."""
    
    # Get current ticket
    current = supabase.table("tickets").select("*").eq("id", str(ticket_id)).execute()
    
    if not current.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    old_values = current.data[0]
    
    # Build update dict
    update_data = {}
    if update.subject:
        update_data["subject"] = update.subject
    if update.description:
        update_data["description"] = update.description
    if update.status:
        update_data["status"] = update.status.value
        if update.status == TicketStatus.RESOLVED:
            update_data["resolved_at"] = datetime.utcnow().isoformat()
        elif update.status == TicketStatus.CLOSED:
            update_data["closed_at"] = datetime.utcnow().isoformat()
    if update.priority:
        update_data["priority"] = update.priority.value
    if update.assignee_id:
        update_data["assignee_id"] = str(update.assignee_id)
    if update.queue_id:
        update_data["queue_id"] = str(update.queue_id)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Update database
    response = supabase.table("tickets").update(update_data).eq("id", str(ticket_id)).execute()
    
    # Log to history
    history_data = {
        "ticket_id": str(ticket_id),
        "action": "updated",
        "old_values": old_values,
        "new_values": update_data,
        "created_at": datetime.utcnow().isoformat(),
    }
    supabase.table("ticket_history").insert(history_data).execute()
    
    return response.data[0]


@router.delete("/{ticket_id}", status_code=204)
async def close_ticket(ticket_id: UUID):
    """Close a ticket (soft delete by setting status to 'closed')."""
    
    update_data = {
        "status": "closed",
        "closed_at": datetime.utcnow().isoformat()
    }
    
    response = supabase.table("tickets").update(update_data).eq("id", str(ticket_id)).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Log to history
    history_data = {
        "ticket_id": str(ticket_id),
        "action": "closed",
        "new_values": update_data,
        "created_at": datetime.utcnow().isoformat(),
    }
    supabase.table("ticket_history").insert(history_data).execute()
    
    return None


@router.get("/{ticket_id}/history", response_model=List[dict])
async def get_ticket_history(ticket_id: UUID):
    """Get complete history of a ticket."""
    
    response = (
        supabase.table("ticket_history")
        .select("*")
        .eq("ticket_id", str(ticket_id))
        .order("created_at", desc=True)
        .execute()
    )
    
    return response.data
```

---

#### **Week 1, Day 5-7: NLP Classification (Free)**

```python
# File: clara-backend/agents/support_agent/classifier.py

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score
import json


# ─────────────────────────────────────────────────────────────
# TRAINING DATA (You create this from historical tickets)
# ─────────────────────────────────────────────────────────────

# File: training_data/tickets.json
# [
#   {"text": "I can't login to my account", "category": "technical", "priority": "high", "intent": "login_issue"},
#   {"text": "How do I reset my password?", "category": "technical", "priority": "normal", "intent": "password_reset"},
#   {"text": "I was charged twice", "category": "billing", "priority": "urgent", "intent": "double_charge"},
#   ...
# ]


class TicketClassifier:
    """
    Free NLP classifier using scikit-learn.
    
    Trained on: TF-IDF + SVM (Support Vector Machine)
    Accuracy: 85-90% with 1000+ training samples
    Speed: < 50ms inference
    """
    
    def __init__(self, model_path="models/ticket_classifier.pkl"):
        self.model_path = model_path
        self.category_pipeline = None
        self.priority_pipeline = None
        self.intent_pipeline = None
        
        # Intent keywords (rule-based fallback)
        self.intent_keywords = {
            "password_reset": ["password", "reset", "forgot", "change password"],
            "login_issue": ["login", "can't sign in", "access denied", "locked out"],
            "billing_issue": ["bill", "charge", "invoice", "payment", "refund"],
            "technical_issue": ["error", "broken", "not working", "crash", "bug"],
            "account_question": ["account", "profile", "settings", "how to"],
        }
    
    def train(self, training_data_path="training_data/tickets.json"):
        """
        Train the classifier on labeled data.
        
        Run this once to create the model.
        """
        
        # Load training data
        with open(training_data_path, 'r') as f:
            data = json.load(f)
        
        texts = [item['text'] for item in data]
        categories = [item['category'] for item in data]
        priorities = [item['priority'] for item in data]
        intents = [item['intent'] for item in data]
        
        # Split data
        X_train, X_test, y_cat_train, y_cat_test = train_test_split(
            texts, categories, test_size=0.2, random_state=42
        )
        
        # Train category classifier
        print("Training category classifier...")
        self.category_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ('classifier', SVC(kernel='linear', probability=True))
        ])
        self.category_pipeline.fit(X_train, y_cat_train)
        
        # Evaluate
        y_pred = self.category_pipeline.predict(X_test)
        f1 = f1_score(y_cat_test, y_pred, average='weighted')
        print(f"Category F1 Score: {f1:.3f}")
        print(classification_report(y_cat_test, y_pred))
        
        # Train priority classifier
        print("\nTraining priority classifier...")
        _, _, y_pri_train, y_pri_test = train_test_split(
            texts, priorities, test_size=0.2, random_state=42
        )
        self.priority_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ('classifier', SVC(kernel='linear', probability=True))
        ])
        self.priority_pipeline.fit(X_train, y_pri_train)
        
        y_pred = self.priority_pipeline.predict(X_test)
        f1 = f1_score(y_pri_test, y_pred, average='weighted')
        print(f"Priority F1 Score: {f1:.3f}")
        
        # Train intent classifier
        print("\nTraining intent classifier...")
        _, _, y_int_train, y_int_test = train_test_split(
            texts, intents, test_size=0.2, random_state=42
        )
        self.intent_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ('classifier', SVC(kernel='linear', probability=True))
        ])
        self.intent_pipeline.fit(X_train, y_int_train)
        
        y_pred = self.intent_pipeline.predict(X_test)
        f1 = f1_score(y_int_test, y_pred, average='weighted')
        print(f"Intent F1 Score: {f1:.3f}")
        
        # Save models
        joblib.dump({
            'category': self.category_pipeline,
            'priority': self.priority_pipeline,
            'intent': self.intent_pipeline
        }, self.model_path)
        
        print(f"\nModel saved to {self.model_path}")
    
    def load(self):
        """Load trained model."""
        models = joblib.load(self.model_path)
        self.category_pipeline = models['category']
        self.priority_pipeline = models['priority']
        self.intent_pipeline = models['intent']
    
    def classify(self, subject: str, description: str):
        """
        Classify a ticket.
        
        Returns:
            {
                'category': 'technical',
                'priority': 'high',
                'intent': 'login_issue',
                'confidence': {
                    'category': 0.92,
                    'priority': 0.78,
                    'intent': 0.85
                }
            }
        """
        
        if not self.category_pipeline:
            self.load()
        
        # Combine subject + description
        text = f"{subject} {description}"
        
        # Predict category
        category = self.category_pipeline.predict([text])[0]
        category_proba = max(self.category_pipeline.predict_proba([text])[0])
        
        # Predict priority
        priority = self.priority_pipeline.predict([text])[0]
        priority_proba = max(self.priority_pipeline.predict_proba([text])[0])
        
        # Predict intent
        intent = self.intent_pipeline.predict([text])[0]
        intent_proba = max(self.intent_pipeline.predict_proba([text])[0])
        
        # Rule-based overrides for urgent keywords
        text_lower = text.lower()
        if any(word in text_lower for word in ["urgent", "asap", "emergency", "critical", "immediately"]):
            priority = "urgent"
        
        return {
            'category': category,
            'priority': priority,
            'intent': intent,
            'confidence': {
                'category': float(category_proba),
                'priority': float(priority_proba),
                'intent': float(intent_proba)
            }
        }


# ─────────────────────────────────────────────────────────────
# API WRAPPER
# ─────────────────────────────────────────────────────────────

_classifier = None

def get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = TicketClassifier()
        _classifier.load()
    return _classifier


def classify_ticket(subject: str, description: str):
    """Helper function for ticket_manager.py"""
    classifier = get_classifier()
    return classifier.classify(subject, description)


# ─────────────────────────────────────────────────────────────
# TRAINING SCRIPT (Run once to create model)
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Generate synthetic training data (or use real historical tickets)
    import random
    
    training_data = []
    
    # Technical - Login issues
    for _ in range(200):
        texts = [
            "I can't login to my account",
            "Login button not working",
            "Access denied when trying to sign in",
            "Locked out of my account",
            "Password not accepted",
        ]
        training_data.append({
            "text": random.choice(texts),
            "category": "technical",
            "priority": "high",
            "intent": "login_issue"
        })
    
    # Technical - Password reset
    for _ in range(150):
        texts = [
            "How do I reset my password?",
            "Forgot my password",
            "Need to change my password",
            "Password reset link not working",
        ]
        training_data.append({
            "text": random.choice(texts),
            "category": "technical",
            "priority": "normal",
            "intent": "password_reset"
        })
    
    # Billing - Payment issues
    for _ in range(180):
        texts = [
            "I was charged twice",
            "Incorrect billing amount",
            "Need a refund",
            "Payment failed but order went through",
            "Invoice doesn't match",
        ]
        training_data.append({
            "text": random.choice(texts),
            "category": "billing",
            "priority": "high",
            "intent": "billing_issue"
        })
    
    # General - Questions
    for _ in range(170):
        texts = [
            "How do I update my profile?",
            "What are your business hours?",
            "Do you ship internationally?",
            "Can I cancel my order?",
        ]
        training_data.append({
            "text": random.choice(texts),
            "category": "general",
            "priority": "low",
            "intent": "account_question"
        })
    
    # Save training data
    import os
    os.makedirs("training_data", exist_ok=True)
    with open("training_data/tickets.json", 'w') as f:
        json.dump(training_data, f, indent=2)
    
    # Train model
    classifier = TicketClassifier()
    classifier.train()
    
    # Test
    print("\n" + "="*50)
    print("TESTING CLASSIFIER")
    print("="*50)
    
    test_cases = [
        ("Can't access my account", "I've been trying to login for 30 minutes but keep getting 'access denied'"),
        ("Billing question", "Why was I charged $99 instead of $49?"),
        ("How to use feature X", "I'm trying to export my data but can't find the button"),
    ]
    
    for subject, description in test_cases:
        result = classifier.classify(subject, description)
        print(f"\nInput: {subject}")
        print(f"Category: {result['category']} (confidence: {result['confidence']['category']:.2f})")
        print(f"Priority: {result['priority']} (confidence: {result['confidence']['priority']:.2f})")
        print(f"Intent: {result['intent']} (confidence: {result['confidence']['intent']:.2f})")
```

---

### **CONTINUE IN NEXT FILE DUE TO LENGTH...**

I've created the first major section. Let me continue with Week 2 (RAG/FAQ system) in the next file:
