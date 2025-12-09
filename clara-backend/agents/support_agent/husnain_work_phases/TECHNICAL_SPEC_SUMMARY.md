# 🔬 Technical Specification - Executive Summary

**Document:** 1,861 lines | 4 Chapters | Production-grade SRS + Design Document

---

## 📊 STRUCTURE OVERVIEW

**Chapter 1 (Lines 1-294): Introduction**
- Problem Statement: Traditional CRMs are passive data repositories
- Scope: 5 specialized AI agents (Orchestrator, Sales, Service, Marketing, Infrastructure)
- 7 User Classes: Executives, Sales Reps, CSRs, Marketing, Admins, Analysts, Customers

**Chapter 2 (Lines 295-1197): Requirements**
- 23 Detailed Use Cases (UC-0 to UC-23)
- 100+ Functional Requirements
- 60+ Non-Functional Requirements (99.9% uptime, <500ms API latency, WCAG 2.1 AA)

**Chapter 3 (Lines 1198-1767): Design**
- Layered microservices + event-driven architecture
- 40+ database tables (PostgreSQL + pgvector)
- Complete ERD with relationships, indexes, constraints

**Chapter 4 (Lines 1768-1836): Conclusion**
- Risks: RAG quality, model drift, omnichannel variability
- Future: Load testing, field-level encryption, DR drills

---

## 🎯 YOUR RESPONSIBILITIES (HUSNAIN)

### **Service Agent - YOUR PRIMARY MODULE**

**From UC-1 to UC-4 (Ticket Lifecycle):**
```
UC-1: Create/Intake Ticket (Voice/Text)
├── Accept via voice, chat, email
├── STT streaming (WER ≤ 12%)
├── Extract intent/entities
└── NFR: p95 turn latency ≤ 1200 ms

UC-2: Auto-Classify & Route Ticket
├── NLP classification (F1 ≥ 0.80)
├── Apply SLA/priority rules
├── Route to queue or auto-resolve
└── NFR: Classification ≤ 300 ms

UC-3: Retrieve RAG Answer with Citations
├── Form retrieval query from ticket
├── Retrieve top-k chunks, synthesize answer
├── Require ≥1 citation, faithfulness ≥ 0.8
└── NFR: Answer p95 ≤ 1500 ms

UC-4: Escalate to Human / Handoff
├── Package full context (history, intents, citations)
├── Reassign with SLA bump
└── NFR: Handoff ≤ 3s, zero context loss
```

### **Database Tables YOU Need:**

**Tickets & Routing:**
```sql
ticket: id, customer_id, assignee_user_id, queue_id, sla_id, 
        routing_policy_id, channel, intent, category, priority, 
        status, transcript, created_at, updated_at

ticket_history: id, ticket_id, from_status, to_status, at

queue: id, name, team
sla: id, name, respond_within, resolve_within
routing_policy: id, name, rules (JSONB), threshold
```

**Knowledge Base (RAG):**
```sql
kb_article: id, title, state (draft|review|published), metadata, updated_at
kb_chunk: id, article_id, content, order_idx
kb_embedding: id, chunk_id, embedding VECTOR(1536), model
citation: id, ticket_id, chunk_id, snippet
```

**Indexes Required:**
```sql
ix_ticket_status_pri ON ticket(status, priority)
ix_ticket_assignee ON ticket(assignee_user_id)
ivff_kb_embedding ON kb_embedding USING ivfflat (embedding vector_cosine_ops)
```

---

## 🔧 TECHNICAL REQUIREMENTS

### **Performance Targets:**
```
Voice Intake: p95 ≤ 1200 ms (full turn)
STT Accuracy: WER ≤ 12%
Classification: p95 ≤ 300 ms, F1 ≥ 0.80
RAG Answer: p95 ≤ 1500 ms
Faithfulness: ≥ 0.8 (no hallucinations)
Escalation: ≤ 3s end-to-end
```

### **Technologies YOU Must Use:**
```
NLP: Intent classification, entity extraction, sentiment analysis
RAG: Retrieval-Augmented Generation with citations
Vector DB: pgvector with ivfflat index
STT: Speech-to-text (Whisper/Groq)
Email: IMAP parsing for ticket intake
ML: Ticket categorization model (F1 ≥ 0.80)
```

### **Non-Functional Requirements:**
```
Security: TLS 1.2+, AES-256 at rest, PII redaction
Scalability: 200 concurrent voice sessions
Availability: 99.9% uptime
Observability: Structured logs, distributed tracing
Compliance: GDPR/CAN-SPAM consent gates
```

---

## 📈 IMPLEMENTATION CHECKLIST

### **Phase 1: Ticket Management (Weeks 1-2)**
- [ ] Implement ticket CRUD operations
- [ ] NLP-based classification (train/deploy model)
- [ ] Priority assessment algorithm
- [ ] Routing policy engine
- [ ] Email intake parser (IMAP)
- [ ] Queue assignment logic

### **Phase 2: RAG Knowledge Base (Weeks 3-4)**
- [ ] KB article CRUD with workflow (draft→review→publish)
- [ ] Document chunking strategy
- [ ] Embedding generation (OpenAI/Sentence-BERT)
- [ ] pgvector setup + ivfflat index
- [ ] Semantic search implementation
- [ ] Citation extraction and formatting
- [ ] Faithfulness guardrails (no hallucinations)

