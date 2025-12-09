# Phase 2 (Completed) – AI Classification + RAG Knowledge Base  
and Phase 3 – Email Ingestion + Escalation Queue (Husnain)

This document explains **everything implemented in Phase 2 and Phase 3** of your Support Agent backend:

- **2A – Ticket Classification with RoBERTa**
- **2B – RAG Knowledge Base Answers with Llama 3.1 (Ollama)**
- **3A – Email Ingestion → Ticket Creation**
- **3B – AI Escalation Flag + Escalated Tickets Queue**

It is written so you (or an examiner) can understand clearly **what we did** and **how it all works end‑to‑end**.

---

## 1. Phase 2A – Ticket Classification (RoBERTa)

### 1.1 Goal

When a new ticket is created, the system should **automatically understand** what it is about and set:

- a **category** (e.g. `account`, `billing`, `technical`, `product`, `general`)
- a **priority** (`low`, `normal`, `high`), using simple rules based on the category

This turns raw tickets into structured, AI‑enriched data.

---

### 1.2 Training Data (CSV)

File:

- `clara-backend/training_data/ticket_classification_roberta.csv`

Contents:

- Columns: `text, category, priority`
- Each row is a short ticket description (subject + description style) with a label, for example:

```csv
text,category,priority
"Cannot login to my account, keeps saying incorrect password.",account,high
"I was charged twice for my monthly subscription.",billing,urgent
"The app crashes every time I click on the save button.",technical,urgent
"How can I upgrade from the basic plan to the premium plan?",product,normal
"I would like to give feedback about your new feature.",general,low
```

We created around **50 base examples** covering different categories and priorities.

During training, the script augments these samples in memory by adding prefixes like:

- `"Customer: " + text`
- `"User report: " + text`
- `"Issue: " + text`
- `"Ticket: " + text`

So the model effectively sees **~275 samples** without you manually writing hundreds of rows.

---

### 1.3 Training Script – RoBERTa Classifier

File:

- `clara-backend/agents/support_agent/train_roberta_classifier.py`

Key points:

- Uses **`roberta-base`** as the base model.
- Uses **PyTorch only** (TensorFlow/Keras disabled via env flags).
- Loads and encodes labels with `LabelEncoder`.
- Splits data into **train / validation** (80/20) with `train_test_split`.
- Trains for up to **10 epochs** using HuggingFace `Trainer`.
- Uses simple metrics: **accuracy** and **weighted F1**.
- Prints final validation metrics and saves model.

Where the model is saved:

- `models/roberta_ticket_category/`
  - RoBERTa weights
  - Tokenizer
  - `label_classes.txt` (mapping from index → category string)

How to run training (from `clara-backend`):

```bash
cd "d:/BS SE/FYP/FYP1-All-Modules-Clone/clara-backend"
python -m agents.support_agent.train_roberta_classifier
```

When finished, you should see logs like:

- decreasing training loss
- `Validation metrics: accuracy: 1.0000, f1: 1.0000` (on this small synthetic set)

---

### 1.4 Inference Helper – Using the Trained Model

File:

- `clara-backend/agents/support_agent/roberta_classifier.py`

Responsibilities:

- Load tokenizer + model + label classes **once** into memory.
- Use **PyTorch only** (TensorFlow disabled):

```python
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["USE_TF"] = "0"
```

- Provide a very simple API:

```python
classify_ticket(text: str) -> str
```

Behavior:

- If model loads correctly:
  - tokenizes the given `text`
  - runs RoBERTa
  - takes argmax over logits
  - returns the label string (e.g. `"billing"`)
- If anything goes wrong (model missing, etc.):
  - returns `"general"` as a safe default.

This helper is imported and used inside `ticket_api.py`.

---

### 1.5 Integration into Ticket Creation

File:

- `clara-backend/agents/support_agent/ticket_api.py`

Relevant pieces:

```python
from .roberta_classifier import classify_ticket

class TicketCreate(BaseModel):
    customer_email: EmailStr
    subject: str
    description: str
    channel: str = "email"
    priority: Optional[str] = None
```

Helper to map category → priority:

