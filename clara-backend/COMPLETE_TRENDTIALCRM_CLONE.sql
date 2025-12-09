-- ============================================================================
-- COMPLETE TRENDTIALCRM DATABASE CLONE SCRIPT
-- ============================================================================
-- This script contains ALL elements from your TrendtialCRM Supabase database:
-- - Custom Types (Enums)
-- - Tables with ALL columns, constraints, and relationships
-- - Database Functions (Stored Procedures)
-- - Triggers
-- - Row Level Security (RLS) Policies
-- - Default Data (Pipeline Stages)
-- ============================================================================
-- USAGE:
-- 1. Create a new Supabase project OR
-- 2. Connect to your existing project in a separate schema
-- 3. Run this entire script in Supabase SQL Editor
-- ============================================================================

-- Enable Required Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- PART 1: CUSTOM TYPES (ENUMS)
-- ============================================================================

-- Attendance Status Enum
CREATE TYPE attendance_status_enum AS ENUM ('CheckedOut', 'CheckedIn', 'OnLeave');

-- Team Type Enum
CREATE TYPE team_type_enum AS ENUM ('telesales', 'linkedin', 'cold_email');

-- Todo Status Enum
CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Todo Priority Enum
CREATE TYPE todo_priority AS ENUM ('low', 'medium', 'high', 'urgent');


-- ============================================================================
-- PART 2: CORE TABLES
-- ============================================================================

-- Table: users
-- ============================================================================
-- Stores app-specific user details and roles. The id should reference auth.users.id.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('agent', 'manager', 'super_admin')),
    manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.users IS 'Stores app-specific user details and roles. The id should reference auth.users.id.';


-- Table: clients
-- ============================================================================
-- Stores client information, potentially synced from Google Sheets. client_name is the sync key.
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL UNIQUE,
    company TEXT,
    industry TEXT,
    location TEXT,
    phone TEXT,
    physical_meeting_info TEXT,
    expected_value NUMERIC,
    company_size INTEGER,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.clients IS 'Stores client information, potentially synced from Google Sheets. client_name is the sync key.';


-- Table: pipeline_stages
-- ============================================================================
-- Configurable sales pipeline stages with probability
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    order_position INTEGER NOT NULL UNIQUE,
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    is_active BOOLEAN DEFAULT TRUE,
    color_code TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.pipeline_stages IS 'Configurable sales pipeline stages with probability';


-- Table: leads
-- ============================================================================
-- Represents an engagement or deal with a client, managed by an agent. Links to clients and users.
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status_bucket TEXT NOT NULL CHECK (status_bucket IN ('P1', 'P2', 'P3')),
    lead_score INTEGER DEFAULT 0,
    qualification_status TEXT DEFAULT 'unqualified' CHECK (
        qualification_status IN ('unqualified', 'marketing_qualified', 'sales_qualified', 'opportunity')
    ),
    campaign_id TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer_url TEXT,
    first_touch_date TIMESTAMP WITH TIME ZONE,
    last_touch_date TIMESTAMP WITH TIME ZONE,
    progress_details TEXT,
    next_step TEXT,
    lead_source TEXT,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    deal_value NUMERIC,
    tags TEXT[],
    follow_up_due_date TIMESTAMP WITH TIME ZONE,
    sync_lock BOOLEAN DEFAULT FALSE,
    notes TEXT,
    pipeline_stage_id UUID REFERENCES public.pipeline_stages(id),
    expected_close_date DATE,
    win_probability INTEGER DEFAULT 0 CHECK (win_probability >= 0 AND win_probability <= 100),
    lost_reason TEXT,
    industry TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.leads IS 'Represents an engagement or deal with a client, managed by an agent. Links to clients and users.';
COMMENT ON COLUMN public.leads.industry IS 'Industry category for the lead/prospect';


-- Table: calls
-- ============================================================================
-- Tracks all calls made to/from leads
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    duration INTEGER,
    call_type TEXT NOT NULL CHECK (call_type IN ('inbound', 'outbound', 'callback', 'voicemail')),
    outcome TEXT NOT NULL CHECK (outcome IN ('completed', 'no_answer', 'busy', 'failed', 'voicemail')),
    notes TEXT,
    call_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.calls IS 'Tracks all calls made to/from leads';
COMMENT ON COLUMN public.calls.duration IS 'Duration of the call in seconds';
COMMENT ON COLUMN public.calls.call_type IS 'Type of call: inbound, outbound, callback, or voicemail';
COMMENT ON COLUMN public.calls.outcome IS 'Outcome of the call: completed, no_answer, busy, failed, or voicemail';


-- Table: meetings
-- ============================================================================
-- Stores details of meetings scheduled with leads
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    agent_id UUID NOT NULL REFERENCES public.users(id),
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    notes TEXT,
    status TEXT,
    created_by UUID DEFAULT auth.uid() REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.meetings IS 'Stores details of meetings scheduled with leads.';


-- Table: follow_ups
-- ============================================================================
-- Tracks follow-up activities for leads
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.users(id),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    created_by UUID DEFAULT auth.uid() REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.follow_ups IS 'Tracks follow-up activities for leads.';


-- Table: lead_activities
-- ============================================================================
-- Timeline of all interactions and activities for leads
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (
        activity_type IN ('email', 'call', 'meeting', 'note', 'status_change', 'document', 'task', 'demo')
    ),
    subject TEXT,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id),
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::JSONB,
    is_automated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.lead_activities IS 'Timeline of all interactions and activities for leads';


-- Table: admin_audit
-- ============================================================================
-- Logs administrative actions within the system
CREATE TABLE IF NOT EXISTS public.admin_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    target_entity TEXT,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.admin_audit IS 'Logs administrative actions within the system.';


-- Table: attendance
-- ============================================================================
-- Stores daily attendance records for users
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status attendance_status_enum DEFAULT 'CheckedOut',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.attendance IS 'Stores daily attendance records for users.';


-- Table: daily_reports
-- ============================================================================
-- Stores daily performance reports submitted by agents
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.users(id),
    manager_id UUID REFERENCES public.users(id),
    report_date DATE NOT NULL,
    team_type team_type_enum NOT NULL,
    outreach_count INTEGER,
    responses_count INTEGER,
    comments_done INTEGER,
    content_posted BOOLEAN,
    emails_sent INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.daily_reports IS 'Stores daily performance reports submitted by agents.';
COMMENT ON COLUMN public.daily_reports.outreach_count IS 'General outreach count, e.g., calls for telesales, DMs for LinkedIn.';
COMMENT ON COLUMN public.daily_reports.emails_sent IS 'Specific to cold email outreach.';


