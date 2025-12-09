# 🎯 HUSNAIN'S IMPLEMENTATION GUIDE - PART 2: RAG SYSTEM

## **WEEK 2: FAQ/RAG SYSTEM (100% FREE)**

This is your **MOST IMPORTANT** component. RAG = Retrieval-Augmented Generation.

---

### **Day 1-2: Knowledge Base Schema & Setup**

```sql
-- File: clara-backend/database/kb_schema.sql

-- 1. KB Articles
CREATE TABLE kb_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,  -- Full article content
    summary TEXT,
    
    -- Metadata
    category TEXT,
    tags TEXT[],
    author_id UUID REFERENCES users(id),
    
    -- Workflow state
    state TEXT CHECK (state IN ('draft', 'review', 'published', 'deprecated')) DEFAULT 'draft',
    
    -- Versioning
    version INT DEFAULT 1,
    parent_id UUID REFERENCES kb_articles(id),  -- For versioning
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Search
    search_vector tsvector  -- For full-text search
);

CREATE INDEX idx_kb_articles_state ON kb_articles(state);
CREATE INDEX idx_kb_articles_category ON kb_articles(category);
CREATE INDEX idx_kb_articles_published ON kb_articles(published_at DESC);
CREATE INDEX idx_kb_articles_search ON kb_articles USING GIN(search_vector);


-- 2. KB Chunks (for RAG)
CREATE TABLE kb_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
    
    -- Chunk content
    content TEXT NOT NULL,
    order_idx INT NOT NULL,  -- Position in article
    
    -- Metadata
    token_count INT,  -- Number of tokens
    start_char INT,   -- Start position in original article
    end_char INT,     -- End position
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (article_id, order_idx)
);

CREATE INDEX idx_kb_chunks_article ON kb_chunks(article_id);


-- 3. Install pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;


-- 4. KB Embeddings (vector representations)
CREATE TABLE kb_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID UNIQUE REFERENCES kb_chunks(id) ON DELETE CASCADE,
    
    -- Embedding vector (384 dimensions for all-MiniLM-L6-v2)
    embedding VECTOR(384) NOT NULL,
    
    -- Metadata
    model TEXT NOT NULL DEFAULT 'all-MiniLM-L6-v2',
    model_version TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL: Create index for fast similarity search
CREATE INDEX kb_embeddings_ivfflat_idx 
    ON kb_embeddings 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);  -- Adjust based on data size

-- For small datasets (< 1000 vectors), use ivfflat lists=10
-- For large datasets (> 10000 vectors), use lists=1000


-- 5. Citations (track which chunks were used in answers)
CREATE TABLE citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES kb_chunks(id),
    article_id UUID REFERENCES kb_articles(id),
    
    -- Citation details
    relevance_score FLOAT,  -- Cosine similarity
    snippet TEXT,  -- Actual text cited
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_citations_ticket ON citations(ticket_id);


-- 6. Trigger to update search_vector
CREATE OR REPLACE FUNCTION kb_articles_search_trigger() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'C');
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER kb_articles_search_update
    BEFORE INSERT OR UPDATE ON kb_articles
    FOR EACH ROW
    EXECUTE FUNCTION kb_articles_search_trigger();


-- 7. Sample data (for testing)
INSERT INTO kb_articles (title, content, summary, category, state, published_at) VALUES
(
    'How to Reset Your Password',
    E'To reset your password:\n\n1. Go to the login page\n2. Click "Forgot Password?"\n3. Enter your email address\n4. Check your email for a reset link\n5. Click the link and enter your new password\n6. Confirm your new password\n\nNote: Password must be at least 8 characters and include a number and special character.\n\nIf you don''t receive the email within 5 minutes, check your spam folder.',
    'Step-by-step guide to reset your password',
    'account_management',
    'published',
    NOW()
),
(
    'Billing and Payment FAQ',
    E'Common billing questions:\n\nQ: When will I be charged?\nA: Charges occur on the 1st of each month.\n\nQ: What payment methods do you accept?\nA: We accept Visa, MasterCard, American Express, and PayPal.\n\nQ: How do I update my billing information?\nA: Log in to your account, go to Settings > Billing, and click "Update Payment Method".\n\nQ: Can I get a refund?\nA: Refunds are available within 30 days of purchase. Contact support@company.com.',
    'Answers to common billing and payment questions',
    'billing',
    'published',
    NOW()
);
```

