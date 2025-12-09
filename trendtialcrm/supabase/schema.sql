-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  target_entity text,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_audit_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  date date NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'CheckedOut'::attendance_status_enum,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.calls (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL,
  user_id uuid NOT NULL,
  duration integer NOT NULL,
  call_type text NOT NULL CHECK (call_type = ANY (ARRAY['inbound'::text, 'outbound'::text, 'callback'::text, 'voicemail'::text])),
  outcome text NOT NULL CHECK (outcome = ANY (ARRAY['completed'::text, 'no_answer'::text, 'busy'::text, 'failed'::text, 'voicemail'::text])),
  notes text,
  call_start_time timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT calls_pkey PRIMARY KEY (id),
  CONSTRAINT calls_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT calls_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_name text NOT NULL UNIQUE,
  company text,
  industry text,
  location text,
  phone text,
  physical_meeting_info text,
  expected_value numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  company_size integer,
  email text,
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.daily_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  manager_id uuid,
  report_date date NOT NULL,
  team_type USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  outreach_count integer,
  responses_count integer,
  comments_done integer,
  content_posted boolean,
  emails_sent integer,
  CONSTRAINT daily_reports_pkey PRIMARY KEY (id),
  CONSTRAINT daily_reports_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id),
  CONSTRAINT daily_reports_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id)
);
CREATE TABLE public.follow_ups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  due_date timestamp with time zone NOT NULL,
  status text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  CONSTRAINT follow_ups_pkey PRIMARY KEY (id),
  CONSTRAINT follow_ups_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id),
  CONSTRAINT follow_ups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT follow_ups_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id)
);
CREATE TABLE public.lead_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['email'::text, 'call'::text, 'meeting'::text, 'note'::text, 'status_change'::text, 'document'::text, 'task'::text, 'demo'::text])),
  subject text,
  description text,
  activity_date timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_automated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lead_activities_pkey PRIMARY KEY (id),
  CONSTRAINT lead_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.lead_nurture_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  sequence_id uuid NOT NULL,
  current_step integer DEFAULT 1,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text])),
  enrolled_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  next_action_date timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lead_nurture_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT lead_nurture_enrollments_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_nurture_enrollments_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.nurture_sequences(id),
  CONSTRAINT lead_nurture_enrollments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.lead_scoring_criteria (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['demographic'::text, 'behavioral'::text, 'engagement'::text, 'firmographic'::text])),
  condition_field text NOT NULL,
  condition_operator text NOT NULL CHECK (condition_operator = ANY (ARRAY['equals'::text, 'contains'::text, 'greater_than'::text, 'less_than'::text, 'in_range'::text])),
  condition_value text NOT NULL,
  score_points integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lead_scoring_criteria_pkey PRIMARY KEY (id)
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  agent_id uuid,
  status_bucket text NOT NULL CHECK (status_bucket = ANY (ARRAY['P1'::text, 'P2'::text, 'P3'::text])),
  progress_details text,
  next_step text,
  sync_lock boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  lead_source text,
  contact_person text,
  email text,
  phone text,
  deal_value numeric,
  tags ARRAY,
  follow_up_due_date timestamp with time zone,
  notes text,
  industry text,
  lead_score integer DEFAULT 0,
  qualification_status text DEFAULT 'unqualified'::text CHECK (qualification_status = ANY (ARRAY['unqualified'::text, 'marketing_qualified'::text, 'sales_qualified'::text, 'opportunity'::text])),
  campaign_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer_url text,
  first_touch_date timestamp with time zone,
  last_touch_date timestamp with time zone,
  pipeline_stage_id uuid,
  expected_close_date date,
  win_probability integer DEFAULT 0 CHECK (win_probability >= 0 AND win_probability <= 100),
  lost_reason text,
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id),
  CONSTRAINT leads_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT leads_pipeline_stage_id_fkey FOREIGN KEY (pipeline_stage_id) REFERENCES public.pipeline_stages(id)
);
CREATE TABLE public.meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid,
  agent_id uuid NOT NULL,
  title text NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  location text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  status text,
  CONSTRAINT meetings_pkey PRIMARY KEY (id),
  CONSTRAINT meetings_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id),
  CONSTRAINT meetings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT meetings_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id)
);
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type = ANY (ARRAY['follow_up_reminder'::text, 'meeting_reminder'::text, 'overdue_follow_up'::text, 'upcoming_meeting'::text, 'lead_update'::text, 'system_alert'::text])),
  enabled boolean DEFAULT true,
  reminder_minutes ARRAY DEFAULT ARRAY[15, 60, 1440],
  delivery_methods ARRAY DEFAULT ARRAY['in_app'::text, 'sound'::text],
  email_enabled boolean DEFAULT false,
  browser_push_enabled boolean DEFAULT true,
  sound_enabled boolean DEFAULT true,
  sound_type text DEFAULT 'info'::text CHECK (sound_type = ANY (ARRAY['success'::text, 'error'::text, 'info'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['follow_up_reminder'::text, 'meeting_reminder'::text, 'overdue_follow_up'::text, 'upcoming_meeting'::text, 'lead_update'::text, 'system_alert'::text])),
  title text NOT NULL,
  message text NOT NULL,
  entity_type text CHECK (entity_type = ANY (ARRAY['follow_up'::text, 'meeting'::text, 'lead'::text, 'system'::text])),
  entity_id uuid,
  is_read boolean DEFAULT false,
  notification_date timestamp with time zone NOT NULL DEFAULT now(),
  scheduled_for timestamp with time zone,
  delivery_method ARRAY DEFAULT ARRAY['in_app'::text],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.nurture_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_conditions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nurture_sequences_pkey PRIMARY KEY (id),
  CONSTRAINT nurture_sequences_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.nurture_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL,
  step_order integer NOT NULL,
  name text NOT NULL,
  delay_days integer DEFAULT 0,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY['email'::text, 'task'::text, 'call'::text, 'sms'::text, 'notification'::text])),
  content text,
  template_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nurture_steps_pkey PRIMARY KEY (id),
  CONSTRAINT nurture_steps_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.nurture_sequences(id)
);
CREATE TABLE public.pipeline_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  order_position integer NOT NULL UNIQUE,
  probability integer DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  is_active boolean DEFAULT true,
  color_code text DEFAULT '#6366f1'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pipeline_stages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.todo_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  todo_id uuid NOT NULL,
  filename text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT todo_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT todo_attachments_todo_id_fkey FOREIGN KEY (todo_id) REFERENCES public.todos(id),
  CONSTRAINT todo_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id)
);
CREATE TABLE public.todo_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  todo_id uuid NOT NULL,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT todo_comments_pkey PRIMARY KEY (id),
  CONSTRAINT todo_comments_todo_id_fkey FOREIGN KEY (todo_id) REFERENCES public.todos(id),
  CONSTRAINT todo_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.todos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status USER-DEFINED DEFAULT 'pending'::todo_status,
  priority USER-DEFINED DEFAULT 'medium'::todo_priority,
  due_date timestamp with time zone,
  category text,
  tags ARRAY DEFAULT '{}'::text[],
  order_position integer DEFAULT 0,
  assigned_by uuid,
  is_team_task boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT todos_pkey PRIMARY KEY (id),
  CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT todos_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
);
CREATE TABLE public.user_links (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  email text NOT NULL,
  instagram_link text,
  linkedin_link text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  instagram_handle text,
  CONSTRAINT user_links_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  full_name text,
  email text UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['agent'::text, 'manager'::text, 'super_admin'::text])),
  manager_id uuid,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT fk_auth_users FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id)
);