-- Table: notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    type TEXT NOT NULL CHECK (
        type IN ('follow_up_reminder', 'meeting_reminder', 'overdue_follow_up', 
                'upcoming_meeting', 'lead_update', 'system_alert')
    ),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('follow_up', 'meeting', 'lead', 'system')),
    entity_id UUID,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT FALSE,
    notification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_method TEXT[] DEFAULT ARRAY['in_app'],
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Table: notification_preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    notification_type TEXT NOT NULL CHECK (
        notification_type IN ('follow_up_reminder', 'meeting_reminder', 'overdue_follow_up',
                             'upcoming_meeting', 'lead_update', 'system_alert')
    ),
    enabled BOOLEAN DEFAULT TRUE,
    reminder_minutes INTEGER[] DEFAULT ARRAY[15, 60, 1440],
    delivery_methods TEXT[] DEFAULT ARRAY['in_app', 'sound'],
    email_enabled BOOLEAN DEFAULT FALSE,
    browser_push_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    sound_type TEXT DEFAULT 'info' CHECK (sound_type IN ('success', 'error', 'info')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Table: nurture_sequences
-- ============================================================================
-- Automated email/task sequences for lead nurturing
CREATE TABLE IF NOT EXISTS public.nurture_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.users(id),
    trigger_conditions JSONB DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.nurture_sequences IS 'Automated email/task sequences for lead nurturing';


-- Table: nurture_steps
-- ============================================================================
-- Individual steps in nurturing sequences
CREATE TABLE IF NOT EXISTS public.nurture_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID NOT NULL REFERENCES public.nurture_sequences(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (
        action_type IN ('email', 'task', 'call', 'sms', 'notification')
    ),
    content TEXT,
    delay_days INTEGER DEFAULT 0,
    template_data JSONB DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.nurture_steps IS 'Individual steps in nurturing sequences';


-- Table: lead_nurture_enrollments
-- ============================================================================
-- Tracks which leads are enrolled in which sequences
CREATE TABLE IF NOT EXISTS public.lead_nurture_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    sequence_id UUID NOT NULL REFERENCES public.nurture_sequences(id) ON DELETE CASCADE,
    current_step INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (
        status IN ('active', 'paused', 'completed', 'cancelled')
    ),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    next_action_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.lead_nurture_enrollments IS 'Tracks which leads are enrolled in which sequences';


-- Table: lead_scoring_criteria
-- ============================================================================
-- Rules for automatic lead scoring based on various criteria
CREATE TABLE IF NOT EXISTS public.lead_scoring_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN ('demographic', 'behavioral', 'engagement', 'firmographic')
    ),
    condition_field TEXT NOT NULL,
    condition_operator TEXT NOT NULL CHECK (
        condition_operator IN ('equals', 'contains', 'greater_than', 'less_than', 'in_range')
    ),
    condition_value TEXT NOT NULL,
    score_points INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.lead_scoring_criteria IS 'Rules for automatic lead scoring based on various criteria';


-- Table: todos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    category TEXT,
    assigned_by UUID REFERENCES public.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    status todo_status DEFAULT 'pending',
    priority todo_priority DEFAULT 'medium',
    tags TEXT[] DEFAULT '{}',
    order_position INTEGER DEFAULT 0,
    is_team_task BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Table: todo_comments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.todo_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Table: todo_attachments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.todo_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Table: user_links
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_links (
    id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    email TEXT NOT NULL,
    instagram_link TEXT,
    linkedin_link TEXT,
    instagram_handle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);


-- ============================================================================
-- PART 3: DATABASE FUNCTIONS (STORED PROCEDURES)
-- ============================================================================

-- Function: handle_updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Function: update_updated_at_column
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Function: trigger_set_timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Function: set_completed_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Function: handle_new_user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'agent') -- Default role for new users is 'agent'
  ON CONFLICT (id) DO NOTHING; -- Avoid error if user somehow already exists
  RETURN NEW;
END;
$$;


-- Function: get_current_user_role
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Look for the role in the users table instead of auth metadata
  RETURN (SELECT role FROM users WHERE id = auth.uid());
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if role not found or on error
    RETURN NULL;
END;
$$;


-- Function: is_manager_of
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_manager_of(manager_user_id UUID, agent_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = agent_user_id AND manager_id = manager_user_id
  );
$$;


-- Function: validate_client_changes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_client_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role_var TEXT;
BEGIN
  current_user_role_var := public.get_current_user_role();

  IF current_user_role_var = 'super_admin' OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  IF NEW.client_name IS NULL OR NEW.client_name = '' THEN
    RAISE EXCEPTION 'Client name cannot be empty.';
  END IF;
  
  RETURN NEW;
END;
$$;


-- Function: validate_lead_engagement_changes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_lead_engagement_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role_var TEXT;
BEGIN
  current_user_role_var := public.get_current_user_role();

  IF current_user_role_var = 'super_admin' OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = NEW.client_id) THEN
    RAISE EXCEPTION 'Invalid client_id. Client does not exist.';
  END IF;

  IF NEW.agent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = NEW.agent_id) THEN
    RAISE EXCEPTION 'Invalid agent_id. User does not exist.';
  END IF;
  
  IF NEW.status_bucket NOT IN ('P1', 'P2', 'P3') THEN
      RAISE EXCEPTION 'Invalid status_bucket value for lead.';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF current_user_role_var = 'agent' THEN
      IF NEW.agent_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Agents can only create leads assigned to themselves.';
      END IF;
    ELSIF current_user_role_var = 'manager' THEN
      IF NEW.agent_id IS NOT NULL AND NEW.agent_id <> auth.uid() AND NOT public.is_manager_of(auth.uid(), NEW.agent_id) THEN
        RAISE EXCEPTION 'Managers can only assign new leads to themselves or their direct reports.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Permission denied to insert lead for this role.';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF current_user_role_var = 'agent' THEN
      IF NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
        RAISE EXCEPTION 'Agents cannot reassign leads.';
      END IF;
      IF NEW.client_id IS DISTINCT FROM OLD.client_id THEN
        RAISE EXCEPTION 'Agents cannot change the client for an existing lead.';
      END IF;
    ELSIF current_user_role_var = 'manager' THEN
      IF NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
        IF NEW.agent_id IS NOT NULL AND NEW.agent_id <> auth.uid() AND NOT public.is_manager_of(auth.uid(), NEW.agent_id) THEN
          RAISE EXCEPTION 'Managers can only assign/reassign leads to themselves or their direct reports.';
        END IF;
      END IF;
      IF NEW.client_id IS DISTINCT FROM OLD.client_id THEN
        RAISE EXCEPTION 'Managers cannot change the client for an existing lead.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Permission denied to update lead for this role.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- Function: validate_follow_up_changes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_follow_up_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role_var TEXT;
  is_super_admin_var BOOLEAN := FALSE;
  target_lead_agent_id UUID;