---

### **Day 3-4: Embedding Generation (FREE)**

```python
# File: clara-backend/agents/support_agent/embeddings.py

from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)


class EmbeddingGenerator:
    """
    FREE embedding generator using sentence-transformers.
    
    Model: all-MiniLM-L6-v2
    - Size: 80MB (downloads once)
    - Dimensions: 384
    - Speed: ~1000 sentences/second on CPU
    - Quality: Good for semantic search
    - Cost: $0 (100% free)
    """
    
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model_name = model_name
        self.model = None
        
        # Load model (downloads first time only)
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        logger.info(f"Model loaded. Embedding dimension: {self.model.get_sentence_embedding_dimension()}")
    
    def generate(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of strings to embed
        
        Returns:
            numpy array of shape (len(texts), 384)
        """
        if not texts:
            return np.array([])
        
        # Generate embeddings
        embeddings = self.model.encode(
            texts,
            batch_size=32,
            show_progress_bar=len(texts) > 100,
            convert_to_numpy=True,
            normalize_embeddings=True  # Normalize for cosine similarity
        )
        
        return embeddings
    
    def generate_one(self, text: str) -> np.ndarray:
        """Generate embedding for a single text."""
        return self.generate([text])[0]


# ─────────────────────────────────────────────────────────────
# CHUNKING STRATEGY
# ─────────────────────────────────────────────────────────────

class TextChunker:
    """
    Smart text chunking for RAG.
    
    Strategy: Semantic chunking with overlap
    - Chunk size: 200-500 tokens (~150-375 words)
    - Overlap: 50 tokens (~37 words)
    - Preserves sentence boundaries
    """
    
    def __init__(self, chunk_size=400, overlap=50):
        self.chunk_size = chunk_size  # tokens
        self.overlap = overlap  # tokens
    
    def chunk(self, text: str, article_id: str = None) -> List[Dict]:
        """
        Split text into overlapping chunks.
        
        Returns:
            [
                {
                    "content": "chunk text...",
                    "order_idx": 0,
                    "start_char": 0,
                    "end_char": 500,
                    "token_count": 400
                },
                ...
            ]
        """
        # Simple token approximation: 1 token ≈ 0.75 words ≈ 4 chars
        chars_per_token = 4
        chunk_chars = self.chunk_size * chars_per_token
        overlap_chars = self.overlap * chars_per_token
        
        chunks = []
        sentences = self._split_sentences(text)
        
        current_chunk = []
        current_length = 0
        start_char = 0
        
        for i, sentence in enumerate(sentences):
            sentence_length = len(sentence)
            
            if current_length + sentence_length > chunk_chars and current_chunk:
                # Save current chunk
                chunk_text = ' '.join(current_chunk)
                chunks.append({
                    "content": chunk_text,
                    "order_idx": len(chunks),
                    "start_char": start_char,
                    "end_char": start_char + len(chunk_text),
                    "token_count": self._count_tokens(chunk_text)
                })
                
                # Start new chunk with overlap
                # Keep last few sentences for overlap
                overlap_sentences = []
                overlap_len = 0
                for sent in reversed(current_chunk):
                    if overlap_len + len(sent) <= overlap_chars:
                        overlap_sentences.insert(0, sent)
                        overlap_len += len(sent)
                    else:
                        break
                
                start_char += len(' '.join(current_chunk[:len(current_chunk)-len(overlap_sentences)]))
                current_chunk = overlap_sentences
                current_length = overlap_len
            
            current_chunk.append(sentence)
            current_length += sentence_length
        
        # Add final chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunks.append({
                "content": chunk_text,
                "order_idx": len(chunks),
                "start_char": start_char,
                "end_char": start_char + len(chunk_text),
                "token_count": self._count_tokens(chunk_text)
            })
        
        return chunks
    
    def _split_sentences(self, text: str) -> List[str]:
        """Simple sentence splitter."""
        import re
        
        # Split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Clean up
        sentences = [s.strip() for s in sentences if s.strip()]
        
        return sentences
    
    def _count_tokens(self, text: str) -> int:
        """Approximate token count (1 token ≈ 0.75 words)."""
        words = text.split()
        return int(len(words) / 0.75)


# ─────────────────────────────────────────────────────────────
# KB INGESTION PIPELINE
# ─────────────────────────────────────────────────────────────

from supabase import create_client
import os

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)


def ingest_article(article_id: str):
    """
    Process a KB article: chunk + embed + store.
    
    Call this when an article is published or updated.
    """
    
    # 1. Get article
    response = supabase.table("kb_articles").select("*").eq("id", article_id).execute()
    
    if not response.data:
        raise ValueError(f"Article {article_id} not found")
    
    article = response.data[0]
    
    logger.info(f"Ingesting article: {article['title']}")
    
    # 2. Chunk the article
    chunker = TextChunker(chunk_size=400, overlap=50)
    chunks = chunker.chunk(article['content'], article_id=article_id)
    
    logger.info(f"Created {len(chunks)} chunks")
    
    # 3. Delete existing chunks/embeddings (if re-ingesting)
    supabase.table("kb_chunks").delete().eq("article_id", article_id).execute()
    
    # 4. Store chunks
    chunk_records = []
    for chunk in chunks:
        chunk_record = {
            "id": str(uuid4()),
            "article_id": article_id,
            "content": chunk['content'],
            "order_idx": chunk['order_idx'],
            "token_count": chunk['token_count'],
            "start_char": chunk['start_char'],
            "end_char": chunk['end_char'],
        }
        chunk_records.append(chunk_record)
    
    supabase.table("kb_chunks").insert(chunk_records).execute()
    
    logger.info(f"Stored {len(chunk_records)} chunks")
    
    # 5. Generate embeddings
    embedder = EmbeddingGenerator()
    chunk_texts = [c['content'] for c in chunks]
    embeddings = embedder.generate(chunk_texts)
    
    logger.info(f"Generated {len(embeddings)} embeddings")
    
    # 6. Store embeddings
    embedding_records = []
    for i, (chunk_record, embedding) in enumerate(zip(chunk_records, embeddings)):
        embedding_record = {
            "id": str(uuid4()),
            "chunk_id": chunk_record['id'],
            "embedding": embedding.tolist(),  # Convert numpy to list for JSON
            "model": embedder.model_name,
        }
        embedding_records.append(embedding_record)
    
    supabase.table("kb_embeddings").insert(embedding_records).execute()
    
    logger.info(f"✅ Article {article['title']} ingested successfully")


from uuid import uuid4


# ─────────────────────────────────────────────────────────────
# TEST SCRIPT
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Test chunking
    sample_text = """
    To reset your password, follow these steps. First, navigate to the login page
    at www.example.com/login. Second, click on the "Forgot Password?" link located
    below the password field. Third, enter the email address associated with your
    account in the provided field. Fourth, click the "Send Reset Link" button.
    
    You will receive an email within 5 minutes containing a password reset link.
    If you don't see the email, please check your spam or junk folder. Click on
    the link in the email to be redirected to the password reset page.
    
    On the password reset page, enter your new password. Your password must be at
    least 8 characters long and include at least one uppercase letter, one lowercase
    letter, one number, and one special character. Re-enter the same password in the
    confirmation field to ensure accuracy.
    
    Finally, click the "Reset Password" button. You will be redirected to the login
    page where you can log in with your new password. If you encounter any issues,
    please contact our support team at support@example.com or call 1-800-123-4567.
    """
    
    chunker = TextChunker(chunk_size=100, overlap=20)  # Smaller for demo
    chunks = chunker.chunk(sample_text)
    
    print(f"Created {len(chunks)} chunks:\n")
    for i, chunk in enumerate(chunks):
        print(f"─── Chunk {i} ───")
        print(f"Tokens: {chunk['token_count']}")
        print(f"Content: {chunk['content'][:100]}...")
        print()
    
    # Test embeddings
    print("\n" + "="*50)
    print("Testing embedding generation...")
    print("="*50)
    
    embedder = EmbeddingGenerator()
    
    test_texts = [
        "How do I reset my password?",
        "I forgot my password and need help",
        "What are your business hours?",
    ]
    
    embeddings = embedder.generate(test_texts)
    print(f"Generated embeddings shape: {embeddings.shape}")
    print(f"First embedding (truncated): {embeddings[0][:10]}...")
    
    # Test similarity
    from sklearn.metrics.pairwise import cosine_similarity
    
    sim_matrix = cosine_similarity(embeddings)
    print(f"\nSimilarity Matrix:")
    print(f"Text 0 vs Text 1: {sim_matrix[0][1]:.3f} (high - same topic)")
    print(f"Text 0 vs Text 2: {sim_matrix[0][2]:.3f} (low - different topic)")
```

