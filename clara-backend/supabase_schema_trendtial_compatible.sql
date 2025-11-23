-- ============================================================================
-- CLARA CRM - TrendtialCRM Compatible Database Schema
-- ============================================================================
-- This schema is designed to work seamlessly with the existing TrendtialCRM
-- frontend while adding Clara's AI voice agent capabilities
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (Integration with TrendtialCRM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('agent', 'manager', 'super_admin')),
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Additional fields
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON public.users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

COMMENT ON TABLE public.users IS 'User profiles with role-based access control';

-- ============================================================================
-- CLIENTS TABLE (TrendtialCRM Compatible)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info (matching TrendtialCRM field names)
    client_name VARCHAR(255) NOT NULL,  -- Note: 'client_name' not 'name'
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    
    -- Company Details
    industry VARCHAR(100),
    company_size INTEGER,  -- Changed from VARCHAR to INTEGER for TrendtialCRM
    location VARCHAR(255),  -- Added for TrendtialCRM
    website VARCHAR(255),
    
    -- Meeting & Value Info (TrendtialCRM specific)
    physical_meeting_info TEXT,
    expected_value DECIMAL(12,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    
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
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);

COMMENT ON TABLE public.clients IS 'Client/Company information - compatible with TrendtialCRM';

-- ============================================================================
-- PIPELINE_STAGES TABLE (TrendtialCRM Feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    order_position INTEGER NOT NULL,
    probability INTEGER CHECK (probability BETWEEN 0 AND 100),
    is_active BOOLEAN DEFAULT TRUE,
    color_code VARCHAR(7) DEFAULT '#3B82F6',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON public.pipeline_stages(order_position);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_active ON public.pipeline_stages(is_active);

COMMENT ON TABLE public.pipeline_stages IS 'Sales pipeline stages for deal tracking';

-- Insert default pipeline stages
INSERT INTO public.pipeline_stages (name, description, order_position, probability, color_code) VALUES
    ('New Lead', 'Initial contact made', 1, 10, '#94A3B8'),
    ('Qualified', 'Lead meets BANT criteria', 2, 25, '#3B82F6'),
    ('Demo Scheduled', 'Product demo scheduled', 3, 40, '#8B5CF6'),
    ('Proposal Sent', 'Proposal submitted to client', 4, 60, '#F59E0B'),
    ('Negotiation', 'Discussing terms and pricing', 5, 80, '#EF4444'),
    ('Closed Won', 'Deal successfully closed', 6, 100, '#10B981'),
    ('Closed Lost', 'Deal lost', 7, 0, '#6B7280')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LEADS TABLE (Enhanced with TrendtialCRM + Clara Features)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Agent Assignment (TrendtialCRM uses agent_id as UUID FK)
    agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- TrendtialCRM Status System
    status_bucket TEXT CHECK (status_bucket IN ('P1', 'P2', 'P3')),  -- Priority buckets
    
    -- Lead Information
    contact_person VARCHAR(255),  -- TrendtialCRM field name
    email VARCHAR(255),
    phone VARCHAR(50),
    title VARCHAR(255),
    deal_value DECIMAL(12,2),
    
    -- Clara's BANT Qualification (AI Voice Agent Strength!)
    budget VARCHAR(50),
    authority VARCHAR(100),
    need TEXT,
    timeline VARCHAR(100),
    
    -- Scoring (Compatible with both systems)
    qualification_status VARCHAR(50) DEFAULT 'unqualified' CHECK (
        qualification_status IN ('unqualified', 'marketing_qualified', 'sales_qualified', 'opportunity')
    ),
    lead_score INTEGER DEFAULT 0,
    score_grade VARCHAR(2),
    
    -- Pipeline Integration (TrendtialCRM)
    pipeline_stage_id UUID REFERENCES public.pipeline_stages(id),
    expected_close_date DATE,
    win_probability INTEGER CHECK (win_probability BETWEEN 0 AND 100),
    lost_reason TEXT,
    
    -- Source and Campaign Tracking (TrendtialCRM)
    lead_source VARCHAR(100) DEFAULT 'voice_call',  -- Clara's specialty!
    campaign_id VARCHAR(100),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    referrer_url TEXT,
    first_touch_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_touch_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Clara's AI Context
    conversation_summary TEXT,
    extracted_info JSONB,
    last_interaction TIMESTAMP WITH TIME ZONE,
    
    -- TrendtialCRM Fields
    progress_details TEXT,
    next_step TEXT,
    follow_up_due_date DATE,
    notes TEXT,
    tags TEXT[],
    industry VARCHAR(100),
    
    -- Google Sheets Sync (TrendtialCRM feature)
    sync_lock BOOLEAN DEFAULT FALSE,
    sheet_row_id TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    
    -- Status
    status VARCHAR(50) DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON public.leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_qualification_status ON public.leads(qualification_status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_status_bucket ON public.leads(status_bucket);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage_id ON public.leads(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);

COMMENT ON TABLE public.leads IS 'Sales leads with AI qualification and traditional CRM features';
COMMENT ON COLUMN public.leads.status_bucket IS 'TrendtialCRM priority system: P1 (hot), P2 (warm), P3 (cold)';
COMMENT ON COLUMN public.leads.budget IS 'BANT: Budget identified by Clara AI';
COMMENT ON COLUMN public.leads.authority IS 'BANT: Authority/Decision maker identified';
COMMENT ON COLUMN public.leads.need IS 'BANT: Identified customer need';
COMMENT ON COLUMN public.leads.timeline IS 'BANT: Expected timeline for purchase';

-- ============================================================================
-- CALLS TABLE (Critical for Voice Integration!)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,  -- NULL for AI calls
    
    -- Call Details
    session_id VARCHAR(255),  -- Link to conversations.session_id
    duration INTEGER,  -- in seconds
    call_type TEXT NOT NULL CHECK (call_type IN ('inbound', 'outbound', 'callback', 'voicemail', 'ai_voice')),
    outcome TEXT NOT NULL CHECK (outcome IN ('completed', 'no_answer', 'busy', 'failed', 'voicemail', 'qualified', 'not_interested')),
    
    -- AI-Specific Fields (Clara's additions)
    transcript TEXT,
    sentiment_score DECIMAL(3,2),  -- -1.0 to 1.0
    intent_detected VARCHAR(100),
    confidence_score DECIMAL(3,2),  -- 0.0 to 1.0
    
    -- General Fields
    notes TEXT,
    call_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    call_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_lead_id ON public.calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON public.calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_session_id ON public.calls(session_id);
CREATE INDEX IF NOT EXISTS idx_calls_call_start_time ON public.calls(call_start_time);
CREATE INDEX IF NOT EXISTS idx_calls_call_type ON public.calls(call_type);

COMMENT ON TABLE public.calls IS 'Voice call tracking - includes AI voice agent calls';
COMMENT ON COLUMN public.calls.call_type IS 'ai_voice type is used by Clara voice agent';
COMMENT ON COLUMN public.calls.transcript IS 'Full conversation transcript from STT';

-- ============================================================================
-- ACTIVITIES TABLE (TrendtialCRM Compatible)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    
    -- Activity Information
    activity_type VARCHAR(50) NOT NULL CHECK (
        activity_type IN ('email', 'call', 'meeting', 'note', 'status_change', 
                         'document', 'task', 'demo', 'ai_interaction')
    ),
    subject TEXT,
    description TEXT,
    outcome VARCHAR(100),
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Agent tracking
    created_by UUID REFERENCES public.users(id),
    agent_type VARCHAR(50),  -- 'sales', 'support', 'marketing', 'ai'
    
    -- Conversation Data (Clara-specific)
    message_content TEXT,
    agent_response TEXT,
    session_id VARCHAR(255),
    
    -- Classification (from Clara's orchestrator)
    intent VARCHAR(50),
    confidence DECIMAL(3,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional data
    metadata JSONB,
    is_automated BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_client_id ON public.activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON public.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_session_id ON public.activities(session_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON public.activities(created_by);

COMMENT ON TABLE public.activities IS 'Timeline of all interactions with leads and clients';

-- ============================================================================
-- FOLLOW_UPS TABLE (TrendtialCRM Feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.users(id),
    
    -- Follow-up Details
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Rescheduled', 'Cancelled')),
    notes TEXT,
    
    -- AI Suggestions (Clara can auto-suggest follow-ups)
    suggested_by_ai BOOLEAN DEFAULT FALSE,
    ai_recommendation TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_agent_id ON public.follow_ups(agent_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON public.follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(status);

COMMENT ON TABLE public.follow_ups IS 'Scheduled follow-up tasks for leads';

-- ============================================================================
-- MEETINGS TABLE (TrendtialCRM Feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    agent_id UUID NOT NULL REFERENCES public.users(id),
    
    -- Meeting Details
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Pending', 'Cancelled')),
    location TEXT,  -- physical address or virtual meeting link
    notes TEXT,
    
    -- AI Integration (Clara can auto-schedule)
    scheduled_by_ai BOOLEAN DEFAULT FALSE,
    meeting_type VARCHAR(50),  -- 'demo', 'discovery', 'closing', etc.
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON public.meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_agent_id ON public.meetings(agent_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON public.meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);

COMMENT ON TABLE public.meetings IS 'Scheduled meetings with leads and clients';

-- ============================================================================
-- CONVERSATIONS TABLE (Clara's Session Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id),  -- The agent (can be NULL for AI-only)
    
    -- Conversation tracking
    agent_type VARCHAR(50),  -- 'sales', 'support', 'marketing'
    status VARCHAR(50) DEFAULT 'active',
    channel VARCHAR(50) DEFAULT 'voice',  -- 'voice', 'chat', 'email'
    
    -- Messages (stored as JSONB array)
    messages JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Summary
    summary TEXT,
    outcome VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

COMMENT ON TABLE public.conversations IS 'Clara voice conversation sessions with full history';

-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON public.calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON public.follow_ups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON public.pipeline_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - TrendtialCRM Compatible
-- ============================================================================
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile and team members"
    ON public.users FOR SELECT
    USING (
        id = auth.uid() 
        OR manager_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'super_admin'))
    );

-- Leads policies (agents see their own, managers see team, admins see all)
CREATE POLICY "Users can view leads based on role"
    ON public.leads FOR SELECT
    USING (
        agent_id = auth.uid()  -- Agents see their own
        OR created_by = auth.uid()
        OR EXISTS (  -- Managers see their team's leads
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'manager'
            AND id IN (SELECT manager_id FROM public.users WHERE id = leads.agent_id)
        )
        OR EXISTS (  -- Super admins see all
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Similar policies for other tables...
CREATE POLICY "Users can insert leads"
    ON public.leads FOR INSERT
    WITH CHECK (
        agent_id = auth.uid() OR created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('manager', 'super_admin'))
    );

-- Service role bypasses RLS (for Clara backend)
-- When using SUPABASE_SERVICE_KEY, all policies are bypassed

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to insert sample data for development:

-- INSERT INTO public.users (id, full_name, email, role)
-- SELECT 
--     gen_random_uuid(),
--     'Clara AI Agent',
--     'clara@example.com',
--     'agent'
-- WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'clara@example.com');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the schema was created successfully:

-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- SELECT * FROM public.pipeline_stages ORDER BY order_position;

