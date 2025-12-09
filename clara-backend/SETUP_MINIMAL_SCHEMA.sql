-- ============================================================================
-- MINIMAL SCHEMA for Clara ↔ TrendtialCRM Integration
-- Run this in Supabase SQL Editor if tables don't exist
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('agent', 'manager', 'super_admin')),
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CLIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL UNIQUE,
    company TEXT,
    industry TEXT,
    location TEXT,
    phone TEXT,
    email TEXT,
    company_size INTEGER,
    expected_value NUMERIC,
    physical_meeting_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PIPELINE_STAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    order_position INTEGER NOT NULL,
    probability INTEGER CHECK (probability BETWEEN 0 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    color_code TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default stages
INSERT INTO public.pipeline_stages (name, description, order_position, probability, color_code) 
VALUES
    ('New Lead', 'Initial contact made', 1, 10, '#94A3B8'),
    ('Qualified', 'Lead meets BANT criteria', 2, 25, '#3B82F6'),
    ('Demo Scheduled', 'Product demo scheduled', 3, 40, '#8B5CF6'),
    ('Proposal Sent', 'Proposal submitted', 4, 60, '#F59E0B'),
    ('Negotiation', 'Discussing terms', 5, 80, '#EF4444'),
    ('Closed Won', 'Deal closed', 6, 100, '#10B981'),
    ('Closed Lost', 'Deal lost', 7, 0, '#6B7280')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. LEADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- TrendtialCRM fields
    status_bucket TEXT CHECK (status_bucket IN ('P1', 'P2', 'P3')),
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    deal_value NUMERIC,
    industry TEXT,
    
    -- Clara AI fields
    budget TEXT,
    authority TEXT,
    need TEXT,
    timeline TEXT,
    
    -- Status & Scoring
    qualification_status TEXT DEFAULT 'unqualified' CHECK (
        qualification_status IN ('unqualified', 'marketing_qualified', 'sales_qualified', 'opportunity')
    ),
    lead_score INTEGER DEFAULT 0,
    
    -- Pipeline
    pipeline_stage_id UUID REFERENCES public.pipeline_stages(id),
    expected_close_date DATE,
    win_probability INTEGER CHECK (win_probability BETWEEN 0 AND 100),
    
    -- Source tracking
    lead_source TEXT DEFAULT 'voice_assistant',
    campaign_id TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- Progress
    progress_details TEXT,
    next_step TEXT,
    follow_up_due_date DATE,
    notes TEXT,
    tags TEXT[],
    
    -- Clara context
    conversation_summary TEXT,
    extracted_info JSONB,
    
    -- Sync
    sync_lock BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    first_touch_date TIMESTAMPTZ DEFAULT NOW(),
    last_touch_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. CALLS TABLE (Voice tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    
    -- Call details
    session_id TEXT,
    duration INTEGER,
    call_type TEXT CHECK (call_type IN ('inbound', 'outbound', 'callback', 'voicemail', 'ai_voice')),
    outcome TEXT CHECK (outcome IN ('completed', 'no_answer', 'busy', 'failed', 'voicemail', 'qualified', 'not_interested')),
    
    -- AI fields
    transcript TEXT,
    sentiment_score NUMERIC(3,2),
    intent_detected TEXT,
    confidence_score NUMERIC(3,2),
    
    -- Timing
    call_start_time TIMESTAMPTZ NOT NULL,
    call_end_time TIMESTAMPTZ,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. LEAD_ACTIVITIES TABLE (Activity timeline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type TEXT CHECK (
        activity_type IN ('email', 'call', 'meeting', 'note', 'status_change', 
                         'document', 'task', 'demo', 'ai_interaction')
    ),
    subject TEXT,
    description TEXT,
    activity_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Creator
    created_by UUID REFERENCES public.users(id),
    metadata JSONB DEFAULT '{}',
    is_automated BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. FOLLOW_UPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.users(id),
    
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rescheduled', 'Cancelled')),
    notes TEXT,
    
    -- AI fields
    suggested_by_ai BOOLEAN DEFAULT FALSE,
    ai_recommendation TEXT,
    
    -- Metadata
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- 8. MEETINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    agent_id UUID NOT NULL REFERENCES public.users(id),
    
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Pending', 'Cancelled')),
    location TEXT,
    notes TEXT,
    
    -- AI fields
    scheduled_by_ai BOOLEAN DEFAULT FALSE,
    meeting_type TEXT,
    
    -- Metadata
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON public.leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_bucket ON public.leads(status_bucket);
CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON public.calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_session_id ON public.calls(session_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_agent_id ON public.follow_ups(agent_id);
CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON public.meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_agent_id ON public.meetings(agent_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically
-- Add basic policies for authenticated users

-- Users can view their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Leads visibility based on assignment
CREATE POLICY "Users can view assigned leads" ON public.leads
    FOR SELECT USING (
        auth.uid() = agent_id OR 
        auth.uid() = created_by
    );

-- Anyone can insert (will be restricted by app logic)
CREATE POLICY "Authenticated users can insert leads" ON public.leads
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- CREATE CLARA AI AGENT USER
-- ============================================================================
-- Note: This needs to be done through Supabase Auth UI or with proper auth.users insert
-- For now, just create the public.users entry (assuming auth.users exists)

-- You'll need to manually create this in Auth UI first, then run:
-- INSERT INTO public.users (id, email, full_name, role)
-- VALUES ('<auth-user-id>', 'clara@trendtialcrm.ai', 'Clara AI Voice Assistant', 'agent');

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify all tables were created:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