### **Phase 3: Voice Integration (Week 5)**
- [ ] STT integration (Groq Whisper)
- [ ] Real-time streaming transcription
- [ ] Intent extraction from voice
- [ ] Voice session state management
- [ ] Fallback to text on degradation

### **Phase 4: Escalation & Analytics (Week 6)**
- [ ] Context packaging for handoff
- [ ] SLA monitoring and alerts
- [ ] Escalation rules engine
- [ ] Ticket history tracking
- [ ] Performance metrics dashboard

---

## 🚨 CRITICAL SUCCESS FACTORS

**1. RAG Quality** (Most Important)
- Chunk size: 200-500 tokens optimal
- Overlap: 50 tokens between chunks
- Embedding model: text-embedding-3-large (1536 dim)
- Top-k retrieval: 5-10 chunks
- Reranking: Optional but recommended
- **Citations are mandatory** - no answer without source

**2. Classification Accuracy**
- Target: F1 ≥ 0.80 on held-out test set
- Categories: technical, billing, general
- Priority levels: urgent, high, normal, low
- Monthly drift monitoring required

**3. Performance Benchmarks**
- Voice turn: ≤ 1200 ms p95 (critical path)
- Classification: ≤ 300 ms
- RAG answer: ≤ 1500 ms
- **Test under load**: 200 concurrent sessions

**4. Data Quality**
- PII redaction at ingest (mandatory)
- Consent enforcement (GDPR/CAN-SPAM)
- Audit logging (immutable, 365-day retention)
- No silent failures (correlation IDs required)

---

## 💡 KEY ARCHITECTURAL INSIGHTS

**Event-Driven Flow:**
```
Email Arrives → Event Bus → Orchestrator (classify) 
→ Service Agent (YOU) → RAG Service → Response
→ Email Reply / Ticket Update
```

**Degradation Strategies:**
```
Low Confidence → Escalate to human
STT Failure → Text-only fallback
RAG Ungrounded → Request clarification
Queue Overload → Fallback queue + alert
```

**Data Flow (Your Agent):**
```
1. Ticket Created → ticket table
2. NLP Classification → intent, category, priority updated
3. Route to Queue → queue_id assigned
4. RAG Query → kb_embedding search
5. Answer Generated → citation[] created
6. Response Sent → ticket_history updated
7. Escalation (if needed) → assignee_user_id changed, SLA bumped
```

---

## 🎓 ALIGNMENT WITH PROPOSAL

**Your Original Assignment:** Service Agent + Marketing features  
**Current Reality:** Support Agent (same as Service) + Email integration  
**Marketing:** Reassigned to Sheryar (better balance)

**Core Features Match:**
```
Proposal Required:          Implementation Has:
✓ Ticket management NLP  → Ticket classification ✓
✓ Knowledge Base RAG     → FAQ system with RAG ✓
✓ Voice AI integration   → Email integration (more practical) ✓
✓ Escalation logic       → Context-aware handoff ✓
```

**Why Email vs Voice for Support?**
- Support tickets typically arrive via email
- Email provides written record automatically
- Voice is better for sales (Faheem handles that)
- Easier to implement RAG with text
- Industry standard for support channels

---

## 📚 BIBLIOGRAPHY REFERENCE

**Key Papers for YOUR Work:**
```
[4] Patel & Kumar (2023) - RAG for Knowledge Base Systems
    → Core reference for your KB implementation

[8] Zhang, Liu, & Davis (2024) - Multi-agent Customer Service
    → Design patterns for your service agent

[15] Kleppmann (2017) - Designing Data-Intensive Applications
    → For your database design and scaling
```

---

## 🎯 SUCCESS METRICS

**Your Agent Must Achieve:**
```
✓ Classification F1 ≥ 0.80
✓ RAG faithfulness ≥ 0.8 (no hallucinations)
✓ Voice turn latency p95 ≤ 1200 ms
✓ Email processing p95 ≤ 3s
✓ Escalation context: Zero loss
✓ 99.9% uptime
✓ 200 concurrent sessions
✓ PII redaction: 100%
```

---

## ⚡ QUICK START

**Week 1: Foundation**
1. Setup PostgreSQL with pgvector extension
2. Create ticket, queue, sla, routing_policy tables
3. Implement basic ticket CRUD API
4. Build NLP classification model (train on sample data)
5. Setup email IMAP connection

**Week 2: RAG Implementation**
1. Create kb_article, kb_chunk, kb_embedding tables
2. Implement document chunking (200-500 tokens)
3. Generate embeddings (OpenAI API)
4. Build semantic search (pgvector cosine similarity)
5. Implement answer synthesis with citations

**Week 3: Integration**
1. Connect email parser → ticket creation
2. Integrate NLP classifier → automatic routing
3. Connect RAG → suggested responses
4. Implement escalation logic
5. End-to-end testing

**Week 4: Polish**
1. Performance optimization
2. Add monitoring and alerting
3. Implement degradation strategies
4. Documentation
5. Load testing

**Ready to build?** Start with ticket CRUD and NLP classification! 🚀
