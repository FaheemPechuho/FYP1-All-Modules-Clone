-- ============================================================================
-- CLARA CRM - COMPLETE DATABASE SCHEMA
-- Support Agent System by Husnain
-- PostgreSQL 14+ with pgvector extension
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'vector');

-- ─────────────────────────────────────────────────────────────────────────
-- 1. CUSTOMERS TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    is_vip BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_vip ON customers(is_vip);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. USERS TABLE (Team Members)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    
    -- Role & Access
    role TEXT CHECK (role IN ('admin', 'manager', 'csr', 'sales', 'marketing')) NOT NULL DEFAULT 'csr',
    team TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_team ON users(team);
CREATE INDEX idx_users_active ON users(is_active);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. QUEUES TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    team TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. SLAS TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS slas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    respond_within INTERVAL NOT NULL,
    resolve_within INTERVAL NOT NULL,
    priority_level TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. TICKETS TABLE ⭐ YOUR MAIN TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
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
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX idx_tickets_queue ON tickets(queue_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. TICKET_HISTORY TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    
    action TEXT NOT NULL,
    comment TEXT,
    
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_history_ticket ON ticket_history(ticket_id);
CREATE INDEX idx_ticket_history_created ON ticket_history(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. KB_ARTICLES TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
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
    helpful_count INT DEFAULT 0,
    unhelpful_count INT DEFAULT 0
);

CREATE INDEX idx_kb_articles_state ON kb_articles(state);
CREATE INDEX idx_kb_articles_category ON kb_articles(category);
CREATE INDEX idx_kb_articles_published ON kb_articles(published_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 8. KB_CHUNKS TABLE (for RAG)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES kb_articles(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    order_idx INT NOT NULL,
    token_count INT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (article_id, order_idx)
);

CREATE INDEX idx_kb_chunks_article ON kb_chunks(article_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 9. KB_EMBEDDINGS TABLE ⭐ VECTOR SEARCH
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id UUID UNIQUE REFERENCES kb_chunks(id) ON DELETE CASCADE,
    
    embedding VECTOR(384) NOT NULL,
    
    model TEXT DEFAULT 'sentence-transformers/all-MiniLM-L6-v2',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX kb_embeddings_vector_idx 
    ON kb_embeddings 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─────────────────────────────────────────────────────────────────────────
-- 10. CITATIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES kb_chunks(id) ON DELETE SET NULL,
    article_id UUID REFERENCES kb_articles(id) ON DELETE SET NULL,
    
    relevance_score FLOAT,
    snippet TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_citations_ticket ON citations(ticket_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 11. MEETINGS TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    title TEXT NOT NULL,
    description TEXT,
    
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    meeting_url TEXT,
    
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    attendees UUID[],
    
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    meeting_type TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_start ON meetings(start_time);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 12. TASKS TABLE
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    title TEXT NOT NULL,
    description TEXT,
    
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')) DEFAULT 'todo',
    
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    related_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    related_meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_date);

-- ============================================================================
-- INSERT SEED DATA
-- ============================================================================

-- Insert default queues
INSERT INTO queues (name, team, description) VALUES
    ('General Support', 'support_tier1', 'General customer inquiries'),
    ('Technical Issues', 'support_tier2', 'Complex technical problems'),
    ('Billing & Payments', 'billing', 'Billing-related issues'),
    ('Escalations', 'senior_support', 'Escalated tickets')
ON CONFLICT (name) DO NOTHING;

-- Insert default SLAs
INSERT INTO slas (name, respond_within, resolve_within, priority_level) VALUES
    ('Urgent SLA', '30 minutes', '4 hours', 'urgent'),
    ('High Priority SLA', '2 hours', '24 hours', 'high'),
    ('Normal SLA', '12 hours', '72 hours', 'normal'),
    ('Low Priority SLA', '24 hours', '1 week', 'low')
ON CONFLICT (name) DO NOTHING;

-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, display_name, role, team) VALUES
    ('admin@clara.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewiEEo5Ff/4UiJOS', 'Admin User', 'admin', 'admin'),
    ('husnain@clara.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewiEEo5Ff/4UiJOS', 'Husnain (Support)', 'manager', 'support_tier1')
ON CONFLICT (email) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (email, name, phone, is_vip) VALUES
    ('test@example.com', 'Test Customer', '+1234567890', FALSE),
    ('vip@example.com', 'VIP Customer', '+9876543210', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert sample KB articles
INSERT INTO kb_articles (title, content, summary, category, state, published_at) VALUES
(
    'How to Reset Your Password',
    E'# Password Reset Guide\n\n## Steps:\n1. Go to login page\n2. Click "Forgot Password?"\n3. Enter your email\n4. Check your inbox for reset link\n5. Click link and create new password\n\n## Password Requirements:\n- At least 8 characters\n- One uppercase letter\n- One number\n- One special character\n\n## Troubleshooting:\n- Check spam folder if email not received\n- Link expires in 1 hour\n- Contact support@clara.ai for help',
    'Step-by-step password reset instructions',
    'password_reset',
    'published',
    NOW()
),
(
    'Billing Information',
    E'# Billing & Payment Guide\n\n## Payment Methods:\n- Credit cards (Visa, Mastercard, Amex)\n- Debit cards\n- PayPal\n- Bank transfer (enterprise only)\n\n## Billing Cycle:\n- Monthly: Same date each month\n- Annual: Yearly on subscription date\n\n## Refund Policy:\n- 30-day full refund\n- Pro-rated after 30 days\n- Contact billing@clara.ai\n\n## Update Payment:\n1. Settings → Billing\n2. Update Payment Method\n3. Enter new details\n4. Save',
    'Billing, payments, and refund information',
    'billing',
    'published',
    NOW()
)
ON CONFLICT DO NOTHING;

-- Success message
SELECT '✅ Database schema created successfully!' as status,
       (SELECT COUNT(*) FROM tickets) as tickets_count,
       (SELECT COUNT(*) FROM customers) as customers_count,
       (SELECT COUNT(*) FROM kb_articles) as kb_articles_count;
