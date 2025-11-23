-- ============================================================================
-- CLARA CRM - Supabase Database Schema
-- ============================================================================
-- This schema creates the necessary tables for the Clara multi-agent system
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    website VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional info
    notes TEXT,
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    
    -- Indexes
    CONSTRAINT clients_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- ============================================================================
-- LEADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Lead Information
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    title VARCHAR(255),
    
    -- BANT Qualification
    budget VARCHAR(50),
    authority VARCHAR(100),
    need TEXT,
    timeline VARCHAR(100),
    
    -- Scoring
    qualification_status VARCHAR(50) DEFAULT 'unqualified',
    lead_score INTEGER DEFAULT 0,
    score_grade VARCHAR(2),
    
    -- Source and Context
    source VARCHAR(100) DEFAULT 'voice_call',
    conversation_summary TEXT,
    extracted_info JSONB,
    
    -- Agent tracking
    assigned_agent VARCHAR(50),
    last_interaction TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    status VARCHAR(50) DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_qualification_status ON public.leads(qualification_status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- ============================================================================
-- ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    
    -- Activity Information
    activity_type VARCHAR(50) NOT NULL,
    agent_type VARCHAR(50),
    description TEXT,
    outcome VARCHAR(100),
    
    -- Conversation Data
    message_content TEXT,
    agent_response TEXT,
    session_id VARCHAR(255),
    
    -- Classification
    intent VARCHAR(50),
    confidence DECIMAL(3,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional data
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_activities_client_id ON public.activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON public.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_session_id ON public.activities(session_id);

-- ============================================================================
-- CONVERSATIONS TABLE (for tracking conversation history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    
    -- Conversation tracking
    agent_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    
    -- Messages (stored as JSONB array)
    messages JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Summary
    summary TEXT,
    
    CONSTRAINT conversations_session_id_key UNIQUE (session_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to insert sample data:

-- INSERT INTO public.clients (name, email, company, industry, company_size)
-- VALUES 
--     ('John Doe', 'john@example.com', 'Acme Corp', 'Technology', '50-200'),
--     ('Jane Smith', 'jane@techstart.com', 'TechStart Inc', 'SaaS', '10-50');

-- ============================================================================
-- ROW LEVEL SECURITY (Optional - Uncomment if needed)
-- ============================================================================
-- Enable RLS on tables:
-- ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies (example - service role has full access):
-- CREATE POLICY "Service role has full access to clients" 
--     ON public.clients FOR ALL 
--     USING (true) 
--     WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the schema was created successfully:

-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- SELECT * FROM public.clients LIMIT 1;
-- SELECT * FROM public.leads LIMIT 1;
-- SELECT * FROM public.activities LIMIT 1;
-- SELECT * FROM public.conversations LIMIT 1;