```python
def derive_priority_from_category(category: str) -> str:
    category = (category or "").lower()

    if category in {"technical", "billing"}:
        return "high"
    if category in {"account"}:
        return "normal"
    if category in {"product"}:
        return "low"

    # Default for anything unknown or "general"
    return "normal"
```

`create_ticket` flow:

1. Get or create the customer (`customers` table).
2. Build a combined text: `subject + ". " + description`.
3. Call `classify_ticket(text)` to get `predicted_category`.
4. Decide priority:
   - If the request body includes `priority`, keep it.
   - Otherwise use `derive_priority_from_category(predicted_category)`.
5. Insert into `tickets` with:
   - `category = predicted_category`
   - `priority = final_priority`
6. Log to `ticket_history` and return a `TicketResponse`.

Result: **every new ticket** automatically has a category and a reasonable priority, even if the caller does not set them.

---

## 2. Phase 2B – RAG Knowledge Base Answers (Llama 3.1 + Supabase)

### 2.1 Goal

Given a ticket (or explicit question), the system should:

1. Search your **knowledge base** (FAQ articles) using embeddings.
2. Pick the most relevant chunks.
3. Ask a local **Llama 3.1 8B** model (via Ollama) to answer using those chunks.
4. Return:
   - an answer 
   - the sources used.

This turns your support agent into a **retrieval-augmented generation (RAG)** system.

---

### 2.2 Database Tables (Supabase)

Used tables (created earlier in Phase 1 setup):

- `kb_articles`
  - stores full articles (title, content, summary, category, tags, state)
- `kb_chunks`
  - small text chunks from each article
  - columns: `id`, `article_id`, `content`, `order_idx`, etc.
- `kb_embeddings`
  - vector embeddings for each chunk
  - columns: `id`, `chunk_id`, `embedding`, `model`

You already seeded these using the scripts below.

---

### 2.3 Seeding FAQ Articles (2B.1)

File:

- `clara-backend/agents/support_agent/seed_kb_faqs.py`

What it does:

- Loads Supabase credentials from `.env`.
- Connects using `SUPABASE_SERVICE_KEY`.
- Builds about **40–50 FAQ-style articles** in Python:
  - account / login: password reset, account locked, email change, etc.
  - billing: double charges, invoices, refund policy, payment method.
  - technical: crashes, 500 errors, slow pages, email not sending.
  - product: plan selection, upgrades/downgrades, free trials.
  - general: getting started, inviting team, notifications, security basics.
- Inserts them into `kb_articles` with `state = 'published'`.
- Skips an article if another row with the same `title` already exists.

How you ran it:

```bash
cd "d:/BS SE/FYP/FYP1-All-Modules-Clone/clara-backend"
python -m agents.support_agent.seed_kb_faqs
```

Output example:

```text
Prepared 42 FAQ articles.
Inserted 42 new kb_articles (others already existed).
```

---

### 2.4 Building the KB Index (Chunks + Embeddings) (2B.2)

File:

- `clara-backend/agents/support_agent/build_kb_index.py`

Model used for embeddings:

- `sentence-transformers/all-MiniLM-L12-v2` (384‑dim, good quality, efficient)

What the script does:

1. Loads Supabase credentials and connects.
2. Fetches all `kb_articles` where `state = 'published'`.
3. Clears existing `kb_chunks` and `kb_embeddings` (so index stays fresh).
4. For each article:
   - Splits `content` into **chunks** using a simple function:
     - split by blank lines
     - group paragraphs until the chunk reaches ~600 characters
   - Uses `SentenceTransformer` (`all-MiniLM-L12-v2`) to encode each chunk.
   - Inserts into:
     - `kb_chunks` – one row per chunk
     - `kb_embeddings` – one row per chunk with a vector and model name.

Device selection:

- Uses PyTorch only.
- Chooses GPU if `torch.cuda.is_available()`, else CPU.

How you ran it:

```bash
cd "d:/BS SE/FYP/FYP1-All-Modules-Clone/clara-backend"
python -m agents.support_agent.build_kb_index
```

Output example:

```text
Fetching published articles...
Found 46 articles.
Clearing existing KB index (chunks + embeddings)...
Indexed 'How to reset your password' with 1 chunks.
...
Done. Processed 46 articles and created 46 chunks.
```

At this point, the knowledge base is **fully indexed** in Supabase.

---

### 2.5 KB Search Helper (2B.3)

File:

- `clara-backend/agents/support_agent/kb_search.py`

Purpose:

- Embed a **question** using the same model (`all-MiniLM-L12-v2`).
- Load all embeddings from `kb_embeddings`.
- Compute **cosine similarity** between the question vector and each chunk.
- Return the top‑K most relevant chunks along with article info.

Important details:

- Forces Transformers to use PyTorch only:

```python
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["USE_TF"] = "0"
```

- Handles Supabase `embedding` column in multiple formats:
  - raw Python list of floats
  - list of strings
  - JSON string such as `"[0.1, 0.2, ...]"`

Example of robust conversion:

```python
raw_emb = row.get("embedding")
...
if isinstance(raw_emb, str):
    emb_list = json.loads(raw_emb)
else:
    emb_list = raw_emb

emb_list = [float(x) for x in emb_list]
emb_tensor = torch.tensor(emb_list, dtype=torch.float32)
score = _cosine_similarity(q_vec, emb_tensor)
```

Returned structure from `search_kb(question, top_k=5)`:

```python
[
  {
    "chunk_id": ...,
    "score": 0.87,
    "content": "...chunk text...",
    "article_title": "Why was I charged twice?",
    "article_category": "billing",
  },
  ...
]
```

This helper is imported and used in the ticket answer endpoint.

---

### 2.6 Llama 3.1 via Ollama (2B.4)

#### 2.6.1 Local LLM setup (Ollama)

You installed **Ollama** locally and use **Llama 3.1**. Typical commands (outside Python):

```bash
ollama pull llama3.1
ollama run llama3.1
```

The Ollama background service listens on:

- `http://localhost:11434`

We use the **chat API** endpoint:

- `POST http://localhost:11434/api/chat`

Environment variables (in `.env.husnain`):

```env
OLLAMA_API_URL=http://localhost:11434/api/chat
OLLAMA_MODEL_NAME=llama3.1
```

#### 2.6.2 Llama call helper

In `ticket_api.py`:

```python
from .kb_search import search_kb
import requests


def call_llama_knowledge_answer(question: str, contexts: List[dict]) -> str:
    """Call a local Llama 3.1 8B model (via Ollama) to get an answer."""

    api_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
    model_name = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")

    # Build context from KB chunks
    context_texts = []
    for idx, c in enumerate(contexts, start=1):
        title = c.get("article_title") or "Unknown source"
        content = c.get("content") or ""
        context_texts.append(f"Source {idx} - {title}:\n{content}")

    full_context = "\n\n".join(context_texts)

    system_prompt = (
        "You are a helpful support agent. Answer the user's question using only the "
        "information from the provided sources. If the answer is not clearly in the "
        "sources, say that you are not sure. Be concise and friendly."
    )

    user_message = (
        "Question: " + question + "\n\n" +
        "Relevant documentation (sources):\n" + full_context
    )

    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
    }

    try:
        resp = requests.post(api_url, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()

        # Ollama format: data["message"]["content"]
        message = data.get("message") or {}
        content = message.get("content")
        if content:
            return content.strip()

    except Exception as e:
        return (
            "AI answer is not available right now. "
            "Please check the LLM server configuration. Error: " + str(e)
        )

    return "AI answer is not available right now. No response from the model."
```

So the answer pipeline is fully **local** and **open‑source friendly**.

---

### 2.7 Answer Endpoint – `/api/tickets/{ticket_id}/answer`

Still in `ticket_api.py`, we added:

Pydantic models:

```python
class TicketAnswerRequest(BaseModel):
    """Optional explicit question for the answer endpoint.

    If `question` is not provided, we use the ticket subject + description.
    """

    question: Optional[str] = None


class TicketAnswerResponse(BaseModel):
    """Model for the AI-generated ticket answer."""

    ticket_id: str
    answer: str
    sources: List[dict]
```