---

### **Day 5-6: Semantic Search & RAG**

```python
# File: clara-backend/agents/support_agent/faq_handler.py

from typing import List, Dict, Optional
import numpy as np
from .embeddings import EmbeddingGenerator
from supabase import create_client
import os
import logging

logger = logging.getLogger(__name__)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)


class RAGSystem:
    """
    Retrieval-Augmented Generation system for FAQ answering.
    
    100% FREE implementation:
    - Embeddings: sentence-transformers (all-MiniLM-L6-v2)
    - Vector DB: pgvector (PostgreSQL extension)
    - LLM: Ollama (Llama 3.1 8B local)
    """
    
    def __init__(self):
        self.embedder = EmbeddingGenerator()
        self.similarity_threshold = 0.7  # Minimum similarity to return
        self.top_k = 5  # Number of chunks to retrieve
    
    def search(self, query: str, top_k: int = None) -> List[Dict]:
        """
        Semantic search for relevant KB chunks.
        
        Args:
            query: User's question
            top_k: Number of results to return
        
        Returns:
            [
                {
                    "chunk_id": "uuid",
                    "content": "chunk text...",
                    "article_id": "uuid",
                    "article_title": "...",
                    "similarity": 0.87
                },
                ...
            ]
        """
        
        if top_k is None:
            top_k = self.top_k
        
        # 1. Generate query embedding
        query_embedding = self.embedder.generate_one(query)
        
        # 2. Search vector database
        # pgvector uses <=> operator for cosine distance (1 - similarity)
        # Convert numpy array to list for PostgreSQL
        embedding_list = query_embedding.tolist()
        
        # SQL query with vector similarity
        response = supabase.rpc(
            'search_kb_chunks',
            {
                'query_embedding': embedding_list,
                'match_threshold': 1 - self.similarity_threshold,  # Convert similarity to distance
                'match_count': top_k
            }
        ).execute()
        
        results = response.data
        
        if not results:
            logger.warning(f"No results found for query: {query}")
            return []
        
        logger.info(f"Found {len(results)} results for query: {query}")
        
        return results
    
    def answer_question(self, question: str, use_llm: bool = True) -> Dict:
        """
        Answer a question using RAG.
        
        Args:
            question: User's question
            use_llm: If True, use LLM to synthesize answer. If False, return chunks only.
        
        Returns:
            {
                "answer": "synthesized answer...",
                "citations": [
                    {
                        "article_title": "...",
                        "chunk_content": "...",
                        "similarity": 0.87
                    },
                    ...
                ],
                "confidence": 0.85,
                "method": "rag"  # or "direct" if no LLM
            }
        """
        
        # 1. Search for relevant chunks
        results = self.search(question, top_k=self.top_k)
        
        if not results:
            return {
                "answer": "I couldn't find any relevant information in the knowledge base. Please contact a support agent for assistance.",
                "citations": [],
                "confidence": 0.0,
                "method": "fallback"
            }
        
        # 2. Check if highest similarity is below threshold
        max_similarity = max([r['similarity'] for r in results])
        
        if max_similarity < self.similarity_threshold:
            return {
                "answer": f"I found some information, but I'm not confident it answers your question (similarity: {max_similarity:.2f}). Would you like me to escalate to a human agent?",
                "citations": results,
                "confidence": max_similarity,
                "method": "low_confidence"
            }
        
        # 3. If use_llm, synthesize answer with LLM
        if use_llm:
            answer = self._synthesize_with_llm(question, results)
            confidence = self._calculate_confidence(results, answer)
        else:
            # Just return the most relevant chunk
            answer = results[0]['content']
            confidence = results[0]['similarity']
        
        return {
            "answer": answer,
            "citations": results,
            "confidence": confidence,
            "method": "rag" if use_llm else "direct"
        }
    
    def _synthesize_with_llm(self, question: str, chunks: List[Dict]) -> str:
        """
        Use LLM to synthesize answer from retrieved chunks.
        
        FREE OPTIONS:
        1. Ollama (local) - RECOMMENDED ⭐
        2. HuggingFace inference API (free tier)
        """
        
        # Prepare context from chunks
        context = "\n\n".join([
            f"[Source {i+1}]: {chunk['content']}"
            for i, chunk in enumerate(chunks[:3])  # Use top 3 chunks
        ])
        
        # Prompt engineering
        prompt = f"""You are a helpful customer support assistant. Answer the user's question based ONLY on the provided context. If the context doesn't contain enough information, say so.

Context:
{context}

User Question: {question}

Answer (be concise and helpful):"""
        
        # Option 1: Ollama (local LLM)
        try:
            import ollama
            
            response = ollama.chat(
                model='llama3.1:8b',  # or 'mistral', 'phi3'
                messages=[
                    {
                        'role': 'system',
                        'content': 'You are a helpful customer support assistant. Answer based only on the provided context.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                options={
                    'temperature': 0.3,  # Lower = more factual
                    'num_predict': 200,  # Max tokens
                }
            )
            
            answer = response['message']['content'].strip()
            
        except Exception as e:
            logger.error(f"LLM synthesis failed: {e}")
            # Fallback to just returning the most relevant chunk
            answer = chunks[0]['content']
        
        return answer
    
    def _calculate_confidence(self, chunks: List[Dict], answer: str) -> float:
        """
        Calculate confidence score.
        
        Factors:
        - Highest similarity score
        - Number of relevant chunks
        - Answer length (very short = low confidence)
        """
        
        if not chunks:
            return 0.0
        
        # Base confidence from similarity
        max_sim = max([c['similarity'] for c in chunks])
        
        # Adjust for number of supporting chunks
        num_high_sim = sum(1 for c in chunks if c['similarity'] > 0.8)
        num_factor = min(num_high_sim / 3.0, 1.0)  # Boost if multiple high-sim chunks
        
        # Adjust for answer quality
        answer_len = len(answer.split())
        len_factor = min(answer_len / 50.0, 1.0)  # Penalize very short answers
        
        confidence = max_sim * 0.7 + num_factor * 0.2 + len_factor * 0.1
        
        return min(confidence, 1.0)


# ─────────────────────────────────────────────────────────────
# POSTGRESQL FUNCTION FOR VECTOR SEARCH
# ─────────────────────────────────────────────────────────────

# Run this SQL to create the search function:
"""
CREATE OR REPLACE FUNCTION search_kb_chunks(
    query_embedding vector(384),
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    chunk_id uuid,
    content text,
    article_id uuid,
    article_title text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.chunk_id,
        c.content,
        c.article_id,
        a.title as article_title,
        1 - (e.embedding <=> query_embedding) as similarity
    FROM kb_embeddings e
    JOIN kb_chunks c ON e.chunk_id = c.id
    JOIN kb_articles a ON c.article_id = a.id
    WHERE
        a.state = 'published' AND
        (1 - (e.embedding <=> query_embedding)) > match_threshold
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
"""


# ─────────────────────────────────────────────────────────────
# API HELPER (called from ticket_manager.py)
# ─────────────────────────────────────────────────────────────

_rag_system = None

def get_rag_system():
    global _rag_system
    if _rag_system is None:
        _rag_system = RAGSystem()
    return _rag_system


def try_auto_resolve(subject: str, description: str) -> Optional[Dict]:
    """
    Try to auto-resolve a ticket using RAG.
    
    Returns answer if confidence > 0.85, else None.
    """
    
    rag = get_rag_system()
    
    # Combine subject + description for better context
    question = f"{subject}. {description}"
    
    result = rag.answer_question(question, use_llm=True)
    
    if result['confidence'] >= 0.85:
        return result
    else:
        return None


# ─────────────────────────────────────────────────────────────
# TEST SCRIPT
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("="*50)
    print("TESTING RAG SYSTEM")
    print("="*50)
    
    rag = RAGSystem()
    
    test_questions = [
        "How do I reset my password?",
        "I can't login to my account",
        "What payment methods do you accept?",
        "How do I train a dragon?",  # Should have low confidence
    ]
    
    for question in test_questions:
        print(f"\nQuestion: {question}")
        print("-" * 50)
        
        result = rag.answer_question(question, use_llm=True)
        
        print(f"Answer: {result['answer']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Method: {result['method']}")
        print(f"Citations: {len(result['citations'])}")
        
        if result['citations']:
            print("\nTop citation:")
            cite = result['citations'][0]
            print(f"  Title: {cite.get('article_title', 'N/A')}")
            print(f"  Similarity: {cite.get('similarity', 0):.2f}")
            print(f"  Content: {cite['content'][:100]}...")
```