BEGIN
  current_user_role_var := public.get_current_user_role();

  IF current_user_role_var = 'super_admin' THEN
    is_super_admin_var := TRUE;
  END IF;

  IF is_super_admin_var THEN
    RETURN NEW; -- Super admins bypass these checks
  END IF;

  -- Fetch the agent_id of the lead this follow-up is for
  SELECT agent_id INTO target_lead_agent_id FROM public.leads WHERE id = NEW.lead_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found for follow-up.';
  END IF;

  -- Common checks
  IF NEW.agent_id IS NULL THEN
      RAISE EXCEPTION 'Follow-up must be assigned to an agent.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = NEW.agent_id) THEN
    RAISE EXCEPTION 'Invalid agent_id for follow-up.';
  END IF;


  IF TG_OP = 'INSERT' THEN
    IF current_user_role_var = 'agent' THEN
      IF NEW.agent_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Agents can only create follow-ups for themselves.';
      END IF;
      IF target_lead_agent_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Agents can only create follow-ups for their own leads.';
      END IF;
    ELSIF current_user_role_var = 'manager' THEN
      IF NEW.agent_id <> auth.uid() AND NOT public.is_manager_of(auth.uid(), NEW.agent_id) THEN
        RAISE EXCEPTION 'Managers can only assign follow-ups to themselves or their reports.';
      END IF;
      -- Check if manager has access to the lead
      IF target_lead_agent_id IS NOT NULL AND target_lead_agent_id <> auth.uid() AND NOT public.is_manager_of(auth.uid(), target_lead_agent_id) THEN
        RAISE EXCEPTION 'Managers can only create follow-ups for leads assigned to themselves, their reports, or unassigned leads.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Permission denied to insert follow-up for this role.';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF current_user_role_var = 'agent' THEN
      -- RLS USING ensures agent is operating on their own follow-up (OLD.agent_id = auth.uid())
      IF NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
        RAISE EXCEPTION 'Agents cannot reassign follow-ups.';
      END IF;
      IF NEW.lead_id IS DISTINCT FROM OLD.lead_id THEN
         -- If lead_id changes, re-check lead ownership for agent
         SELECT agent_id INTO target_lead_agent_id FROM public.leads WHERE id = NEW.lead_id;
         IF target_lead_agent_id IS DISTINCT FROM auth.uid() THEN
             RAISE EXCEPTION 'Agents can only associate follow-ups with their own leads.';
         END IF;
      END IF;
    ELSIF current_user_role_var = 'manager' THEN
      -- RLS USING ensures manager is operating on follow-up for self or report
      IF NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN -- If agent_id is being changed
        IF NEW.agent_id <> auth.uid() AND NOT public.is_manager_of(auth.uid(), NEW.agent_id) THEN
          RAISE EXCEPTION 'Managers can only assign/reassign follow-ups to themselves or their reports.';
        END IF;
      END IF;
      IF NEW.lead_id IS DISTINCT FROM OLD.lead_id THEN
         -- If lead_id changes, re-check lead accessibility for manager
         SELECT agent_id INTO target_lead_agent_id FROM public.leads WHERE id = NEW.lead_id;
         IF target_lead_agent_id IS NOT NULL AND target_lead_agent_id <> auth.uid() AND NOT public.is_manager_of(auth.uid(), target_lead_agent_id) THEN
             RAISE EXCEPTION 'Managers can only associate follow-ups with leads they can access.';
         END IF;
      END IF;
    ELSE
      RAISE EXCEPTION 'Permission denied to update follow-up for this role.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- Function: validate_meeting_changes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_meeting_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role_var TEXT;
  is_super_admin_var BOOLEAN := FALSE;
  target_lead_agent_id UUID;
BEGIN
  current_user_role_var := public.get_current_user_role();

  IF current_user_role_var = 'super_admin' THEN
    is_super_admin_var := TRUE;
  END IF;

  IF is_super_admin_var THEN
    RETURN NEW; -- Super admins bypass these checks
  END IF;

  -- Fetch lead's agent_id if lead_id is provided for the meeting
  IF NEW.lead_id IS NOT NULL THEN
    SELECT agent_id INTO target_lead_agent_id FROM public.leads WHERE id = NEW.lead_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Lead not found for meeting.';
    END IF;
  END IF; -- If NEW.lead_id is NULL, target_lead_agent_id remains NULL (meeting not tied to a lead)

  -- Common checks for meeting
  IF NEW.agent_id IS NULL THEN
      RAISE EXCEPTION 'Meeting must be assigned to an agent.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = NEW.agent_id) THEN
    RAISE EXCEPTION 'Invalid agent_id for meeting.';
  END IF;


  IF TG_OP = 'INSERT' THEN
    IF current_user_role_var = 'agent' THEN
      IF NEW.agent_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Agents can only create meetings for themselves.';
      END IF;
      IF NEW.lead_id IS NOT NULL AND target_lead_agent_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Agents can only create meetings for their own leads.';
      END IF;
    ELSIF current_user_role_var = 'manager' THEN
      IF NEW.agent_id <> auth.uid() AND NOT public.is_manager_of(auth.uid(), NEW.agent_id) THEN
        RAISE EXCEPTION 'Managers can only assign meetings to themselves or their reports.';
      END IF;
      IF NEW.lead_id IS NOT NULL AND target_lead_agent_id IS NOT NULL AND target_lead_agent_id <> auth.uid() AND NOT public.is_manager_of(auth.uid(), target_lead_agent_id) THEN
        RAISE EXCEPTION 'Managers can only create meetings for leads assigned to themselves, their reports, or unassigned leads.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Permission denied to insert meeting for this role.';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF current_user_role_var = 'agent' THEN
      -- RLS USING ensures agent is operating on their own meeting
      IF NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
        RAISE EXCEPTION 'Agents cannot reassign meetings.';
      END IF;
      IF NEW.lead_id IS DISTINCT FROM OLD.lead_id THEN
         -- If lead_id changes, re-check lead ownership for agent
         IF NEW.lead_id IS NOT NULL THEN
             SELECT agent_id INTO target_lead_agent_id FROM public.leads WHERE id = NEW.lead_id;
             IF target_lead_agent_id IS DISTINCT FROM auth.uid() THEN
                 RAISE EXCEPTION 'Agents can only associate meetings with their own leads.';
             END IF;
         END IF; -- If NEW.lead_id becomes NULL, it's allowed
      END IF;
    ELSIF current_user_role_var = 'manager' THEN
      -- RLS USING ensures manager is operating on meeting for self or report
      IF NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
        IF NEW.agent_id <> auth.uid() AND NOT public.is_manager_of(auth.uid(), NEW.agent_id) THEN
          RAISE EXCEPTION 'Managers can only assign/reassign meetings to themselves or their reports.';
        END IF;
      END IF;
      IF NEW.lead_id IS DISTINCT FROM OLD.lead_id THEN
         IF NEW.lead_id IS NOT NULL THEN
             SELECT agent_id INTO target_lead_agent_id FROM public.leads WHERE id = NEW.lead_id;
             IF target_lead_agent_id IS NOT NULL AND target_lead_agent_id <> auth.uid() AND NOT public.is_manager_of(auth.uid(), target_lead_agent_id) THEN
                 RAISE EXCEPTION 'Managers can only associate meetings with leads they can access.';
             END IF;
         END IF; -- If NEW.lead_id becomes NULL, it's allowed
      END IF;
    ELSE
      RAISE EXCEPTION 'Permission denied to update meeting for this role.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- Function: validate_user_update
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role_var TEXT; -- Renamed to avoid conflict if 'current_user_role' is a column
  is_current_user_super_admin BOOLEAN := FALSE;