Endpoint implementation:

```python
@router.post("/{ticket_id}/answer", response_model=TicketAnswerResponse)
async def answer_ticket(ticket_id: str, body: TicketAnswerRequest | None = None):
    """Generate an AI answer for a ticket using KB + Llama 3.1 8B."""

    if not supabase:
        raise HTTPException(500, "Database not configured")

    # 1. Load ticket from Supabase
    ticket_res = supabase.table("tickets").select("id, subject, description").eq("id", ticket_id).execute()
    if not ticket_res.data:
        raise HTTPException(404, "Ticket not found")

    t = ticket_res.data[0]
    subject = t.get("subject") or "Support question"
    description = t.get("description") or ""

    # 2. Decide question text
    user_question = (body.question if body and body.question else None)
    if user_question:
        question = user_question
    else:
        question = f"Customer ticket: {subject}. Details: {description}"

    # 3. Retrieve top KB chunks
    kb_results = search_kb(question, top_k=5)

    # 4. Call Llama model
    answer_text = call_llama_knowledge_answer(question, kb_results)

    # 5. Build sources list
    sources = [
        {
            "content": r.get("content"),
            "article_title": r.get("article_title"),
            "article_category": r.get("article_category"),
            "score": r.get("score"),
        }
        for r in kb_results
    ]

    return TicketAnswerResponse(
        ticket_id=str(ticket_id),
        answer=answer_text,
        sources=sources,
    )
```

Result: given a ticket ID, the backend can now **search the KB and produce a grounded AI answer**.

---

## 3. How to Run and Test Phase 2 End‑to‑End

### 3.1 Start the backend

From `clara-backend`:

```bash
python main_husnain.py
```

Check:

- `http://localhost:8001/health` → should return a simple OK JSON.
- `http://localhost:8001/docs` → should show all ticket endpoints.

---

### 3.2 Ensure Ollama + Llama 3.1 are running

In a separate terminal:

```bash
ollama pull llama3.1   # run once
ollama run llama3.1    # optional interactive test, then Ctrl+C
```

The Ollama background service now listens on `http://localhost:11434`.

Confirm via:

```bash
curl http://localhost:11434/api/tags
```

You should see a JSON list including `"llama3.1"`.

---

### 3.3 Test ticket creation with auto classification

In Postman (or another REST client):

- **POST** `http://localhost:8001/api/tickets/`
- Headers: `Content-Type: application/json`
- Body example:

```json
{
  "customer_email": "billing@test.com",
  "subject": "I was charged twice for my subscription",
  "description": "My bank statement shows two payments for this month. Why did this happen and can I get a refund?",
  "channel": "email"
}
```

You should receive:

- `201 Created`
- A JSON response with:
  - `category` around `"billing"`
  - `priority` auto set to `"high"`

Copy the `id` field from this response – you need it for the answer step.

---

### 3.4 Test the RAG answer endpoint

Using the `id` from the previous step:

- **POST** `http://localhost:8001/api/tickets/{ticket_id}/answer`
  (for example: `http://localhost:8001/api/tickets/43a1a4fb-d820-4f06-886b-d36da3e236c6/answer`)
- Headers: `Content-Type: application/json`
- Body (either):

```json
{}
```

or:

```json
{
  "question": "Explain why I might see two charges and how your refund policy works."
}
```

Expected response:

```json
{
  "ticket_id": "...",
  "answer": "It is possible to see two charges if ... (Llama explanation based on 'Why was I charged twice?' and 'Refund policy')",
  "sources": [
    {
      "content": "...FAQ text from 'Why was I charged twice?'...",
      "article_title": "Why was I charged twice?",
      "article_category": "billing",
      "score": 0.87
    },
    {
      "content": "...FAQ text from 'Refund policy'...",
      "article_title": "Refund policy",
      "article_category": "billing",
      "score": 0.82
    }
  ]
}
```

If Ollama is not running or misconfigured, `answer` will contain a clear error message produced by `call_llama_knowledge_answer` instead of a crash.

---

## 4. Summary – What Phase 2 Has Achieved

