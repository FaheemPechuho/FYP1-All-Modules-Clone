-- ============================================================================
-- COMPLETE FIX - CREATE MISSING TABLES + FIX PERMISSIONS
-- Run this ONCE in Supabase SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. CREATE MISSING TABLES (IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────────────

-- Customers table
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

-- Queue table (singular - matches your schema)
CREATE TABLE IF NOT EXISTS queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    team TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLA table (singular - matches your schema)
CREATE TABLE IF NOT EXISTS sla (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    respond_within INTERVAL NOT NULL,
    resolve_within INTERVAL NOT NULL,
    priority_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES queue(id) ON DELETE SET NULL,
    sla_id UUID REFERENCES sla(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    channel TEXT DEFAULT 'email',
    intent TEXT,
    category TEXT,
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'open',
    transcript TEXT,
    resolution TEXT,
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- Ticket History table
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

-- KB Articles table
CREATE TABLE IF NOT EXISTS kb_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category TEXT,
    tags TEXT[],
    state TEXT DEFAULT 'draft',
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0
);

-- KB Chunks table
CREATE TABLE IF NOT EXISTS kb_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    order_idx INT NOT NULL,
    token_count INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (article_id, order_idx)
);

-- KB Embeddings table
CREATE TABLE IF NOT EXISTS kb_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID UNIQUE REFERENCES kb_chunks(id) ON DELETE CASCADE,
    embedding VECTOR(384) NOT NULL,
    model TEXT DEFAULT 'sentence-transformers/all-MiniLM-L6-v2',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citations table
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES kb_chunks(id) ON DELETE SET NULL,
    article_id UUID REFERENCES kb_articles(id) ON DELETE SET NULL,
    relevance_score FLOAT,
    snippet TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. CREATE INDEXES
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_article ON kb_chunks(article_id);

-- Vector search index
CREATE INDEX IF NOT EXISTS kb_embeddings_vector_idx 
    ON kb_embeddings 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. INSERT DEFAULT DATA
-- ─────────────────────────────────────────────────────────────────────────

-- Insert default queues
INSERT INTO queue (name, team, description) VALUES
    ('General Support', 'support_tier1', 'General customer inquiries'),
    ('Technical Issues', 'support_tier2', 'Complex technical problems'),
    ('Billing & Payments', 'billing', 'Billing-related issues'),
    ('Escalations', 'senior_support', 'Escalated tickets')
ON CONFLICT (name) DO NOTHING;

-- Insert default SLAs
INSERT INTO sla (name, respond_within, resolve_within, priority_level) VALUES
    ('Urgent SLA', '30 minutes', '4 hours', 'urgent'),
    ('High Priority SLA', '2 hours', '24 hours', 'high'),
    ('Normal SLA', '12 hours', '72 hours', 'normal'),
    ('Low Priority SLA', '24 hours', '1 week', 'low')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. DISABLE RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE sla DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE kb_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE citations DISABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. GRANT PERMISSIONS (Schema + Tables)
-- ─────────────────────────────────────────────────────────────────────────

-- Grant schema permissions first (THIS WAS MISSING!)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT CREATE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- Grant table permissions
GRANT ALL ON customers TO authenticated, service_role, anon;
GRANT ALL ON queue TO authenticated, service_role, anon;
GRANT ALL ON sla TO authenticated, service_role, anon;
GRANT ALL ON tickets TO authenticated, service_role, anon;
GRANT ALL ON ticket_history TO authenticated, service_role, anon;
GRANT ALL ON kb_articles TO authenticated, service_role, anon;
GRANT ALL ON kb_chunks TO authenticated, service_role, anon;
GRANT ALL ON kb_embeddings TO authenticated, service_role, anon;
GRANT ALL ON citations TO authenticated, service_role, anon;

-- Grant sequence permissions (for UUID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 6. VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────

-- Check what tables exist
SELECT 
    'customers' as table_name, 
    COUNT(*) as row_count,
    (SELECT COUNT(*) FROM customers) as actual_rows
FROM customers
UNION ALL
SELECT 'queue', COUNT(*), (SELECT COUNT(*) FROM queue) FROM queue
UNION ALL
SELECT 'sla', COUNT(*), (SELECT COUNT(*) FROM sla) FROM sla
UNION ALL
SELECT 'tickets', COUNT(*), (SELECT COUNT(*) FROM tickets) FROM tickets;

-- Success message
SELECT '✅ ALL DONE! Tables created, permissions fixed, ready to use!' as status;