BEGIN
  -- Attempt to get the role of the user performing the update.
  -- This function call itself is subject to RLS on public.users for SELECT.
  -- However, the RLS policies for SELECT on public.users we just applied should allow users to read their own role.
  -- And super_admins can read any.
  -- If get_current_user_role() returns NULL (e.g. user not in public.users yet, or no permission), handle it.
  current_user_role_var := public.get_current_user_role();

  IF current_user_role_var IS NULL THEN
    -- This might happen if the user making the change isn't properly set up in public.users
    -- Or if RLS prevents get_current_user_role() from working.
    -- As a safeguard, only allow if the authenticated user is a super_admin based on Supabase's auth.is_claims_admin()
    -- This is an approximation; ideally get_current_user_role() should always work for an authenticated user.
    IF auth.is_claims_admin() THEN
        is_current_user_super_admin := TRUE;
    ELSE
        RAISE EXCEPTION 'Permission denied: User role cannot be determined or user not found.';
    END IF;
  ELSIF current_user_role_var = 'super_admin' THEN
    is_current_user_super_admin := TRUE;
  END IF;

  -- Allow super_admin to bypass all further checks in this trigger
  IF is_current_user_super_admin THEN
    RETURN NEW;
  END IF;

  -- Common checks for non-super_admins:
  -- ID cannot be changed by anyone other than potentially system processes (not covered here)
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Changing user ID is not allowed.';
  END IF;

  -- Email change: generally, users should not change email directly in public.users if it's synced from auth.users
  -- This check applies if the user is updating themselves (OLD.id = auth.uid())
  IF NEW.email IS DISTINCT FROM OLD.email AND OLD.id = auth.uid() THEN
     RAISE EXCEPTION 'Email address cannot be changed directly. Please update via authentication settings.';
  END IF;

  -- Role-specific checks for the acting user (current_user_role_var)
  IF current_user_role_var = 'agent' THEN
    -- Agent updating their own profile (RLS USING clause should ensure OLD.id = auth.uid())
    IF OLD.id = auth.uid() THEN
      IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Agents cannot change their own role.';
      END IF;
      IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
        RAISE EXCEPTION 'Agents cannot change their own manager.';
      END IF;
      -- Agents can update their full_name, other non-critical profile fields.
    ELSE
      -- This case means an agent is trying to update someone else, which RLS USING should prevent.
      RAISE EXCEPTION 'Agents can only update their own profile.';
    END IF;
  ELSIF current_user_role_var = 'manager' THEN
    -- Manager updating self OR their direct report
    IF OLD.id = auth.uid() THEN -- Manager updating their own profile
      IF NEW.role IS DISTINCT FROM OLD.role AND NEW.role = 'super_admin' THEN
         RAISE EXCEPTION 'Managers cannot promote themselves to super_admin.';
      END IF;
      -- Manager should not change their own manager; super_admin should do that.
      IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
        RAISE EXCEPTION 'Managers cannot change their own manager. Please contact a super_admin.';
      END IF;
    ELSIF OLD.manager_id = auth.uid() THEN -- Manager updating a direct report of theirs
      IF NEW.role IS DISTINCT FROM OLD.role AND (NEW.role = 'manager' OR NEW.role = 'super_admin') THEN
        RAISE EXCEPTION 'Managers cannot promote reports to ''manager'' or ''super_admin''.';
      END IF;
      -- Manager cannot assign their report to another manager. They can assign to self or unassign (NULL).
      IF NEW.manager_id IS DISTINCT FROM OLD.manager_id AND NEW.manager_id IS NOT NULL AND NEW.manager_id <> auth.uid() THEN
        RAISE EXCEPTION 'Managers can only assign reports to themselves or unassign them (set manager_id to NULL).';
      END IF;
    ELSE
      -- Manager trying to update someone who is not themself and not their direct report. RLS USING should prevent this.
      RAISE EXCEPTION 'Managers can only update their own profile or their direct reports.';
    END IF;
  ELSE
    -- Role not 'agent', 'manager', or (bypassed) 'super_admin'.
    -- Or current_user_role_var was NULL and auth.is_claims_admin() was false.
    RAISE EXCEPTION 'Permission denied for this update operation due to unrecognized role or insufficient privileges.';
  END IF;

  RETURN NEW;
END;
$$;


-- Function: bulk_import_leads
-- ============================================================================
CREATE OR REPLACE FUNCTION public.bulk_import_leads(leads_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lead_item JSONB;
  v_agent_id UUID;
  v_client_id UUID;
  v_lead_id UUID;
  imported_count INTEGER := 0;
  failed_count INTEGER := 0;
  errors TEXT[] := '{}';
  current_importing_user_id UUID := auth.uid(); -- The user initiating the bulk import
BEGIN
  -- Ensure the input is a JSON array
  IF jsonb_typeof(leads_data) <> 'array' THEN
    RAISE EXCEPTION 'Input must be a JSON array of lead objects.';
  END IF;

  FOR lead_item IN SELECT * FROM jsonb_array_elements(leads_data)
  LOOP
    v_agent_id := NULL; -- Reset for each item
    v_client_id := NULL;
    v_lead_id := NULL;

    BEGIN
      -- 1. Handle Agent
      IF lead_item ? 'agent_name' AND lead_item ->> 'agent_name' IS NOT NULL AND trim(lead_item ->> 'agent_name') <> '' THEN
        SELECT id INTO v_agent_id FROM public.users WHERE lower(full_name) = lower(trim(lead_item ->> 'agent_name'));
        -- If agent not found, v_agent_id remains NULL (unassigned)
      END IF;

      -- 2. Handle Client (Find or Create)
      IF NOT (lead_item ? 'client_name') OR lead_item ->> 'client_name' IS NULL OR trim(lead_item ->> 'client_name') = '' THEN
        RAISE EXCEPTION 'client_name is required for each lead item.';
      END IF;

      INSERT INTO public.clients (
        client_name, company, industry, location, phone, physical_meeting_info, expected_value
      )
      VALUES (
        trim(lead_item ->> 'client_name'),
        lead_item ->> 'company',
        lead_item ->> 'industry',
        lead_item ->> 'location',
        lead_item ->> 'phone_number',
        lead_item ->> 'physical_meeting_info',
        (lead_item ->> 'expected_value')::NUMERIC
      )
      ON CONFLICT (client_name) DO UPDATE SET
        company = EXCLUDED.company,
        industry = EXCLUDED.industry,
        location = EXCLUDED.location,
        phone = EXCLUDED.phone,
        physical_meeting_info = EXCLUDED.physical_meeting_info,
        expected_value = EXCLUDED.expected_value,
        updated_at = NOW()
      RETURNING id INTO v_client_id;

      -- If client was updated, ON CONFLICT doesn't return id by default in all PG versions in RETURNING.
      -- So, if v_client_id is NULL after an ON CONFLICT, query it.
      IF v_client_id IS NULL THEN
          SELECT id INTO v_client_id FROM public.clients WHERE client_name = trim(lead_item ->> 'client_name');
      END IF;
      
      IF v_client_id IS NULL THEN
          RAISE EXCEPTION 'Failed to find or create client: %', lead_item ->> 'client_name';
      END IF;

      -- 3. Create Lead Engagement
      IF NOT (lead_item ? 'status_bucket') OR lead_item ->> 'status_bucket' IS NULL OR 
         NOT (lead_item ->> 'status_bucket' IN ('P1', 'P2', 'P3')) THEN
        RAISE EXCEPTION 'status_bucket (P1, P2, or P3) is required for lead with client: %', lead_item ->> 'client_name';
      END IF;

      INSERT INTO public.leads (
        client_id, agent_id, status_bucket, progress_details, next_step, sync_lock
      )
      VALUES (
        v_client_id,
        v_agent_id, -- Can be NULL
        lead_item ->> 'status_bucket',
        lead_item ->> 'progress_details',
        lead_item ->> 'next_step',
        FALSE -- Default sync_lock to false for new imports
      )
      RETURNING id INTO v_lead_id;

      -- Log in admin_audit that this user imported this lead
      INSERT INTO public.admin_audit (user_id, action, target_entity, target_id, details)
      VALUES (current_importing_user_id, 'LEAD_IMPORTED', 'lead', v_lead_id, jsonb_build_object('client_name', lead_item ->> 'client_name', 'imported_data', lead_item));

      imported_count := imported_count + 1;

    EXCEPTION
      WHEN OTHERS THEN
        failed_count := failed_count + 1;
        errors := array_append(errors, SQLERRM || ' (Client: ' || COALESCE(lead_item ->> 'client_name', 'N/A') || ')');
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'imported_successfully', imported_count,
    'failed_to_import', failed_count,
    'errors', errors
  );