By the end of Phase 2:

1. **Every new ticket** is automatically enriched with:
   - AI‑predicted **category** using a fine‑tuned RoBERTa classifier.
   - **Priority** derived from the category by simple transparent rules.

2. You have a **knowledge base** in Supabase:
   - `kb_articles` containing ~40–50 FAQs.
   - `kb_chunks` and `kb_embeddings` built using `all-MiniLM-L12-v2`.

3. You have a **RAG pipeline**:
   - `kb_search.search_kb(question)` for semantic retrieval.
   - `call_llama_knowledge_answer` to query **Llama 3.1 8B via Ollama**.
   - `POST /api/tickets/{ticket_id}/answer` to provide grounded answers with sources.

4. Everything runs **locally** on your machine using **open‑source** tools:
   - PyTorch, HuggingFace Transformers, SentenceTransformers.
   - Supabase (PostgreSQL + pgvector) as the vector store.
   - Ollama + Llama 3.1 8B as the LLM.

This completes **Phase 2** of your project: the system can now classify, search knowledge, and answer support tickets using AI in an understandable and controllable way.

---

## 5. Phase 3 – Email Ingestion + Escalation (Completed)

Phase 3 builds on top of Phase 2. Instead of only creating tickets from the UI/API, the system can now:

- **Ingest emails** and convert them into tickets.
- Use AI to answer these tickets (same RAG + Llama pipeline).
- Mark tickets that still **need human review** using a dedicated flag.
- Expose an **escalated tickets queue** endpoint and UI section for agents.

All of this is implemented using the same Supabase backend and FastAPI application.

---

### 5.1 Database Changes – `needs_human_review`

To support escalation, we extended the `tickets` table with a new boolean column:

```sql
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS needs_human_review boolean DEFAULT false;
```

Meaning:

- `needs_human_review = false` (default):
  - Ticket does **not** currently require a human agent (either no AI answer yet, or AI confidently resolved it).
- `needs_human_review = true`:
  - AI has provided an answer, but the ticket still requires a human to review or complete it (low confidence or not auto‑resolved).

This column is now part of the backend response model `TicketResponse` and is visible in the UI JSON.

---

### 5.2 Email Ingestion Endpoint – `/api/tickets/email_ingest`

**Goal:** simulate real‑world email support, where each incoming email becomes a ticket that flows through the same AI pipeline.

#### 5.2.1 Request model

In `ticket_api.py` we added a Pydantic model:

```python
class EmailIngestRequest(BaseModel):
    """Model for email ingestion endpoint (Phase 3).
    
    Represents an incoming email that should be converted to a support ticket.
    """
    
    from_email: EmailStr
    subject: str
    body: str
    message_id: Optional[str] = None  # Optional email message ID for tracking
```

#### 5.2.2 Endpoint implementation

```python
@router.post("/email_ingest", response_model=TicketResponse, status_code=201)
async def ingest_email(email: EmailIngestRequest):
    """Phase 3: Email Ingestion Endpoint
    
    Converts an incoming email into a support ticket.
    
    Flow:
    1. Find or create customer based on email address
    2. Use email subject as ticket subject
    3. Use email body as ticket description
    4. Auto-classify using RoBERTa (category + priority)
    5. Set channel to "email"
    6. Create ticket in database
    7. Log to ticket history
    
    The AI answer is NOT generated here - call POST /api/tickets/{id}/answer separately.
    """
```

High‑level behaviour:

1. **Customer resolution**
   - Uses `get_or_create_customer(email.from_email)` to ensure every email is linked to a customer in `customers`.

2. **Classification**
   - Builds `classification_text = f"{email.subject}. {email.body}"`.
   - Calls `classify_ticket(classification_text)` to get `predicted_category`.
   - Maps category → priority using `derive_priority_from_category`.

3. **Ticket creation**
   - Inserts a row into `tickets` with:
     - `subject = email.subject`
     - `description = email.body`
     - `channel = "email"`
     - `category = predicted_category`
     - `priority = final_priority`
     - `status = "open"`
   - Logs a history entry in `ticket_history`:
     - `"comment": "Ticket created from email ingestion (from: from_email)"`

