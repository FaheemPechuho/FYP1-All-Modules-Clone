"""
Ticket API - Support Agent Core
Husnain's Implementation with Supabase
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import uuid4
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from .roberta_classifier import classify_ticket, classify_ticket_with_confidence
from .kb_search import search_kb
import requests

load_dotenv()

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])

# Supabase client (using SERVICE_ROLE for backend operations)
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    print("⚠️  WARNING: Supabase credentials not found in .env")
    supabase: Client = None
else:
    supabase: Client = create_client(supabase_url, supabase_key)
    print("✅ Supabase client initialized (service_role)")


# Simple in-memory message store for demo/chat UI
# Keyed by ticket_id -> list of message dicts
IN_MEMORY_MESSAGES: dict[str, list[dict]] = {}


# ─────────────────────────────────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    customer_email: EmailStr
    subject: str
    description: str
    channel: str = "email"
    priority: Optional[str] = None


class TicketUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    resolution: Optional[str] = None
    needs_human_review: Optional[bool] = None


class TicketResponse(BaseModel):
    id: str
    customer_id: Optional[str]
    customer_email: Optional[str]
    customer_name: Optional[str]
    subject: str
    description: str
    channel: str
    category: Optional[str]
    priority: str
    status: str
    resolution: Optional[str] = None
    needs_human_review: Optional[bool] = None
    created_at: str
    updated_at: str
    confidence: Optional[float] = None


class TicketAnswerRequest(BaseModel):
    """Optional explicit question for the answer endpoint.

    If `question` is not provided, we will use the ticket subject + description.
    """

    question: Optional[str] = None


class TicketAnswerResponse(BaseModel):
    """Model for the AI-generated ticket answer."""

    ticket_id: str
    answer: str
    sources: List[dict]


class TicketMessageCreate(BaseModel):
    """Create a new message for a ticket.

    Frontend currently sends ticket_id in the path and this payload as body.
    We allow optional sender metadata so the UI can show real agent names.
    """

    content: str
    content_type: str | None = "text"
    sender_type: str | None = "agent"  # customer | agent | system | ai_bot
    sender_id: str | None = None
    sender_name: str | None = None


class TicketMessageResponse(BaseModel):
    id: str
    ticket_id: str
    sender_type: str
    sender_id: str | None = None
    sender_name: str
    sender_avatar: str | None = None
    content: str
    content_type: str
    is_ai_generated: bool
    ai_suggested: bool
    is_read: bool
    read_at: str | None = None
    created_at: str
    updated_at: str


class EmailIngestRequest(BaseModel):
    """Model for email ingestion endpoint (Phase 3).
    
    Represents an incoming email that should be converted to a support ticket.
    """
    
    from_email: EmailStr
    subject: str
    body: str
    message_id: Optional[str] = None  # Optional email message ID for tracking


# ─────────────────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────

def get_or_create_customer(email: str):
    """Find existing customer or create new one"""
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    # Check if customer exists
    response = supabase.table("customers").select("*").eq("email", email).execute()
    
    if response.data and len(response.data) > 0:
        return response.data[0]
    
    # Create new customer
    customer_data = {
        "email": email,
        "name": email.split('@')[0],  # Use email prefix as name
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = supabase.table("customers").insert(customer_data).execute()
    
    if response.data and len(response.data) > 0:
        return response.data[0]
    
    raise HTTPException(500, "Failed to create customer")


def derive_priority_from_category(category: str) -> str:
    """Simple rule-based mapping from category -> priority.

    This keeps logic easy to understand while still using the model output.
    You can adjust these rules later if needed.
    """

    category = (category or "").lower()

    if category in {"technical", "billing"}:
        return "high"
    if category in {"account"}:
        return "normal"
    if category in {"product"}:
        return "low"

    # Default for anything unknown or "general"
    return "normal"


def call_llama_knowledge_answer(question: str, contexts: List[dict]) -> str:
    """Call a local Llama 3.1 8B model (via Ollama) to get an answer.

    This function is designed for a local Ollama setup.

    Configuration (via environment variables):
    - OLLAMA_API_URL: chat endpoint, default http://localhost:11434/api/chat
    - OLLAMA_MODEL_NAME: model name, default "llama3.1"

    If the call fails, we return a simple fallback string instead of crashing.
    """

    api_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
    model_name = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")

    # Build a simple context block from the retrieved KB chunks
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

    # Ollama chat API format
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

        # Ollama chat response format:
        # {
        #   "model": "llama3.1",
        #   "created_at": "...",
        #   "message": {"role": "assistant", "content": "..."},
        #   "done": true,
        #   ...
        # }
        message = data.get("message") or {}
        content = message.get("content")
        if content:
            return content.strip()

    except Exception as e:
        # Fallback if LLM call fails for any reason
        return (
            "AI answer is not available right now. "
            "Please check the LLM server configuration. Error: " + str(e)
        )

    return "AI answer is not available right now. No response from the model."


# ─────────────────────────────────────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────

@router.post("/", response_model=TicketResponse, status_code=201)
async def create_ticket(ticket: TicketCreate):
    """
    Create a new support ticket
    
    - Finds or creates customer
    - Creates ticket with default queue
    - Returns ticket details
    """
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        # 1. Get or create customer
        customer = get_or_create_customer(ticket.customer_email)

        # 2. Build a single text string for the classifier
        #    (subject + description gives better context)
        classification_text = f"{ticket.subject}. {ticket.description}"

        # 3. Use RoBERTa model to predict CATEGORY + CONFIDENCE
        classification_result = classify_ticket_with_confidence(classification_text)
        predicted_category = classification_result["category"]
        ai_confidence = classification_result["confidence"]

        # 4. Decide PRIORITY
        #    - If user passed a priority, we keep it
        #    - Otherwise we map from predicted category using simple rules
        final_priority = ticket.priority or derive_priority_from_category(predicted_category)

        # 5. Create ticket (now including category + priority + confidence)
        ticket_data = {
            "customer_id": customer["id"],
            "subject": ticket.subject,
            "description": ticket.description,
            "channel": ticket.channel,
            "category": predicted_category,
            "priority": final_priority,
            "status": "open",
            "confidence": ai_confidence,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("tickets").insert(ticket_data).execute()
        
        if not response.data:
            raise HTTPException(500, "Failed to create ticket")
        
        new_ticket = response.data[0]

        # 6. Log creation to history
        history_data = {
            "ticket_id": new_ticket["id"],
            "action": "created",
            "comment": "Ticket created via API",
            "new_values": {"status": "open", "channel": ticket.channel},
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("ticket_history").insert(history_data).execute()

        # 7. Build response (no auto-answer, user will manually call /answer endpoint)
        return TicketResponse(
            id=str(new_ticket["id"]),
            customer_id=str(customer["id"]),
            customer_email=customer["email"],
            customer_name=customer["name"],
            subject=new_ticket["subject"],
            description=new_ticket["description"],
            channel=new_ticket["channel"],
            category=new_ticket.get("category"),
            priority=new_ticket["priority"],
            status=new_ticket["status"],
            resolution=new_ticket.get("resolution"),
            needs_human_review=new_ticket.get("needs_human_review"),
            created_at=new_ticket["created_at"],
            updated_at=new_ticket["updated_at"],
            confidence=new_ticket.get("confidence"),
        )
        
    except Exception as e:
        raise HTTPException(500, f"Error creating ticket: {str(e)}")


@router.post("/email_ingest", response_model=TicketResponse, status_code=201)
async def ingest_email(email: EmailIngestRequest):
    """
    Phase 3: Email Ingestion Endpoint
    
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
    
    Args:
        email: EmailIngestRequest with from_email, subject, body
        
    Returns:
        TicketResponse with created ticket details
    """
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        # 1. Get or create customer from email sender
        customer = get_or_create_customer(email.from_email)
        
        # 2. Build classification text from email content
        classification_text = f"{email.subject}. {email.body}"
        
        # 3. Use RoBERTa to predict category + CONFIDENCE
        classification_result = classify_ticket_with_confidence(classification_text)
        predicted_category = classification_result["category"]
        ai_confidence = classification_result["confidence"]
        
        # 4. Derive priority from category
        final_priority = derive_priority_from_category(predicted_category)
        
        # 5. Create ticket data (channel is always "email" for ingested emails)
        ticket_data = {
            "customer_id": customer["id"],
            "subject": email.subject,
            "description": email.body,
            "channel": "email",
            "category": predicted_category,
            "priority": final_priority,
            "status": "open",
            "confidence": ai_confidence,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # 6. Insert ticket into Supabase
        response = supabase.table("tickets").insert(ticket_data).execute()
        
        if not response.data:
            raise HTTPException(500, "Failed to create ticket from email")
        
        new_ticket = response.data[0]
        
        # 7. Log to history (mark as created from email)
        history_data = {
            "ticket_id": new_ticket["id"],
            "action": "created",
            "comment": f"Ticket created from email ingestion (from: {email.from_email})",
            "new_values": {
                "status": "open",
                "channel": "email",
                "message_id": email.message_id
            },
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("ticket_history").insert(history_data).execute()
        
        # 8. Return ticket response
        return TicketResponse(
            id=str(new_ticket["id"]),
            customer_id=str(customer["id"]),
            customer_email=customer["email"],
            customer_name=customer["name"],
            subject=new_ticket["subject"],
            description=new_ticket["description"],
            channel=new_ticket["channel"],
            category=new_ticket.get("category"),
            priority=new_ticket["priority"],
            status=new_ticket["status"],
            resolution=new_ticket.get("resolution"),
            needs_human_review=new_ticket.get("needs_human_review"),
            created_at=new_ticket["created_at"],
            updated_at=new_ticket["updated_at"],
            confidence=new_ticket.get("confidence"),
        )
        
    except Exception as e:
        raise HTTPException(500, f"Error ingesting email: {str(e)}")


@router.get("/", response_model=List[TicketResponse])
async def list_tickets(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    limit: int = Query(50, le=100, description="Number of tickets")
):
    """
    List tickets with optional filters
    """
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        # Build query
        query = supabase.table("tickets").select(
            "*, customers(email, name)"
        )
        
        if status:
            query = query.eq("status", status)
        
        if priority:
            query = query.eq("priority", priority)
        
        query = query.order("created_at", desc=True).limit(limit)
        
        response = query.execute()
        
        # Format response
        tickets = []
        for t in response.data:
            customer = t.get("customers", {})
            tickets.append(TicketResponse(
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
                updated_at=t["updated_at"]
            ))
        
        return tickets
        
    except Exception as e:
        raise HTTPException(500, f"Error listing tickets: {str(e)}")


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


@router.get("/stats")
async def get_ticket_stats():
    """Return high-level ticket statistics for admin/monitoring views.

    All values are computed directly from the database so that the metrics
    always reflect the latest state.
    """

    if not supabase:
        raise HTTPException(500, "Database not configured")

    try:
        # Total tickets
        total_res = supabase.table("tickets").select("id", count="exact").execute()
        total_tickets = total_res.count or 0

        # Open tickets (status = 'open')
        open_res = (
            supabase.table("tickets")
            .select("id", count="exact")
            .eq("status", "open")
            .execute()
        )
        open_tickets = open_res.count or 0

        # Resolved tickets (status = 'resolved')
        resolved_res = (
            supabase.table("tickets")
            .select("id", count="exact")
            .eq("status", "resolved")
            .execute()
        )
        resolved_tickets = resolved_res.count or 0

        # Tickets that currently need human review
        nhr_res = (
            supabase.table("tickets")
            .select("id", count="exact")
            .eq("needs_human_review", True)
            .execute()
        )
        needs_human_review = nhr_res.count or 0

        # Tickets resolved by AI: resolved AND does not need human review
        resolved_ai_res = (
            supabase.table("tickets")
            .select("id", count="exact")
            .eq("status", "resolved")
            .eq("needs_human_review", False)
            .execute()
        )
        resolved_by_ai = resolved_ai_res.count or 0

        return {
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "resolved_tickets": resolved_tickets,
            "needs_human_review": needs_human_review,
            "resolved_by_ai": resolved_by_ai,
        }

    except Exception as e:
        raise HTTPException(500, f"Error computing ticket stats: {str(e)}")


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: str):
    """
    Get a single ticket by ID
    """
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        response = supabase.table("tickets").select(
            "*, customers(email, name)"
        ).eq("id", ticket_id).execute()
        
        if not response.data:
            raise HTTPException(404, "Ticket not found")
        
        t = response.data[0]
        customer = t.get("customers", {})

        # Compute confidence score on the fly using KB
        confidence: Optional[float] = None
        try:
            question = f"{t['subject']}. {t['description']}"
            kb_results = search_kb(question, top_k=1)
            if kb_results:
                confidence = float(kb_results[0].get("score") or 0.0)
        except Exception:
            confidence = None

        return TicketResponse(
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
            confidence=confidence,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error getting ticket: {str(e)}")


@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(ticket_id: str, updates: TicketUpdate):
    """
    Update a ticket (partial update)
    """
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        # Get current ticket
        current = supabase.table("tickets").select("*").eq("id", ticket_id).execute()
        
        if not current.data:
            raise HTTPException(404, "Ticket not found")
        
        # Build update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if updates.subject is not None:
            update_data["subject"] = updates.subject
        if updates.description is not None:
            update_data["description"] = updates.description
        if updates.status is not None:
            update_data["status"] = updates.status
            if updates.status == "resolved":
                update_data["resolved_at"] = datetime.utcnow().isoformat()
            elif updates.status == "closed":
                update_data["closed_at"] = datetime.utcnow().isoformat()
        if updates.priority is not None:
            update_data["priority"] = updates.priority
        if updates.resolution is not None:
            update_data["resolution"] = updates.resolution
        if updates.needs_human_review is not None:
            update_data["needs_human_review"] = updates.needs_human_review
        
        # Update ticket
        response = supabase.table("tickets").update(update_data).eq("id", ticket_id).execute()
        
        if not response.data:
            raise HTTPException(500, "Failed to update ticket")
        
        # Log to history
        history_data = {
            "ticket_id": ticket_id,
            "action": "updated",
            "comment": "Ticket updated via API",
            "old_values": {"status": current.data[0]["status"]},
            "new_values": update_data,
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase.table("ticket_history").insert(history_data).execute()
        
        # Return updated ticket
        return await get_ticket(ticket_id)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating ticket: {str(e)}")


@router.delete("/{ticket_id}", status_code=204)
async def delete_ticket(ticket_id: str):
    """
    Delete a ticket (soft delete - sets status to closed)
    """
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        update_data = {
            "status": "closed",
            "closed_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("tickets").update(update_data).eq("id", ticket_id).execute()
        
        if not response.data:
            raise HTTPException(404, "Ticket not found")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error deleting ticket: {str(e)}")


@router.get("/{ticket_id}/history")
async def get_ticket_history(ticket_id: str):
    """
    Get ticket history/audit trail
    """
    if not supabase:
        raise HTTPException(500, "Database not configured")
    
    try:
        response = supabase.table("ticket_history").select(
            "*, users(display_name)"
        ).eq("ticket_id", ticket_id).order("created_at", desc=True).execute()
        
        return {
            "ticket_id": ticket_id,
            "history": response.data
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error getting history: {str(e)}")


@router.post("/{ticket_id}/answer", response_model=TicketAnswerResponse)
async def answer_ticket(ticket_id: str, body: TicketAnswerRequest | None = None):
    """Generate an AI answer for a ticket using KB + Llama 3.1 8B.

    Flow:
    - Load ticket (subject + description)
    - Build a natural-language question
    - Retrieve top KB chunks with `search_kb`
    - Send question + chunks to local Llama server
    - Return answer text and the sources used
    """

    if not supabase:
        raise HTTPException(500, "Database not configured")

    # 1. Load ticket from Supabase
    ticket_res = supabase.table("tickets").select("id, subject, description").eq("id", ticket_id).execute()
    if not ticket_res.data:
        raise HTTPException(404, "Ticket not found")

    t = ticket_res.data[0]
    subject = t.get("subject") or "Support question"
    description = t.get("description") or ""

    # 2. Decide which question text to use
    user_question = (body.question if body and body.question else None)
    if user_question:
        question = user_question
    else:
        question = f"Customer ticket: {subject}. Details: {description}"

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

    # 6. Log AI answer to history
    if high_confidence:
        action = "auto_resolved"
        comment = "Ticket auto-resolved by AI answer (RAG)"
        new_values = {"status": "resolved"}
    else:
        action = "auto_answered"
        comment = "AI answer generated (status unchanged)"
        new_values = {}

    history_data = {
        "ticket_id": ticket_id,
        "action": action,
        "comment": comment,
        "new_values": new_values,
        "created_at": datetime.utcnow().isoformat(),
    }
    supabase.table("ticket_history").insert(history_data).execute()

    # 7. Prepare simple sources list for the response
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


@router.get("/{ticket_id}/messages", response_model=List[TicketMessageResponse])
async def get_ticket_messages(ticket_id: str):
    """Return all messages for a given ticket.

    **Simplified demo implementation**
    - Uses an in-memory dictionary instead of a database table.
    - Good enough to demonstrate a working chat UI.
    """

    raw_messages = IN_MEMORY_MESSAGES.get(str(ticket_id), [])
    results: List[TicketMessageResponse] = []
    for m in raw_messages:
        results.append(
            TicketMessageResponse(
                id=str(m["id"]),
                ticket_id=str(m["ticket_id"]),
                sender_type=m.get("sender_type") or "customer",
                sender_id=m.get("sender_id"),
                sender_name=m.get("sender_name") or "User",
                sender_avatar=m.get("sender_avatar"),
                content=m.get("content") or "",
                content_type=m.get("content_type") or "text",
                is_ai_generated=bool(m.get("is_ai_generated") or False),
                ai_suggested=bool(m.get("ai_suggested") or False),
                is_read=bool(m.get("is_read") or True),
                read_at=m.get("read_at"),
                created_at=m.get("created_at") or datetime.utcnow().isoformat(),
                updated_at=m.get("updated_at") or datetime.utcnow().isoformat(),
            )
        )

    return results


@router.post("/{ticket_id}/messages", response_model=TicketMessageResponse, status_code=201)
async def create_ticket_message(ticket_id: str, body: TicketMessageCreate):
    """Create a new message on a ticket.

    **Simplified demo implementation**
    - Does not write to the database.
    - Stores messages in memory so the chat UI works for now.
    """

    now = datetime.utcnow().isoformat()
    ticket_id_str = str(ticket_id)

    message_dict = {
        "id": str(uuid4()),
        "ticket_id": ticket_id_str,
        "sender_type": body.sender_type or "agent",
        "sender_id": body.sender_id,
        "sender_name": body.sender_name or "Agent",
        "sender_avatar": None,
        "content": body.content,
        "content_type": body.content_type or "text",
        "is_ai_generated": False,
        "ai_suggested": False,
        "is_read": True,
        "read_at": None,
        "created_at": now,
        "updated_at": now,
    }

    # Append to in-memory store
    IN_MEMORY_MESSAGES.setdefault(ticket_id_str, []).append(message_dict)

    return TicketMessageResponse(**message_dict)
