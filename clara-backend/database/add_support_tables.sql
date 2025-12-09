-- ============================================================================
-- ADD SUPPORT AGENT TABLES TO EXISTING SUPABASE PROJECT
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. CUSTOMERS TABLE (for support tickets)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    is_vip BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. QUEUES TABLE (ticket queues/categories)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    team TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default queues
INSERT INTO queues (name, team, description) VALUES
    ('General Support', 'support_tier1', 'General customer inquiries'),
    ('Technical Issues', 'support_tier2', 'Complex technical problems'),
    ('Billing & Payments', 'billing', 'Billing-related issues'),
    ('Escalations', 'senior_support', 'Escalated tickets')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. SLAS TABLE (Service Level Agreements)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS slas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    respond_within INTERVAL NOT NULL,
    resolve_within INTERVAL NOT NULL,
    priority_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default SLAs
INSERT INTO slas (name, respond_within, resolve_within, priority_level) VALUES
    ('Urgent SLA', '30 minutes', '4 hours', 'urgent'),
    ('High Priority SLA', '2 hours', '24 hours', 'high'),
    ('Normal SLA', '12 hours', '72 hours', 'normal'),
    ('Low Priority SLA', '24 hours', '1 week', 'low')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. TICKETS TABLE (main support tickets)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES queues(id) ON DELETE SET NULL,
    sla_id UUID REFERENCES slas(id) ON DELETE SET NULL,
    
    -- Basic Info
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    channel TEXT CHECK (channel IN ('email', 'chat', 'voice', 'web', 'api')) DEFAULT 'email',
    
    -- AI Classification
    intent TEXT,
    category TEXT CHECK (category IN ('technical', 'billing', 'general', 'product', 'account')),
    priority TEXT CHECK (priority IN ('urgent', 'high', 'normal', 'low')) DEFAULT 'normal',
    
    -- Status
    status TEXT CHECK (status IN ('open', 'pending', 'in_progress', 'resolved', 'escalated', 'closed')) DEFAULT 'open',
    
    -- Content
    transcript TEXT,
    resolution TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. TICKET_HISTORY TABLE (audit trail)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    
    action TEXT NOT NULL,
    comment TEXT,
    
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history(ticket_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. KB_ARTICLES TABLE (knowledge base)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    
    category TEXT,
    tags TEXT[],
    
    state TEXT CHECK (state IN ('draft', 'review', 'published', 'archived')) DEFAULT 'draft',
    
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_kb_articles_state ON kb_articles(state);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. KB_CHUNKS TABLE (for RAG - text chunks)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    order_idx INT NOT NULL,
    token_count INT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (article_id, order_idx)
);

CREATE INDEX IF NOT EXISTS idx_kb_chunks_article ON kb_chunks(article_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 8. KB_EMBEDDINGS TABLE (vector embeddings for AI search)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID UNIQUE REFERENCES kb_chunks(id) ON DELETE CASCADE,
    
    embedding VECTOR(384) NOT NULL,
    
    model TEXT DEFAULT 'sentence-transformers/all-MiniLM-L6-v2',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS kb_embeddings_vector_idx 
    ON kb_embeddings 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─────────────────────────────────────────────────────────────────────────
-- 9. CITATIONS TABLE (track which KB articles helped resolve tickets)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES kb_chunks(id) ON DELETE SET NULL,
    article_id UUID REFERENCES kb_articles(id) ON DELETE SET NULL,
    
    relevance_score FLOAT,
    snippet TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_citations_ticket ON citations(ticket_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 10. INSERT SAMPLE DATA
-- ─────────────────────────────────────────────────────────────────────────

-- Sample KB articles
INSERT INTO kb_articles (title, content, summary, category, state, published_at) VALUES
(
    'How to Reset Your Password',
    E'# Password Reset Guide\n\n## Steps:\n1. Go to login page\n2. Click "Forgot Password?"\n3. Enter your email\n4. Check your inbox for reset link\n5. Click link and create new password\n\n## Password Requirements:\n- At least 8 characters\n- One uppercase letter\n- One number\n- One special character',
    'Step-by-step password reset instructions',
    'account',
    'published',
    NOW()
),
(
    'Billing Information',
    E'# Billing & Payment Guide\n\n## Payment Methods:\n- Credit cards (Visa, Mastercard, Amex)\n- Debit cards\n- PayPal\n\n## Billing Cycle:\n- Monthly: Same date each month\n- Annual: Yearly on subscription date\n\n## Refund Policy:\n- 30-day full refund\n- Pro-rated after 30 days',
    'Billing, payments, and refund information',
    'billing',
    'published',
    NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT 
    'tickets' as table_name, COUNT(*) as row_count FROM tickets
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'queues', COUNT(*) FROM queues
UNION ALL
SELECT 'slas', COUNT(*) FROM slas
UNION ALL
SELECT 'kb_articles', COUNT(*) FROM kb_articles;

-- Success message
SELECT '✅ Support Agent tables created successfully!' as status;