---

### **Day 7: Ollama Setup (FREE LLM)**

```bash
# Installation Guide for Ollama (Windows)

# 1. Download Ollama for Windows
# Visit: https://ollama.ai/download
# Download the Windows installer (.exe)

# 2. Install Ollama
# Run the installer (it's ~400MB)

# 3. Open Command Prompt or PowerShell

# 4. Pull a model (choose one based on your laptop specs)

# For 8GB RAM laptop:
ollama pull phi3:mini  # 3.8GB

# For 16GB RAM laptop:
ollama pull llama3.1:8b  # 4.7GB

# For 32GB RAM laptop:
ollama pull llama3.1:70b  # 40GB (slow but very smart)

# 5. Test the model
ollama run llama3.1:8b

# 6. Test Python integration
```

```python
# test_ollama.py

import ollama

response = ollama.chat(
    model='llama3.1:8b',
    messages=[
        {
            'role': 'user',
            'content': 'Hello! Can you help me with customer support?'
        }
    ]
)

print(response['message']['content'])
```

```bash
# Run test
python test_ollama.py

# If it works, you're ready! 🎉
```

**Alternative FREE Options if Ollama doesn't work:**

```python
# Option 2: HuggingFace Inference API (Free tier: 30,000 chars/month)

from transformers import pipeline

# Download model (runs locally, no API)
generator = pipeline('text-generation', model='gpt2')  # Small model

prompt = "Answer this question: How do I reset my password?"
response = generator(prompt, max_length=100)

print(response[0]['generated_text'])


# Option 3: LM Studio (Windows GUI for local LLMs)
# Download from: https://lmstudio.ai/
# - Easy GUI interface
# - Download models with one click
# - Provides OpenAI-compatible API
# - Works well on Windows
```