END;
$$;


-- Function: import_leads_bulk
-- ============================================================================
CREATE OR REPLACE FUNCTION public.import_leads_bulk(leads_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lead_record JSONB;
    client_id_var UUID;
    agent_id_var UUID;
    result_record JSONB;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    errors JSONB[] := ARRAY[]::JSONB[];
    final_result JSONB;
BEGIN
    -- Loop through each lead in the input data
    FOR lead_record IN SELECT * FROM jsonb_array_elements(leads_data)
    LOOP
        BEGIN
            client_id_var := NULL;
            agent_id_var := NULL;
            
            -- Handle client creation/lookup
            IF lead_record->>'clientName' IS NOT NULL OR lead_record->>'companyName' IS NOT NULL THEN
                -- Try to find existing client
                SELECT id INTO client_id_var 
                FROM clients 
                WHERE LOWER(client_name) = LOWER(COALESCE(lead_record->>'clientName', lead_record->>'companyName'))
                LIMIT 1;
                
                -- Create client if not found
                IF client_id_var IS NULL THEN
                    INSERT INTO clients (
                        client_name,
                        company,
                        industry,
                        company_size,
                        email,
                        phone
                    ) VALUES (
                        COALESCE(lead_record->>'clientName', lead_record->>'companyName'),
                        COALESCE(lead_record->>'companyName', lead_record->>'clientName'),
                        lead_record->>'industry',
                        CASE WHEN lead_record->>'companySize' ~ '^[0-9]+$' 
                             THEN (lead_record->>'companySize')::INTEGER 
                             ELSE NULL END,
                        lead_record->>'email',
                        lead_record->>'phone'
                    ) RETURNING id INTO client_id_var;
                END IF;
            END IF;
            
            -- Handle agent lookup
            IF lead_record->>'agent_id' IS NOT NULL AND lead_record->>'agent_id' != '' THEN
                agent_id_var := (lead_record->>'agent_id')::UUID;
            END IF;
            
            -- Insert lead
            INSERT INTO leads (
                client_id,
                agent_id,
                status_bucket,
                lead_source,
                contact_person,
                email,
                phone,
                deal_value,
                notes,
                next_step,
                tags
            ) VALUES (
                client_id_var,
                agent_id_var,
                COALESCE(lead_record->>'status_bucket', lead_record->>'status', 'P1'),
                lead_record->>'leadSource',
                COALESCE(lead_record->>'contactPerson', lead_record->>'clientName'),
                lead_record->>'email',
                lead_record->>'phone',
                CASE WHEN lead_record->>'deal_value' ~ '^[0-9]+\.?[0-9]*$' 
                     THEN (lead_record->>'deal_value')::DECIMAL 
                     ELSE NULL END,
                lead_record->>'notes',
                lead_record->>'nextStep',
                CASE WHEN lead_record->>'tags' IS NOT NULL 
                     THEN string_to_array(lead_record->>'tags', ',')
                     ELSE NULL END
            );
            
            success_count := success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            errors := errors || jsonb_build_object(
                'lead_data', lead_record,
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    -- Return results
    final_result := jsonb_build_object(
        'success_count', success_count,
        'error_count', error_count,
        'errors', to_jsonb(errors)
    );
    
    RETURN final_result;
END;
$$;


-- Function: clean_import_data
-- ============================================================================
CREATE OR REPLACE FUNCTION public.clean_import_data(raw_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleaned_data JSONB := raw_data;
BEGIN
    -- Clean phone numbers (remove non-digits except +)
    IF cleaned_data->>'phone' IS NOT NULL THEN
        cleaned_data := jsonb_set(
            cleaned_data, 
            '{phone}', 
            to_jsonb(regexp_replace(cleaned_data->>'phone', '[^0-9+]', '', 'g'))
        );
    END IF;
    
    -- Clean deal values (remove currency symbols and commas)
    IF cleaned_data->>'deal_value' IS NOT NULL THEN
        cleaned_data := jsonb_set(
            cleaned_data,
            '{deal_value}',
            to_jsonb(regexp_replace(cleaned_data->>'deal_value', '[^0-9.]', '', 'g'))
        );
    END IF;
    
    -- Clean email (lowercase and trim)
    IF cleaned_data->>'email' IS NOT NULL THEN
        cleaned_data := jsonb_set(
            cleaned_data,
            '{email}',
            to_jsonb(LOWER(TRIM(cleaned_data->>'email')))
        );
    END IF;
    
    -- Convert NULL strings to actual nulls
    SELECT jsonb_object_agg(
        key, 
        CASE WHEN value::text IN ('NULL', 'null', '""', '') THEN 'null'::jsonb 
             ELSE value 
        END
    ) INTO cleaned_data
    FROM jsonb_each(cleaned_data);
    
    RETURN cleaned_data;
END;
$$;


-- Function: create_agent_if_not_exists
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_agent_if_not_exists(agent_name TEXT, agent_email TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    agent_id UUID;
    generated_email TEXT;
BEGIN
    -- Try to find existing agent by name
    SELECT id INTO agent_id 
    FROM users 
    WHERE LOWER(full_name) = LOWER(agent_name)
    AND role = 'agent'
    LIMIT 1;
    
    -- Create agent if not found
    IF agent_id IS NULL THEN
        -- Generate email if not provided
        IF agent_email IS NULL THEN
            generated_email := LOWER(REPLACE(agent_name, ' ', '.')) || '@company.com';
        ELSE
            generated_email := agent_email;
        END IF;
        
        INSERT INTO users (
            full_name,
            email,
            role
        ) VALUES (
            agent_name,
            generated_email,
            'agent'
        ) RETURNING id INTO agent_id;
    END IF;
    
    RETURN agent_id;
END;
$$;


-- Function: generate_reminder_notifications
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_reminder_notifications()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder_record RECORD;
  notification_id UUID;
BEGIN
  -- Generate follow-up reminders
  FOR reminder_record IN 
    SELECT 
      f.id as entity_id,
      f.agent_id as user_id,
      f.due_date,
      c.client_name,
      f.notes,
      np.reminder_minutes,
      np.delivery_methods,
      np.sound_type
    FROM public.follow_ups f
    JOIN public.leads l ON f.lead_id = l.id
    JOIN public.clients c ON l.client_id = c.id
    JOIN public.notification_preferences np ON f.agent_id = np.user_id AND np.notification_type = 'follow_up_reminder'
    WHERE f.status = 'Pending'
      AND np.enabled = TRUE
      AND f.due_date > NOW()
      AND f.due_date <= NOW() + INTERVAL '7 days'
  LOOP
    -- Create notifications for each reminder time
    FOR i IN 1..COALESCE(array_length(reminder_record.reminder_minutes, 1), 0) LOOP
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        scheduled_for,
        delivery_method,
        metadata
      )
      SELECT 
        reminder_record.user_id,
        'follow_up_reminder',
        'Follow-up Reminder',
        'Follow-up with ' || reminder_record.client_name || ' is due in ' || 
        CASE 
          WHEN reminder_record.reminder_minutes[i] < 60 THEN reminder_record.reminder_minutes[i] || ' minutes'
          WHEN reminder_record.reminder_minutes[i] < 1440 THEN (reminder_record.reminder_minutes[i] / 60) || ' hours'
          ELSE (reminder_record.reminder_minutes[i] / 1440) || ' days'
        END,
        'follow_up',
        reminder_record.entity_id,
        reminder_record.due_date - (reminder_record.reminder_minutes[i] || ' minutes')::INTERVAL,
        reminder_record.delivery_methods,
        jsonb_build_object(
          'sound_type', reminder_record.sound_type,
          'due_date', reminder_record.due_date,
          'client_name', reminder_record.client_name,
          'notes', COALESCE(reminder_record.notes, '')
        )
      WHERE NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = reminder_record.user_id 
          AND entity_id = reminder_record.entity_id 
          AND type = 'follow_up_reminder'
          AND scheduled_for = reminder_record.due_date - (reminder_record.reminder_minutes[i] || ' minutes')::INTERVAL
      );
    END LOOP;
  END LOOP;

  -- Generate meeting reminders
  FOR reminder_record IN 
    SELECT 
      m.id as entity_id,
      m.agent_id as user_id,
      m.start_time,
      m.title,
      m.location,
      c.client_name,
      np.reminder_minutes,
      np.delivery_methods,
      np.sound_type
    FROM public.meetings m
    LEFT JOIN public.leads l ON m.lead_id = l.id
    LEFT JOIN public.clients c ON l.client_id = c.id
    JOIN public.notification_preferences np ON m.agent_id = np.user_id AND np.notification_type = 'meeting_reminder'
    WHERE m.status != 'cancelled'
      AND np.enabled = TRUE
      AND m.start_time > NOW()
      AND m.start_time <= NOW() + INTERVAL '7 days'
  LOOP
    -- Create notifications for each reminder time
    FOR i IN 1..COALESCE(array_length(reminder_record.reminder_minutes, 1), 0) LOOP
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        scheduled_for,
        delivery_method,
        metadata
      )
      SELECT 
        reminder_record.user_id,
        'meeting_reminder',
        'Meeting Reminder',
        'Meeting "' || reminder_record.title || '"' || 
        CASE WHEN reminder_record.client_name IS NOT NULL THEN ' with ' || reminder_record.client_name ELSE '' END ||
        ' starts in ' || 
        CASE 
          WHEN reminder_record.reminder_minutes[i] < 60 THEN reminder_record.reminder_minutes[i] || ' minutes'
          WHEN reminder_record.reminder_minutes[i] < 1440 THEN (reminder_record.reminder_minutes[i] / 60) || ' hours'
          ELSE (reminder_record.reminder_minutes[i] / 1440) || ' days'
        END,
        'meeting',
        reminder_record.entity_id,
        reminder_record.start_time - (reminder_record.reminder_minutes[i] || ' minutes')::INTERVAL,
        reminder_record.delivery_methods,
        jsonb_build_object(
          'sound_type', reminder_record.sound_type,
          'start_time', reminder_record.start_time,
          'title', reminder_record.title,
          'location', COALESCE(reminder_record.location, ''),
          'client_name', COALESCE(reminder_record.client_name, '')
        )
      WHERE NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = reminder_record.user_id 
          AND entity_id = reminder_record.entity_id 
          AND type = 'meeting_reminder'
          AND scheduled_for = reminder_record.start_time - (reminder_record.reminder_minutes[i] || ' minutes')::INTERVAL
      );
    END LOOP;
  END LOOP;

  -- Generate overdue follow-up notifications
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    scheduled_for,
    delivery_method,
    metadata
  )
  SELECT 
    f.agent_id,
    'overdue_follow_up',
    'Overdue Follow-up',
    'Follow-up with ' || c.client_name || ' is overdue by ' || 
    EXTRACT(DAYS FROM NOW() - f.due_date)::INTEGER || ' days',
    'follow_up',
    f.id,
    NOW(),
    np.delivery_methods,
    jsonb_build_object(
      'sound_type', np.sound_type,
      'due_date', f.due_date,
      'client_name', c.client_name,
      'days_overdue', EXTRACT(DAYS FROM NOW() - f.due_date)::INTEGER,
      'notes', COALESCE(f.notes, '')
    )
  FROM public.follow_ups f
  JOIN public.leads l ON f.lead_id = l.id
  JOIN public.clients c ON l.client_id = c.id
  JOIN public.notification_preferences np ON f.agent_id = np.user_id AND np.notification_type = 'overdue_follow_up'
  WHERE f.status = 'Pending'
    AND f.due_date < NOW()
    AND np.enabled = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = f.agent_id 
        AND entity_id = f.id 
        AND type = 'overdue_follow_up'
        AND notification_date::DATE = NOW()::DATE
    );