4. **Response**
   - Returns a full `TicketResponse`, including the newly created ticket ID, so the caller can immediately call `/answer` or look it up.

This means **emails and UI‑created tickets are treated the same** once they exist in the `tickets` table.

---

### 5.3 Escalation Logic – `needs_human_review`

The escalation logic lives primarily inside the **answer endpoint**:

```python
@router.post("/{ticket_id}/answer", response_model=TicketAnswerResponse)
async def answer_ticket(ticket_id: str, body: TicketAnswerRequest | None = None):
    ...
    # 3. Retrieve top KB chunks related to this question
    kb_results = search_kb(question, top_k=5)

    # 4. Call local Llama model to generate an answer
    answer_text = call_llama_knowledge_answer(question, kb_results)

    # 5. Update the ticket with the AI answer and maybe auto-resolve
    top_score = 0.0
    if kb_results:
        try:
            top_score = float(kb_results[0].get("score") or 0.0)
        except Exception:
            top_score = 0.0

    high_confidence = top_score >= 0.85

    update_data = {
        "resolution": answer_text,
        "updated_at": datetime.utcnow().isoformat(),
    }
    if high_confidence:
        update_data["status"] = "resolved"
        update_data["resolved_at"] = datetime.utcnow().isoformat()
        update_data["needs_human_review"] = False
    else:
        # AI answer exists but either low confidence or status not auto-resolved
        update_data["needs_human_review"] = True

    supabase.table("tickets").update(update_data).eq("id", ticket_id).execute()
```

Interpretation:

- **High confidence (>= 0.85)**:
  - Ticket is **auto‑resolved by AI**.
  - `status = "resolved"`
  - `needs_human_review = false`
- **Low confidence (< 0.85)** or poor KB match:
  - Ticket **remains open** (or keeps its existing status).
  - `needs_human_review = true` (explicit escalation signal).

This flag is now part of:

- `create_ticket` and `ingest_email` responses (as `needs_human_review`, usually `false` initially).
- `list_tickets` and `get_ticket` (returned with every ticket).

The **UI uses both `needs_human_review` and confidence** to display clear messages like:

- "✅ Ticket RESOLVED by AI (confidence: 0.91)".
- "⚠️ Needs human review (confidence: 0.43) – AI answer exists but status is \"open\".".
- "📭 Ticket status: open (no AI answer yet)".

---

### 5.4 Escalated Tickets Endpoint – `/api/tickets/escalated`

To give agents a simple **queue of tickets that still need a human**, we added:

```python
@router.get("/escalated", response_model=List[TicketResponse])
async def list_escalated_tickets(limit: int = Query(50, le=100, description="Number of tickets")):
    """List tickets that currently need human review.

    This simply returns tickets where `needs_human_review = true`.
    """

    if not supabase:
        raise HTTPException(500, "Database not configured")

    try:
        query = (
            supabase
            .table("tickets")
            .select("*, customers(email, name)")
            .eq("needs_human_review", True)
            .order("created_at", desc=True)
            .limit(limit)
        )

        response = query.execute()

        tickets: List[TicketResponse] = []
        for t in response.data:
            customer = t.get("customers", {})
            tickets.append(
                TicketResponse(
                    id=str(t["id"]),
                    customer_id=str(t["customer_id"]) if t.get("customer_id") else None,
                    customer_email=customer.get("email") if customer else None,
                    customer_name=customer.get("name") if customer else None,
                    subject=t["subject"],
                    description=t["description"],
                    channel=t["channel"],
                    category=t.get("category"),
                    priority=t["priority"],
                    status=t["status"],
                    resolution=t.get("resolution"),
                    needs_human_review=t.get("needs_human_review"),
                    created_at=t["created_at"],
                    updated_at=t["updated_at"],
                )
            )

        return tickets

    except Exception as e:
        raise HTTPException(500, f"Error listing escalated tickets: {str(e)}")
```

Usage examples (Postman / curl):