---

## **PHASE 2: EMAIL & ESCALATION (WEEK 3)**

### **Day 1-2: Email Integration**

```python
# File: clara-backend/agents/support_agent/email_handler.py

import imaplib
import smtplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Optional
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)


class EmailHandler:
    """
    Email integration for ticket system.
    
    Supports:
    - IMAP: Fetch incoming emails → create tickets
    - SMTP: Send responses
    
    Works with: Gmail, Outlook, any IMAP/SMTP provider
    """
    
    def __init__(
        self,
        imap_server: str = "imap.gmail.com",
        smtp_server: str = "smtp.gmail.com",
        email_address: str = None,
        email_password: str = None,  # Use app password, not real password!
    ):
        self.imap_server = imap_server
        self.smtp_server = smtp_server
        self.email_address = email_address or os.getenv("SUPPORT_EMAIL")
        self.email_password = email_password or os.getenv("SUPPORT_EMAIL_PASSWORD")
        
        if not self.email_address or not self.email_password:
            raise ValueError("Email credentials not provided")
    
    def fetch_new_emails(self) -> List[Dict]:
        """
        Fetch unread emails and parse them.
        
        Returns:
            [
                {
                    "from": "customer@email.com",
                    "subject": "Need help with login",
                    "body": "I can't access my account...",
                    "date": datetime,
                    "email_id": "123"
                },
                ...
            ]
        """
        
        try:
            # Connect to IMAP
            mail = imaplib.IMAP4_SSL(self.imap_server)
            mail.login(self.email_address, self.email_password)
            mail.select('inbox')
            
            # Search for unread emails
            status, messages = mail.search(None, 'UNSEEN')
            
            if status != 'OK':
                logger.error("Failed to search emails")
                return []
            
            email_ids = messages[0].split()
            
            if not email_ids:
                logger.info("No new emails")
                return []
            
            parsed_emails = []
            
            for email_id in email_ids:
                # Fetch email
                status, msg_data = mail.fetch(email_id, '(RFC822)')
                
                if status != 'OK':
                    continue
                
                # Parse email
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                # Extract fields
                from_address = email.utils.parseaddr(msg['From'])[1]
                subject = msg['Subject']
                date = email.utils.parsedate_to_datetime(msg['Date'])
                
                # Get body
                body = self._get_email_body(msg)
                
                parsed_emails.append({
                    "from": from_address,
                    "subject": subject,
                    "body": body,
                    "date": date,
                    "email_id": email_id.decode()
                })
                
                logger.info(f"Fetched email from {from_address}: {subject}")
            
            mail.close()
            mail.logout()
            
            return parsed_emails
        
        except Exception as e:
            logger.error(f"Error fetching emails: {e}")
            return []
    
    def _get_email_body(self, msg) -> str:
        """Extract plain text body from email."""
        
        body = ""
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    body = part.get_payload(decode=True).decode()
                    break
        else:
            body = msg.get_payload(decode=True).decode()
        
        return body.strip()
    
    def send_email(
        self,
        to_address: str,
        subject: str,
        body: str,
        ticket_id: Optional[str] = None
    ) -> bool:
        """
        Send an email reply.
        
        Args:
            to_address: Recipient email
            subject: Email subject (will add [Ticket #XYZ] prefix)
            body: Email body (plain text or HTML)
            ticket_id: Ticket ID for reference
        
        Returns:
            True if sent successfully
        """
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_address
            msg['To'] = to_address
            
            # Add ticket ID to subject
            if ticket_id:
                msg['Subject'] = f"[Ticket #{ticket_id[:8]}] {subject}"
            else:
                msg['Subject'] = subject
            
            # Create HTML version (prettier)
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <p>Hello,</p>
                <p>{body.replace(chr(10), '<br>')}</p>
                <br>
                <p>Best regards,<br>
                <strong>Support Team</strong></p>
                {f'<p style="color: #888; font-size: 12px;">Ticket Reference: {ticket_id}</p>' if ticket_id else ''}
            </body>
            </html>
            """
            
            # Attach both plain text and HTML
            part1 = MIMEText(body, 'plain')
            part2 = MIMEText(html_body, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send via SMTP
            server = smtplib.SMTP_SSL(self.smtp_server, 465)
            server.login(self.email_address, self.email_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Sent email to {to_address} (Ticket: {ticket_id})")
            return True
        
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    def mark_as_read(self, email_id: str):
        """Mark an email as read after processing."""
        
        try:
            mail = imaplib.IMAP4_SSL(self.imap_server)
            mail.login(self.email_address, self.email_password)
            mail.select('inbox')
            
            mail.store(email_id.encode(), '+FLAGS', '\\Seen')
            
            mail.close()
            mail.logout()
        
        except Exception as e:
            logger.error(f"Error marking email as read: {e}")


# ─────────────────────────────────────────────────────────────
# EMAIL PROCESSING LOOP (Background Task)
# ─────────────────────────────────────────────────────────────

def process_incoming_emails():
    """
    Background task to continuously process incoming emails.
    
    Run this with Celery or as a scheduled task.
    """
    
    from .ticket_manager import create_ticket
    from .classifier import classify_ticket
    
    email_handler = EmailHandler()
    
    # Fetch new emails
    emails = email_handler.fetch_new_emails()
    
    for email_data in emails:
        try:
            # 1. Find or create customer
            customer = find_or_create_customer(email_data['from'])
            
            # 2. Create ticket
            ticket = create_ticket(
                customer_id=customer['id'],
                subject=email_data['subject'],
                description=email_data['body'],
                channel='email'
            )
            
            # 3. Mark email as read
            email_handler.mark_as_read(email_data['email_id'])
            
            logger.info(f"Created ticket {ticket['id']} from email")
        
        except Exception as e:
            logger.error(f"Error processing email: {e}")


def send_ticket_response(ticket_id: str, answer: str):
    """
    Send email response for a ticket.
    
    Called after RAG generates an answer.
    """
    
    from supabase import create_client
    import os
    
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    
    # Get ticket and customer
    ticket = supabase.table("tickets").select("*, customers(email)").eq("id", ticket_id).execute()
    
    if not ticket.data:
        logger.error(f"Ticket {ticket_id} not found")
        return
    
    ticket = ticket.data[0]
    customer_email = ticket['customers']['email']
    
    # Send email
    email_handler = EmailHandler()
    email_handler.send_email(
        to_address=customer_email,
        subject=f"Re: {ticket['subject']}",
        body=answer,
        ticket_id=ticket_id
    )


def find_or_create_customer(email_address: str) -> Dict:
    """Find existing customer or create new one."""
    
    from supabase import create_client
    import os
    from uuid import uuid4
    
    supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    
    # Check if customer exists
    response = supabase.table("customers").select("*").eq("email", email_address).execute()
    
    if response.data:
        return response.data[0]
    
    # Create new customer
    customer_data = {
        "id": str(uuid4()),
        "email": email_address,
        "name": email_address.split('@')[0],  # Use email prefix as name
        "created_at": datetime.utcnow().isoformat()
    }
    
    response = supabase.table("customers").insert(customer_data).execute()
    
    return response.data[0]


# ─────────────────────────────────────────────────────────────
# GMAIL APP PASSWORD SETUP GUIDE
# ─────────────────────────────────────────────────────────────

"""
How to get Gmail App Password (required for IMAP/SMTP):

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in left sidebar
3. Under "Signing in to Google", click "2-Step Verification"
   - If not enabled, enable it first
4. Scroll down to "App passwords"
5. Click "App passwords"
6. Select app: "Mail"
7. Select device: "Other (Custom name)"
8. Type: "Clara Support System"
9. Click "Generate"
10. Copy the 16-character password
11. Use this password in your .env file:

SUPPORT_EMAIL=support@yourcompany.com
SUPPORT_EMAIL_PASSWORD=abcd efgh ijkl mnop  # App password from step 10

NEVER use your real Gmail password!
"""


# ─────────────────────────────────────────────────────────────
# TEST SCRIPT
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Test email sending
    handler = EmailHandler(
        email_address="your_email@gmail.com",
        email_password="your_app_password"  # Get from Gmail App Passwords
    )
    
    # Test send
    success = handler.send_email(
        to_address="test@example.com",
        subject="Test ticket response",
        body="This is a test response from the Clara Support System.",
        ticket_id="12345678"
    )
    
    if success:
        print("✅ Email sent successfully!")
    else:
        print("❌ Failed to send email")
    
    # Test fetch
    emails = handler.fetch_new_emails()
    print(f"\n📧 Found {len(emails)} new emails")
    
    for email_data in emails:
        print(f"\nFrom: {email_data['from']}")
        print(f"Subject: {email_data['subject']}")
        print(f"Body: {email_data['body'][:100]}...")
```

---

**Continue in Part 3 for:**
- Escalation Workflow
- Admin Panel (React)
- Meeting System
- Complete integration guide
- Testing strategy

This is already substantial - would you like me to continue with Part 3?