END;
$$;


-- Function: upsert_follow_ups_bulk
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_follow_ups_bulk(follow_ups_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    follow_up_item JSONB;
BEGIN
    FOR follow_up_item IN SELECT * FROM jsonb_array_elements(follow_ups_data)
    LOOP
        INSERT INTO public.follow_ups (lead_id, agent_id, due_date, notes, status)
        VALUES (
            (follow_up_item->>'lead_id')::UUID,
            (follow_up_item->>'agent_id')::UUID,
            (follow_up_item->>'due_date')::TIMESTAMPTZ,
            follow_up_item->>'notes',
            follow_up_item->>'status'
        );
        -- Assuming these are new follow-ups and not updates on existing ones.
        -- If updates were possible, ON CONFLICT would be needed.
    END LOOP;
END;
$$;


-- Function: upsert_meetings_bulk
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_meetings_bulk(meetings_data JSONB)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    meeting_item JSONB;
BEGIN
    FOR meeting_item IN SELECT * FROM jsonb_array_elements(meetings_data)
    LOOP
        INSERT INTO public.meetings (lead_id, agent_id, title, start_time, end_time, location, notes)
        VALUES (
            (meeting_item->>'lead_id')::UUID,
            (meeting_item->>'agent_id')::UUID,
            meeting_item->>'title',
            (meeting_item->>'start_time')::TIMESTAMPTZ,
            (meeting_item->>'end_time')::TIMESTAMPTZ,
            meeting_item->>'location',
            meeting_item->>'notes'
        );
    END LOOP;
END;
$$;


-- Function: test_get_current_user_role_for_id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.test_get_current_user_role_for_id(user_id_to_check UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = user_id_to_check);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error in function: ' || SQLERRM;
END;
$$;


-- ============================================================================
-- PART 4: TRIGGERS
-- ============================================================================

-- Trigger: on_auth_user_created (auth.users)
-- ============================================================================
CREATE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user();


-- Triggers for clients table
-- ============================================================================
CREATE TRIGGER before_client_changes_validation 
    BEFORE INSERT OR UPDATE ON public.clients 
    FOR EACH ROW 
    EXECUTE FUNCTION validate_client_changes();

CREATE TRIGGER set_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_timestamp();


-- Triggers for leads table
-- ============================================================================
CREATE TRIGGER before_lead_engagement_changes_validation 
    BEFORE INSERT OR UPDATE ON public.leads 
    FOR EACH ROW 
    EXECUTE FUNCTION validate_lead_engagement_changes();

CREATE TRIGGER set_leads_updated_at 
    BEFORE UPDATE ON public.leads 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_timestamp();


-- Triggers for follow_ups table
-- ============================================================================
CREATE TRIGGER before_follow_up_changes_validation 
    BEFORE INSERT OR UPDATE ON public.follow_ups 
    FOR EACH ROW 
    EXECUTE FUNCTION validate_follow_up_changes();

CREATE TRIGGER set_follow_ups_updated_at 
    BEFORE UPDATE ON public.follow_ups 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_timestamp();


-- Triggers for meetings table
-- ============================================================================
CREATE TRIGGER before_meeting_changes_validation 
    BEFORE INSERT OR UPDATE ON public.meetings 
    FOR EACH ROW 
    EXECUTE FUNCTION validate_meeting_changes();

CREATE TRIGGER set_meetings_updated_at 
    BEFORE UPDATE ON public.meetings 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_set_timestamp();


-- Triggers for daily_reports table
-- ============================================================================
CREATE TRIGGER on_daily_reports_updated 
    BEFORE UPDATE ON public.daily_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_updated_at();


-- Triggers for notifications table
-- ============================================================================
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON public.notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- Triggers for notification_preferences table
-- ============================================================================
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON public.notification_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- Triggers for todos table
-- ============================================================================
CREATE TRIGGER set_todo_completed_at 
    BEFORE UPDATE ON public.todos 
    FOR EACH ROW 
    EXECUTE FUNCTION set_completed_at();

CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON public.todos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();


-- Triggers for users table
-- ============================================================================
CREATE TRIGGER before_user_update_validation 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION validate_user_update();


-- ============================================================================
-- PART 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_links ENABLE ROW LEVEL SECURITY;


-- RLS Policies for users table
-- ============================================================================
CREATE POLICY "Allow all select" 
    ON public.users 
    FOR SELECT 
    USING (TRUE);

CREATE POLICY "users_super_admin_all_access" 
    ON public.users 
    FOR ALL 
    TO authenticated 
    USING (get_current_user_role() = 'super_admin') 
    WITH CHECK (get_current_user_role() = 'super_admin');

CREATE POLICY "users_super_admin_insert" 
    ON public.users 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (get_current_user_role() = 'super_admin');

CREATE POLICY "users_allow_update_if_authorized" 
    ON public.users 
    FOR UPDATE 
    TO authenticated 
    USING (
        (get_current_user_role() = 'super_admin') OR 
        (id = auth.uid()) OR 
        ((get_current_user_role() = 'manager') AND (manager_id = auth.uid()))
    ) 
    WITH CHECK (TRUE);

CREATE POLICY "users_agent_select_own" 
    ON public.users 
    FOR SELECT 
    TO authenticated 
    USING ((get_current_user_role() = 'agent') AND (id = auth.uid()));

CREATE POLICY "users_manager_select_own_and_reports" 
    ON public.users 
    FOR SELECT 
    TO authenticated 
    USING ((get_current_user_role() = 'manager') AND ((id = auth.uid()) OR (manager_id = auth.uid())));


-- RLS Policies for clients table
-- ============================================================================
CREATE POLICY "authenticated_users_full_access_clients" 
    ON public.clients 
    FOR ALL 
    TO authenticated 
    USING (TRUE) 
    WITH CHECK (TRUE);


-- RLS Policies for leads table
-- ============================================================================
CREATE POLICY "leads_super_admin_all_access" 
    ON public.leads 
    FOR ALL 
    TO authenticated 
    USING (get_current_user_role() = 'super_admin') 
    WITH CHECK (get_current_user_role() = 'super_admin');

CREATE POLICY "leads_manager_access" 
    ON public.leads 
    FOR ALL 
    TO authenticated 
    USING (
        (get_current_user_role() = 'manager') AND 
        ((agent_id = auth.uid()) OR is_manager_of(auth.uid(), agent_id))
    ) 
    WITH CHECK (
        (get_current_user_role() = 'manager') AND 
        ((agent_id = auth.uid()) OR is_manager_of(auth.uid(), agent_id))
    );

CREATE POLICY "leads_agent_access_own" 
    ON public.leads 
    FOR ALL 
    TO authenticated 
    USING ((get_current_user_role() = 'agent') AND (agent_id = auth.uid())) 
    WITH CHECK ((get_current_user_role() = 'agent') AND (agent_id = auth.uid()));

CREATE POLICY "leads_insert_access" 
    ON public.leads 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        (
            (get_current_user_role() = 'agent') AND (agent_id = auth.uid())
        ) OR (
            (get_current_user_role() = 'manager') AND 
            ((agent_id = auth.uid()) OR is_manager_of(auth.uid(), agent_id))
        ) OR (
            get_current_user_role() = 'super_admin'
        )
    );