- **GET** `http://localhost:8001/api/tickets/escalated`
  - Returns an array of tickets where `needs_human_review = true`.
  - Each item has all the normal ticket fields plus `resolution` and `needs_human_review`.

This is effectively the **agent queue** of tickets that AI could not confidently close.

---

### 5.5 UI – Simple Test Page (Create → Answer → Lookup → Escalated)

File:

- `clara-backend/agents/support_agent/simple_ui.html`

This is a small, self‑contained HTML page (no frameworks) that talks directly to your API:

1. **Section 0 – Email Ingestion (Phase 3)**
   - Simulates an incoming support email.
   - Fields: `From Email`, `Email Subject`, `Email Body`.
   - Button: **"Ingest Email → Create Ticket"**.
   - Calls `POST /api/tickets/email_ingest`.
   - Displays the created ticket JSON and summary.
   - Auto‑fills the ticket ID into the "Get AI Answer" and "Lookup" sections.

2. **Section 1 – Create Ticket**
   - Manually create a ticket (without going through email).
   - Uses `POST /api/tickets/`.
   - Shows AI‑predicted `category` and `priority`.

3. **Section 2 – Get AI Answer**
   - Field: `Ticket ID`.
   - Button: **"Generate AI Answer"**.
   - Calls `POST /api/tickets/{id}/answer`.
   - Shows:
     - Raw JSON from the answer endpoint.
     - A formatted text view with the answer and sources.

4. **Section 3 – Lookup Ticket**
   - Field: `Ticket ID`.
   - Button: **"Lookup Ticket"**.
   - Calls `GET /api/tickets/{id}`.
   - Shows:
     - Full ticket JSON (including `resolution`, `needs_human_review`, and computed `confidence`).
     - A human‑readable summary.
     - A status line that indicates:
       - **Resolved by AI** (high confidence), or
       - **Needs human review** (AI answer exists but low confidence or not resolved), or
       - **No AI answer yet**.

5. **Section 4 – Escalated Tickets (Agent Queue)**
   - Button: **"Load Escalated Tickets"**.
   - Calls `GET /api/tickets/escalated`.
   - Shows:
     - How many tickets currently **need human review**.
     - Raw JSON list of escalated tickets.

This UI is primarily for **testing and demonstration**, but it visually proves that:

- Tickets are created from both UI and email ingestion.
- AI classification and RAG answer are working.
- Escalation rules and the escalated queue behave as expected.

---

## 6. Final Summary – Phase 2 + Phase 3 Status

By the end of **Phase 2 and Phase 3**, your Support Agent system can:

1. **Ingest tickets from multiple channels**:
   - Direct API / UI (`POST /api/tickets/`).
   - Email ingestion (`POST /api/tickets/email_ingest`).

2. **Enrich every ticket with AI metadata**:
   - Category via **RoBERTa classifier**.
   - Priority via simple, transparent rules.

3. **Answer tickets using RAG + local LLM**:
   - Knowledge base seeded and indexed in **Supabase** (`kb_articles`, `kb_chunks`, `kb_embeddings`).
   - `search_kb` to retrieve relevant FAQ chunks.
   - `call_llama_knowledge_answer` to query **Llama 3.1 8B via Ollama**.
   - `POST /api/tickets/{ticket_id}/answer` to generate grounded answers with sources.

4. **Automatically decide when to escalate to a human**:
   - Uses similarity score from KB search as a **confidence signal**.
   - If confidence is high (`>= 0.85`): ticket is **auto‑resolved by AI**.
   - Otherwise: `needs_human_review = true` and ticket enters the escalated queue.

5. **Provide a clear agent queue**:
   - `GET /api/tickets/escalated` returns all tickets that need human review.
   - The UI shows these as "Escalated Tickets (Need Human Review)".

6. **Offer a simple but complete test UI**:
   - Demonstrates the full flow: Email → Ticket → AI Answer → Lookup → Escalated Queue.
   - Useful for live demos, examiner walkthroughs, and debugging.

Overall, **Phase 2 and Phase 3 are implemented and working**: you now have an AI‑powered support backend that can classify, search a knowledge base, generate answers, and escalate intelligently to human agents when needed.