-- RLS Policies for follow_ups table
-- ============================================================================
CREATE POLICY "super_admin_full_access_follow_ups" 
    ON public.follow_ups 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
    ) 
    WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
    );

CREATE POLICY "manager_access_follow_ups" 
    ON public.follow_ups 
    FOR ALL 
    TO authenticated 
    USING (
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')) AND 
        ((agent_id = auth.uid()) OR is_manager_of(auth.uid(), agent_id))
    ) 
    WITH CHECK (
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')) AND 
        ((agent_id = auth.uid()) OR is_manager_of(auth.uid(), agent_id))
    );

CREATE POLICY "agent_access_follow_ups" 
    ON public.follow_ups 
    FOR ALL 
    TO authenticated 
    USING (
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'agent')) AND 
        (agent_id = auth.uid())
    ) 
    WITH CHECK (
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'agent')) AND 
        (agent_id = auth.uid())
    );


-- RLS Policies for meetings table
-- ============================================================================
CREATE POLICY "super_admin_full_access_meetings" 
    ON public.meetings 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
    ) 
    WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
    );

CREATE POLICY "manager_access_meetings" 
    ON public.meetings 
    FOR ALL 
    TO authenticated 
    USING (
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')) AND 
        ((agent_id = auth.uid()) OR is_manager_of(auth.uid(), agent_id))
    ) 
    WITH CHECK (
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')) AND 
        ((agent_id = auth.uid()) OR is_manager_of(auth.uid(), agent_id))
    );

CREATE POLICY "agent_access_meetings" 
    ON public.meetings 
    FOR ALL 
    TO authenticated 
    USING (
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'agent')) AND 
        (agent_id = auth.uid())
    ) 
    WITH CHECK (
        (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'agent')) AND 
        (agent_id = auth.uid())
    );


-- RLS Policies for admin_audit table
-- ============================================================================
CREATE POLICY "admin_audit_super_admin_access" 
    ON public.admin_audit 
    FOR ALL 
    TO authenticated 
    USING (get_current_user_role() = 'super_admin') 
    WITH CHECK (get_current_user_role() = 'super_admin');

CREATE POLICY "admin_audit_allow_authenticated_insert" 
    ON public.admin_audit 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (user_id = auth.uid());


-- RLS Policies for attendance table
-- ============================================================================
CREATE POLICY "Users can view their own attendance" 
    ON public.attendance 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance records" 
    ON public.attendance 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance records" 
    ON public.attendance 
    FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);


-- RLS Policies for daily_reports table
-- ============================================================================
CREATE POLICY "Super Admins have full access to reports" 
    ON public.daily_reports 
    FOR ALL 
    USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
    ) 
    WITH CHECK (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
    );

CREATE POLICY "Agents can manage their own reports" 
    ON public.daily_reports 
    FOR ALL 
    USING (auth.uid() = agent_id) 
    WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Managers can view their team's reports" 
    ON public.daily_reports 
    FOR SELECT 
    USING (
        (EXISTS (SELECT 1 FROM users u WHERE u.id = agent_id AND u.manager_id = auth.uid())) OR 
        (auth.uid() = agent_id)
    );


-- RLS Policies for notifications table
-- ============================================================================
CREATE POLICY "Users can view their own notifications" 
    ON public.notifications 
    FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notifications" 
    ON public.notifications 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications 
    FOR UPDATE 
    USING (user_id = auth.uid());


-- RLS Policies for notification_preferences table
-- ============================================================================
CREATE POLICY "Users can view their own notification preferences" 
    ON public.notification_preferences 
    FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences" 
    ON public.notification_preferences 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences" 
    ON public.notification_preferences 
    FOR UPDATE 
    USING (user_id = auth.uid());


-- RLS Policies for todos table
-- ============================================================================
CREATE POLICY "Agents can view own todos" 
    ON public.todos 
    FOR SELECT 
    USING (
        (user_id = auth.uid()) OR 
        (assigned_by = auth.uid()) OR 
        ((SELECT users.role FROM users WHERE users.id = auth.uid()) = ANY (ARRAY['manager', 'super_admin']))
    );

CREATE POLICY "Agents can insert own todos" 
    ON public.todos 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update todos" 
    ON public.todos 
    FOR UPDATE 
    USING (
        (user_id = auth.uid()) OR 
        ((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'super_admin') OR 
        (
            ((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'manager') AND 
            (user_id IN (SELECT users.id FROM users WHERE users.manager_id = auth.uid()))
        )
    );

CREATE POLICY "Users can delete todos" 
    ON public.todos 
    FOR DELETE 
    USING (
        (user_id = auth.uid()) OR 
        ((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'super_admin') OR 
        (
            ((SELECT users.role FROM users WHERE users.id = auth.uid()) = 'manager') AND 
            (user_id IN (SELECT users.id FROM users WHERE users.manager_id = auth.uid()))
        )
    );


-- RLS Policies for todo_comments table
-- ============================================================================
CREATE POLICY "Users can view todo comments" 
    ON public.todo_comments 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM todos 
            WHERE todos.id = todo_comments.todo_id AND (
                (todos.user_id = auth.uid()) OR 
                (todos.assigned_by = auth.uid()) OR 
                ((SELECT users.role FROM users WHERE users.id = auth.uid()) = ANY (ARRAY['manager', 'super_admin']))
            )
        )
    );

CREATE POLICY "Users can insert todo comments" 
    ON public.todo_comments 
    FOR INSERT 
    WITH CHECK (
        (user_id = auth.uid()) AND 
        EXISTS (
            SELECT 1 FROM todos 
            WHERE todos.id = todo_comments.todo_id AND (
                (todos.user_id = auth.uid()) OR 
                (todos.assigned_by = auth.uid()) OR 
                ((SELECT users.role FROM users WHERE users.id = auth.uid()) = ANY (ARRAY['manager', 'super_admin']))
            )
        )
    );


-- RLS Policies for todo_attachments table
-- ============================================================================
CREATE POLICY "Users can view todo attachments" 
    ON public.todo_attachments 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM todos 
            WHERE todos.id = todo_attachments.todo_id AND (
                (todos.user_id = auth.uid()) OR 
                (todos.assigned_by = auth.uid()) OR 
                ((SELECT users.role FROM users WHERE users.id = auth.uid()) = ANY (ARRAY['manager', 'super_admin']))
            )
        )
    );

CREATE POLICY "Users can insert todo attachments" 
    ON public.todo_attachments 
    FOR INSERT 
    WITH CHECK (
        (uploaded_by = auth.uid()) AND 
        EXISTS (
            SELECT 1 FROM todos 
            WHERE todos.id = todo_attachments.todo_id AND (
                (todos.user_id = auth.uid()) OR 
                (todos.assigned_by = auth.uid()) OR 
                ((SELECT users.role FROM users WHERE users.id = auth.uid()) = ANY (ARRAY['manager', 'super_admin']))
            )
        )
    );


-- RLS Policies for user_links table
-- ============================================================================
CREATE POLICY "Allow insert for anon" 
    ON public.user_links 
    FOR INSERT 
    TO anon 
    WITH CHECK (TRUE);


-- ============================================================================
-- PART 6: DEFAULT DATA
-- ============================================================================

-- Insert default pipeline stages
-- ============================================================================
INSERT INTO public.pipeline_stages (name, description, order_position, probability, color_code) VALUES
    ('New Lead', 'Initial contact made', 1, 10, '#6366f1'),
    ('Qualified', 'Lead meets BANT criteria', 2, 25, '#8b5cf6'),
    ('Demo Scheduled', 'Product demo scheduled', 3, 40, '#ec4899'),
    ('Proposal Sent', 'Proposal submitted to client', 4, 60, '#f59e0b'),
    ('Negotiation', 'Discussing terms and pricing', 5, 80, '#10b981'),
    ('Closed Won', 'Deal successfully closed', 6, 100, '#22c55e'),
    ('Closed Lost', 'Deal lost', 7, 0, '#ef4444')
ON CONFLICT (order_position) DO NOTHING;


-- ============================================================================
-- COMPLETE! YOUR DATABASE IS NOW CLONED
-- ============================================================================
-- Next Steps:
-- 1. Deploy Edge Functions using Supabase CLI or Dashboard
-- 2. Configure authentication providers in Supabase Dashboard
-- 3. Set up storage buckets if needed
-- 4. Update Clara Backend .env with the new database credentials
-- ============================================================================

