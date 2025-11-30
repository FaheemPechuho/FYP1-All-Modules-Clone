# Supabase Database Schema Documentation

> **Generated**: November 28, 2025  
> **Database**: TrendtialCRM - Supabase PostgreSQL Database  
> **Purpose**: Complete reference for database schema, functions, triggers, and relationships

---

## Table of Contents
1. [Database Overview](#database-overview)
2. [Tables Schema](#tables-schema)
3. [Database Functions](#database-functions)
4. [Triggers](#triggers)
5. [Foreign Key Relationships](#foreign-key-relationships)
6. [Edge Functions](#edge-functions)
7. [Security & RLS Policies](#security--rls-policies)

---

## Database Overview

### Statistics
- **Total Tables**: 24 (public schema)
- **Total Functions**: 18 (custom business logic)
- **Total Triggers**: 31 (validation & automation)
- **Total Foreign Keys**: 30 (relational integrity)
- **Edge Functions**: 2 (create-user, reset-user-password)

### Core Features
- ✅ Lead & Client Management
- ✅ User Role Management (Agent, Manager, Super Admin)
- ✅ Follow-up & Meeting Scheduling
- ✅ Call Tracking & Recording
- ✅ Automated Nurture Sequences
- ✅ Lead Scoring & Pipeline Management
- ✅ Notification System with Preferences
- ✅ Todo Management with Comments & Attachments
- ✅ Daily Performance Reports
- ✅ Attendance Tracking
- ✅ Admin Audit Logging

---

## Tables Schema

### 1. **users** (Core User Table)
**Purpose**: Stores app-specific user details and roles  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | References auth.users.id |
| full_name | text | NULLABLE | User's full name |
| email | text | UNIQUE, NULLABLE | User email address |
| role | text | NOT NULL, CHECK | Role: 'agent', 'manager', 'super_admin' |
| manager_id | uuid | FOREIGN KEY → users.id | Self-referencing for org hierarchy |

**Foreign Keys**:
- `fk_auth_users`: users.id → auth.users.id (CASCADE delete)
- `users_manager_id_fkey`: users.manager_id → users.id (SET NULL on delete)

---

### 2. **clients** (Client Information)
**Purpose**: Stores client information, potentially synced from Google Sheets  
**RLS Enabled**: ❌ No

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| client_name | text | UNIQUE, NOT NULL | Sync key for Google Sheets |
| company | text | NULLABLE | Company name |
| industry | text | NULLABLE | Industry category |
| location | text | NULLABLE | Physical location |
| phone | text | NULLABLE | Contact phone number |
| physical_meeting_info | text | NULLABLE | Meeting details |
| expected_value | numeric | NULLABLE | Expected deal value |
| company_size | integer | NULLABLE | Number of employees |
| email | text | NULLABLE | Contact email |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 3. **leads** (Lead Engagements)
**Purpose**: Represents engagement or deal with a client, managed by an agent  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| client_id | uuid | FOREIGN KEY → clients.id | Associated client |
| agent_id | uuid | FOREIGN KEY → users.id | Assigned agent |
| status_bucket | text | CHECK: P1/P2/P3 | Priority level |
| progress_details | text | NULLABLE | Current progress notes |
| next_step | text | NULLABLE | Next action to take |
| sync_lock | boolean | DEFAULT false | Prevents sync conflicts |
| lead_source | text | NULLABLE | Origin of lead |
| contact_person | text | NULLABLE | Primary contact name |
| email | text | NULLABLE | Contact email |
| phone | text | NULLABLE | Contact phone |
| deal_value | numeric | NULLABLE | Potential deal value |
| tags | text[] | NULLABLE | Categorization tags |
| follow_up_due_date | timestamptz | NULLABLE | Next follow-up date |
| notes | text | NULLABLE | General notes |
| industry | text | NULLABLE | Industry category |
| lead_score | integer | DEFAULT 0 | Automated scoring |
| qualification_status | text | DEFAULT 'unqualified' | Status: unqualified/marketing_qualified/sales_qualified/opportunity |
| campaign_id | text | NULLABLE | Marketing campaign ID |
| utm_source | text | NULLABLE | UTM tracking source |
| utm_medium | text | NULLABLE | UTM tracking medium |
| utm_campaign | text | NULLABLE | UTM tracking campaign |
| referrer_url | text | NULLABLE | Referrer URL |
| first_touch_date | timestamptz | NULLABLE | First interaction date |
| last_touch_date | timestamptz | NULLABLE | Last interaction date |
| pipeline_stage_id | uuid | FOREIGN KEY → pipeline_stages.id | Current pipeline stage |
| expected_close_date | date | NULLABLE | Expected deal close date |
| win_probability | integer | DEFAULT 0, CHECK: 0-100 | Probability of winning |
| lost_reason | text | NULLABLE | Reason if lost |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 4. **follow_ups** (Follow-up Activities)
**Purpose**: Tracks follow-up activities for leads  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| lead_id | uuid | FOREIGN KEY → leads.id | Associated lead |
| agent_id | uuid | FOREIGN KEY → users.id | Assigned agent |
| due_date | timestamptz | NOT NULL | When follow-up is due |
| status | text | NOT NULL | Current status |
| notes | text | NULLABLE | Follow-up notes |
| created_by | uuid | FOREIGN KEY → users.id | Creator user |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

**Delete Rules**:
- CASCADE when lead is deleted
- SET NULL when agent is deleted

---

### 5. **meetings** (Meeting Scheduler)
**Purpose**: Stores details of meetings scheduled with leads  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| lead_id | uuid | FOREIGN KEY → leads.id | Associated lead (optional) |
| agent_id | uuid | FOREIGN KEY → users.id | Meeting organizer |
| title | text | NOT NULL | Meeting title |
| start_time | timestamptz | NOT NULL | Meeting start time |
| end_time | timestamptz | NOT NULL | Meeting end time |
| location | text | NULLABLE | Meeting location |
| notes | text | NULLABLE | Meeting notes |
| status | text | NULLABLE | Meeting status |
| created_by | uuid | FOREIGN KEY → users.id | Creator user |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 6. **calls** (Call Tracking)
**Purpose**: Tracks all calls made to/from leads  
**RLS Enabled**: ❌ No

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| lead_id | uuid | FOREIGN KEY → leads.id | Associated lead |
| user_id | uuid | FOREIGN KEY → auth.users.id | User who made call |
| duration | integer | NOT NULL | Call duration in seconds |
| call_type | text | CHECK | Type: inbound/outbound/callback/voicemail |
| outcome | text | CHECK | Outcome: completed/no_answer/busy/failed/voicemail |
| notes | text | NULLABLE | Call notes |
| call_start_time | timestamptz | NOT NULL | When call started |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 7. **daily_reports** (Performance Reports)
**Purpose**: Stores daily performance reports submitted by agents  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| agent_id | uuid | FOREIGN KEY → users.id | Reporting agent |
| manager_id | uuid | FOREIGN KEY → users.id | Agent's manager |
| report_date | date | NOT NULL | Date of report |
| team_type | enum | NOT NULL | Type: telesales/linkedin/cold_email |
| outreach_count | integer | NULLABLE | Number of outreach attempts |
| responses_count | integer | NULLABLE | Number of responses |
| comments_done | integer | NULLABLE | Comments made (LinkedIn) |
| content_posted | boolean | NULLABLE | Content posted flag |
| emails_sent | integer | NULLABLE | Emails sent (cold email) |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 8. **attendance** (Attendance Tracking)
**Purpose**: Stores daily attendance records for users  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| user_id | uuid | FOREIGN KEY → users.id | User record |
| check_in_time | timestamptz | NULLABLE | Check-in timestamp |
| check_out_time | timestamptz | NULLABLE | Check-out timestamp |
| date | date | NOT NULL | Attendance date |
| status | enum | DEFAULT 'CheckedOut' | Status: CheckedOut/CheckedIn/OnLeave |
| notes | text | NULLABLE | Attendance notes |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 9. **admin_audit** (Audit Logging)
**Purpose**: Logs administrative actions within the system  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| user_id | uuid | FOREIGN KEY → users.id | User who performed action |
| action | text | NOT NULL | Action performed |
| target_entity | text | NULLABLE | Entity type affected |
| target_id | uuid | NULLABLE | Entity ID affected |
| details | jsonb | NULLABLE | Additional details |
| created_at | timestamptz | DEFAULT now() | When action occurred |

---

### 10. **notifications** (Notification System)
**Purpose**: User notifications for reminders and alerts  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| user_id | uuid | FOREIGN KEY → users.id | Target user |
| type | text | CHECK | Type: follow_up_reminder/meeting_reminder/overdue_follow_up/upcoming_meeting/lead_update/system_alert |
| title | text | NOT NULL | Notification title |
| message | text | NOT NULL | Notification message |
| entity_type | text | CHECK | Entity: follow_up/meeting/lead/system |
| entity_id | uuid | NULLABLE | Related entity ID |
| is_read | boolean | DEFAULT false | Read status |
| notification_date | timestamptz | DEFAULT now() | When notification created |
| scheduled_for | timestamptz | NULLABLE | When to deliver |
| delivery_method | text[] | DEFAULT ['in_app'] | Delivery methods |
| metadata | jsonb | DEFAULT '{}' | Additional metadata |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 11. **notification_preferences** (User Notification Settings)
**Purpose**: User preferences for notifications  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| user_id | uuid | FOREIGN KEY → users.id | User preferences |
| notification_type | text | CHECK | Same types as notifications |
| enabled | boolean | DEFAULT true | Enable/disable type |
| reminder_minutes | integer[] | DEFAULT [15,60,1440] | Reminder times (minutes before) |
| delivery_methods | text[] | DEFAULT ['in_app','sound'] | Delivery methods |
| email_enabled | boolean | DEFAULT false | Email delivery |
| browser_push_enabled | boolean | DEFAULT true | Browser push |
| sound_enabled | boolean | DEFAULT true | Sound alert |
| sound_type | text | DEFAULT 'info' | Sound: success/error/info |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 12. **todos** (Task Management)
**Purpose**: Task management system for users  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| user_id | uuid | FOREIGN KEY → users.id | Assigned user |
| title | text | NOT NULL | Task title |
| description | text | NULLABLE | Task description |
| status | enum | DEFAULT 'pending' | Status: pending/in_progress/completed/cancelled |
| priority | enum | DEFAULT 'medium' | Priority: low/medium/high/urgent |
| due_date | timestamptz | NULLABLE | Due date |
| category | text | NULLABLE | Task category |
| tags | text[] | DEFAULT '{}' | Task tags |
| order_position | integer | DEFAULT 0 | Display order |
| assigned_by | uuid | FOREIGN KEY → users.id | Who assigned task |
| is_team_task | boolean | DEFAULT false | Team task flag |
| completed_at | timestamptz | NULLABLE | When completed |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 13. **todo_comments** (Todo Comments)
**Purpose**: Comments on todo items  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| todo_id | uuid | FOREIGN KEY → todos.id | Related todo |
| user_id | uuid | FOREIGN KEY → users.id | Comment author |
| comment | text | NOT NULL | Comment text |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

---

### 14. **todo_attachments** (Todo Attachments)
**Purpose**: File attachments for todos  
**RLS Enabled**: ✅ Yes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| todo_id | uuid | FOREIGN KEY → todos.id | Related todo |
| filename | text | NOT NULL | File name |
| file_url | text | NOT NULL | Storage URL |
| file_size | integer | NULLABLE | File size in bytes |
| uploaded_by | uuid | FOREIGN KEY → users.id | Uploader |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

---

### 15. **pipeline_stages** (Sales Pipeline)
**Purpose**: Configurable sales pipeline stages with probability  
**RLS Enabled**: ❌ No

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| name | text | NOT NULL | Stage name |
| description | text | NULLABLE | Stage description |
| order_position | integer | UNIQUE, NOT NULL | Display order |
| probability | integer | DEFAULT 0, CHECK: 0-100 | Win probability % |
| is_active | boolean | DEFAULT true | Active status |
| color_code | text | DEFAULT '#6366f1' | Display color |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 16. **nurture_sequences** (Automation Sequences)
**Purpose**: Automated email/task sequences for lead nurturing  
**RLS Enabled**: ❌ No

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| name | text | NOT NULL | Sequence name |
| description | text | NULLABLE | Sequence description |
| trigger_conditions | jsonb | DEFAULT '{}' | When to trigger |
| is_active | boolean | DEFAULT true | Active status |
| created_by | uuid | FOREIGN KEY → users.id | Creator |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 17. **nurture_steps** (Sequence Steps)
**Purpose**: Individual steps in nurturing sequences  
**RLS Enabled**: ❌ No

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| sequence_id | uuid | FOREIGN KEY → nurture_sequences.id | Parent sequence |
| step_order | integer | NOT NULL | Order in sequence |
| name | text | NOT NULL | Step name |
| delay_days | integer | DEFAULT 0 | Days to wait |
| action_type | text | CHECK | Type: email/task/call/sms/notification |
| content | text | NULLABLE | Step content |
| template_data | jsonb | DEFAULT '{}' | Template variables |
| is_active | boolean | DEFAULT true | Active status |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 18. **lead_nurture_enrollments** (Enrollment Tracking)
**Purpose**: Tracks which leads are enrolled in which sequences  
**RLS Enabled**: ❌ No

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| lead_id | uuid | FOREIGN KEY → leads.id | Enrolled lead |
| sequence_id | uuid | FOREIGN KEY → nurture_sequences.id | Active sequence |
| current_step | integer | DEFAULT 1 | Current step number |
| status | text | DEFAULT 'active' | Status: active/paused/completed/cancelled |
| enrolled_at | timestamptz | DEFAULT now() | When enrolled |
| completed_at | timestamptz | NULLABLE | When completed |
| next_action_date | timestamptz | NULLABLE | Next action date |
| created_by | uuid | FOREIGN KEY → users.id | Who enrolled |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 19. **lead_scoring_criteria** (Lead Scoring Rules)
**Purpose**: Rules for automatic lead scoring based on various criteria  
**RLS Enabled**: ❌ No

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| name | text | NOT NULL | Criteria name |
| category | text | CHECK | Category: demographic/behavioral/engagement/firmographic |
| condition_field | text | NOT NULL | Field to evaluate |
| condition_operator | text | CHECK | Operator: equals/contains/greater_than/less_than/in_range |
| condition_value | text | NOT NULL | Value to compare |
| score_points | integer | NOT NULL | Points to award |
| is_active | boolean | DEFAULT true | Active status |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 20. **lead_activities** (Activity Timeline)
**Purpose**: Timeline of all interactions and activities for leads  
**RLS Enabled**: ❌ No

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated |
| lead_id | uuid | FOREIGN KEY → leads.id | Associated lead |
| activity_type | text | CHECK | Type: email/call/meeting/note/status_change/document/task/demo |
| subject | text | NULLABLE | Activity subject |
| description | text | NULLABLE | Activity description |
| activity_date | timestamptz | DEFAULT now() | When activity occurred |
| created_by | uuid | FOREIGN KEY → users.id | Who logged activity |
| metadata | jsonb | DEFAULT '{}' | Additional metadata |
| is_automated | boolean | DEFAULT false | Automated flag |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

---

### 21. **user_links** (Social Media Links)
**Purpose**: Stores social media links for users  
**RLS Enabled**: ❌ No

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, IDENTITY | Auto-generated |
| email | text | NOT NULL | User email |
| instagram_link | text | NULLABLE | Instagram profile URL |
| linkedin_link | text | NULLABLE | LinkedIn profile URL |
| instagram_handle | text | NULLABLE | Instagram handle |
| created_at | timestamptz | DEFAULT now() | Creation timestamp |

---

## Database Functions

### Data Import & Management

#### 1. `bulk_import_leads(leads_data jsonb) RETURNS jsonb`
**Purpose**: Bulk import leads with automatic client creation/update  
**Security**: SECURITY DEFINER  
**Returns**: Object with imported_successfully, failed_to_import, and errors array

**Logic**:
- Validates client_name and status_bucket (required)
- Finds or creates clients based on client_name
- Optionally assigns agents by name
- Creates lead records
- Logs imports in admin_audit
- Returns success/failure counts with detailed errors

**Usage**:
```sql
SELECT bulk_import_leads('[
  {
    "client_name": "Acme Corp",
    "company": "Acme Corporation",
    "status_bucket": "P1",
    "agent_name": "John Doe"
  }
]'::jsonb);
```

---

#### 2. `import_leads_bulk(leads_data jsonb) RETURNS jsonb`
**Purpose**: Alternative bulk import with more flexible field mapping  
**Security**: SECURITY DEFINER  
**Returns**: Object with success_count, error_count, and errors array

**Features**:
- Creates clients if not found
- Maps various field names (clientName, companyName, etc.)
- Handles deal_value and company_size conversion
- Tags parsing from comma-separated strings

---

#### 3. `clean_import_data(raw_data jsonb) RETURNS jsonb`
**Purpose**: Cleans and normalizes import data  
**Security**: SECURITY DEFINER

**Cleaning Operations**:
- Phone: removes non-digits except '+'
- Deal Value: removes currency symbols and commas
- Email: lowercase and trim
- Converts NULL strings to actual nulls

---

#### 4. `create_agent_if_not_exists(agent_name text, agent_email text) RETURNS uuid`
**Purpose**: Creates agent user if not exists  
**Security**: SECURITY DEFINER  
**Returns**: Agent user ID

**Logic**:
- Searches for existing agent by name (case-insensitive)
- Generates email if not provided (firstname.lastname@company.com)
- Creates user with 'agent' role
- Returns agent ID

---

#### 5. `upsert_follow_ups_bulk(follow_ups_data jsonb) RETURNS void`
**Purpose**: Bulk insert follow-ups  
**Usage**: For batch operations from external systems

---

#### 6. `upsert_meetings_bulk(meetings_data jsonb) RETURNS void`
**Purpose**: Bulk insert meetings  
**Usage**: For batch operations from external systems

---

### Notification Management

#### 7. `generate_reminder_notifications() RETURNS void`
**Purpose**: Generates automated reminder notifications  
**Security**: SECURITY DEFINER  
**Should be run**: Via cron job (e.g., every 15 minutes)

**Generates**:
1. **Follow-up Reminders**: For pending follow-ups due within 7 days
2. **Meeting Reminders**: For upcoming meetings within 7 days
3. **Overdue Follow-up Alerts**: For past-due follow-ups

**Logic**:
- Respects user notification preferences
- Creates multiple reminders based on reminder_minutes array
- Includes sound_type and delivery_methods from preferences
- Prevents duplicate notifications
- Builds rich metadata for each notification type

---

### Validation Functions (Trigger Functions)

#### 8. `validate_client_changes() RETURNS trigger`
**Purpose**: Validates client table modifications  
**Security**: SECURITY DEFINER  
**When**: BEFORE INSERT OR UPDATE on clients

**Validations**:
- Super admins and service_role bypass all checks
- Client name cannot be empty
- Additional business rules as needed

---

#### 9. `validate_lead_engagement_changes() RETURNS trigger`
**Purpose**: Validates lead table modifications  
**Security**: SECURITY DEFINER  
**When**: BEFORE INSERT OR UPDATE on leads

**Validations**:
- Valid client_id must exist
- Valid agent_id must exist (if provided)
- status_bucket must be P1, P2, or P3
- **INSERT**: Agents can only create leads for themselves
- **INSERT**: Managers can assign to self or direct reports
- **UPDATE**: Agents cannot reassign leads or change client
- **UPDATE**: Managers can only assign to self or reports

---

#### 10. `validate_follow_up_changes() RETURNS trigger`
**Purpose**: Validates follow-up modifications  
**Security**: SECURITY DEFINER  
**When**: BEFORE INSERT OR UPDATE on follow_ups

**Validations**:
- agent_id is required and must be valid
- Lead must exist
- **INSERT (Agent)**: Can only create for self and own leads
- **INSERT (Manager)**: Can assign to self or reports, access related leads
- **UPDATE (Agent)**: Cannot reassign follow-ups or change lead
- **UPDATE (Manager)**: Can reassign to self or reports

---

#### 11. `validate_meeting_changes() RETURNS trigger`
**Purpose**: Validates meeting modifications  
**Security**: SECURITY DEFINER  
**When**: BEFORE INSERT OR UPDATE on meetings

**Validations**:
- agent_id is required and must be valid
- Lead must exist (if lead_id provided)
- **INSERT (Agent)**: Can only create for self and own leads
- **INSERT (Manager)**: Can assign to self or reports
- **UPDATE (Agent)**: Cannot reassign meetings
- **UPDATE (Manager)**: Can reassign to self or reports

---

#### 12. `validate_user_update() RETURNS trigger`
**Purpose**: Validates user profile updates  
**Security**: SECURITY DEFINER  
**When**: BEFORE UPDATE on users

**Validations**:
- Cannot change user ID
- Users cannot change own email (use auth settings)
- **Agents**: Cannot change own role or manager
- **Managers**: Cannot promote self to super_admin
- **Managers**: Cannot change own manager
- **Managers**: Cannot promote reports to manager/super_admin
- **Managers**: Can only assign reports to self or unassign

---

### Utility Functions

#### 13. `get_current_user_role() RETURNS text`
**Purpose**: Returns current authenticated user's role  
**Security**: SECURITY DEFINER  
**Returns**: 'agent', 'manager', 'super_admin', or NULL

---

#### 14. `is_manager_of(manager_user_id uuid, agent_user_id uuid) RETURNS boolean`
**Purpose**: Checks if user is manager of another user  
**Security**: SECURITY DEFINER  
**Returns**: true if manager_user_id is the manager of agent_user_id

---

#### 15. `handle_new_user() RETURNS trigger`
**Purpose**: Creates public.users entry when auth.users is created  
**Security**: SECURITY DEFINER  
**When**: AFTER INSERT on auth.users  
**Default Role**: 'agent'

---

#### 16. `handle_updated_at() RETURNS trigger`
**Purpose**: Updates updated_at timestamp  
**When**: BEFORE UPDATE on various tables

---

#### 17. `set_completed_at() RETURNS trigger`
**Purpose**: Sets/clears completed_at timestamp on todos  
**When**: BEFORE UPDATE on todos  
**Logic**: Sets timestamp when status changes to 'completed', clears otherwise

---

#### 18. `trigger_set_timestamp() RETURNS trigger`
**Purpose**: Generic timestamp update trigger  
**When**: BEFORE UPDATE on various tables

---

## Triggers

### Validation Triggers (BEFORE)

| Trigger Name | Table | Events | Function | Purpose |
|-------------|-------|---------|----------|---------|
| before_client_changes_validation | clients | INSERT, UPDATE | validate_client_changes() | Validates client data |
| before_lead_engagement_changes_validation | leads | INSERT, UPDATE | validate_lead_engagement_changes() | Validates lead data & permissions |
| before_follow_up_changes_validation | follow_ups | INSERT, UPDATE | validate_follow_up_changes() | Validates follow-up permissions |
| before_meeting_changes_validation | meetings | INSERT, UPDATE | validate_meeting_changes() | Validates meeting permissions |
| before_user_update_validation | users | UPDATE | validate_user_update() | Validates user profile changes |

### Timestamp Triggers (BEFORE UPDATE)

| Trigger Name | Table | Function | Purpose |
|-------------|-------|----------|---------|
| set_clients_updated_at | clients | trigger_set_timestamp() | Updates updated_at |
| set_leads_updated_at | leads | trigger_set_timestamp() | Updates updated_at |
| set_follow_ups_updated_at | follow_ups | trigger_set_timestamp() | Updates updated_at |
| set_meetings_updated_at | meetings | trigger_set_timestamp() | Updates updated_at |
| update_notifications_updated_at | notifications | update_updated_at_column() | Updates updated_at |
| update_notification_preferences_updated_at | notification_preferences | update_updated_at_column() | Updates updated_at |
| update_todos_updated_at | todos | update_updated_at_column() | Updates updated_at |
| on_daily_reports_updated | daily_reports | handle_updated_at() | Updates updated_at |

### Special Triggers

| Trigger Name | Table | Event | Function | Purpose |
|-------------|-------|-------|----------|---------|
| on_auth_user_created | auth.users | AFTER INSERT | handle_new_user() | Creates public.users entry |
| set_todo_completed_at | todos | BEFORE UPDATE | set_completed_at() | Sets completion timestamp |
| key_encrypt_secret_trigger_raw_key | pgsodium.key | BEFORE INSERT/UPDATE | pgsodium.key_encrypt_secret_raw_key() | Encrypts sensitive keys |

### Storage Triggers (Automatic)

Multiple triggers on storage.objects and storage.prefixes for prefix hierarchy management and cleanup.

---

## Foreign Key Relationships

### Visual Relationship Map

```
auth.users (Supabase Auth)
    ↓
public.users (id references auth.users.id)
    ├─→ users.manager_id → users.id (self-referencing)
    ├─→ leads.agent_id
    ├─→ follow_ups.agent_id
    ├─→ follow_ups.created_by
    ├─→ meetings.agent_id
    ├─→ meetings.created_by
    ├─→ daily_reports.agent_id
    ├─→ daily_reports.manager_id
    ├─→ attendance.user_id
    ├─→ admin_audit.user_id
    ├─→ todos.user_id
    ├─→ todos.assigned_by
    ├─→ todo_comments.user_id
    ├─→ todo_attachments.uploaded_by
    ├─→ notifications.user_id
    ├─→ notification_preferences.user_id
    ├─→ lead_activities.created_by
    ├─→ lead_nurture_enrollments.created_by
    └─→ nurture_sequences.created_by

clients
    └─→ leads.client_id

leads
    ├─→ follow_ups.lead_id (CASCADE)
    ├─→ meetings.lead_id (SET NULL)
    ├─→ calls.lead_id (CASCADE)
    ├─→ lead_activities.lead_id (CASCADE)
    └─→ lead_nurture_enrollments.lead_id (CASCADE)

pipeline_stages
    └─→ leads.pipeline_stage_id

nurture_sequences
    ├─→ nurture_steps.sequence_id (CASCADE)
    └─→ lead_nurture_enrollments.sequence_id (CASCADE)

todos
    ├─→ todo_comments.todo_id (CASCADE)
    └─→ todo_attachments.todo_id (CASCADE)
```

### Detailed Foreign Key Constraints

#### User-Centric Relations
| Source Table | Source Column | Target Table | Target Column | On Delete | On Update |
|-------------|---------------|--------------|---------------|-----------|-----------|
| users | id | auth.users | id | CASCADE | NO ACTION |
| users | manager_id | users | id | SET NULL | NO ACTION |
| leads | agent_id | users | id | SET NULL | NO ACTION |
| follow_ups | agent_id | users | id | SET NULL | NO ACTION |
| follow_ups | created_by | users | id | NO ACTION | NO ACTION |
| meetings | agent_id | users | id | SET NULL | NO ACTION |
| meetings | created_by | users | id | NO ACTION | NO ACTION |
| daily_reports | agent_id | users | id | CASCADE | NO ACTION |
| daily_reports | manager_id | users | id | SET NULL | NO ACTION |
| attendance | user_id | users | id | CASCADE | NO ACTION |
| admin_audit | user_id | users | id | SET NULL | NO ACTION |
| todos | user_id | users | id | CASCADE | NO ACTION |
| todos | assigned_by | users | id | SET NULL | NO ACTION |
| todo_comments | user_id | users | id | CASCADE | NO ACTION |
| todo_attachments | uploaded_by | users | id | CASCADE | NO ACTION |
| notifications | user_id | users | id | CASCADE | NO ACTION |
| notification_preferences | user_id | users | id | CASCADE | NO ACTION |

#### Lead Management Relations
| Source Table | Source Column | Target Table | Target Column | On Delete | On Update |
|-------------|---------------|--------------|---------------|-----------|-----------|
| leads | client_id | clients | id | CASCADE | NO ACTION |
| leads | pipeline_stage_id | pipeline_stages | id | NO ACTION | NO ACTION |
| follow_ups | lead_id | leads | id | CASCADE | NO ACTION |
| meetings | lead_id | leads | id | SET NULL | NO ACTION |
| calls | lead_id | leads | id | CASCADE | NO ACTION |
| lead_activities | lead_id | leads | id | CASCADE | NO ACTION |
| lead_nurture_enrollments | lead_id | leads | id | CASCADE | NO ACTION |

#### Nurture System Relations
| Source Table | Source Column | Target Table | Target Column | On Delete | On Update |
|-------------|---------------|--------------|---------------|-----------|-----------|
| nurture_steps | sequence_id | nurture_sequences | id | CASCADE | NO ACTION |
| lead_nurture_enrollments | sequence_id | nurture_sequences | id | CASCADE | NO ACTION |
| nurture_sequences | created_by | users | id | NO ACTION | NO ACTION |

#### Todo System Relations
| Source Table | Source Column | Target Table | Target Column | On Delete | On Update |
|-------------|---------------|--------------|---------------|-----------|-----------|
| todo_comments | todo_id | todos | id | CASCADE | NO ACTION |
| todo_attachments | todo_id | todos | id | CASCADE | NO ACTION |

---

## Edge Functions

### 1. create-user
**Status**: ACTIVE  
**Version**: 2  
**JWT Verification**: ✅ Enabled (requires authentication)  
**Path**: `supabase/functions/create-user/index.ts`

**Purpose**: Creates new users in the system  
**Use Case**: Admin/Manager creating new team members

---

### 2. reset-user-password
**Status**: ACTIVE  
**Version**: 1  
**JWT Verification**: ❌ Disabled (public endpoint)  
**Path**: `supabase/functions/reset-user-password/index.ts`

**Purpose**: Handles password reset requests  
**Use Case**: User forgot password flow

---

## Security & RLS Policies

### Row Level Security (RLS) Status

| Table | RLS Enabled | Purpose |
|-------|-------------|---------|
| users | ✅ Yes | Protects user data |
| clients | ❌ No | Shared across organization |
| leads | ✅ Yes | Agent/manager access control |
| follow_ups | ✅ Yes | Agent/manager access control |
| meetings | ✅ Yes | Agent/manager access control |
| daily_reports | ✅ Yes | Personal performance data |
| attendance | ✅ Yes | Personal attendance records |
| admin_audit | ✅ Yes | Admin access only |
| notifications | ✅ Yes | Personal notifications |
| notification_preferences | ✅ Yes | Personal preferences |
| todos | ✅ Yes | Personal task management |
| todo_comments | ✅ Yes | Task collaboration |
| todo_attachments | ✅ Yes | Task file access |
| calls | ❌ No | Shared call history |
| lead_activities | ❌ No | Shared activity timeline |
| pipeline_stages | ❌ No | Shared configuration |
| nurture_sequences | ❌ No | Shared automation |
| nurture_steps | ❌ No | Shared automation |
| lead_nurture_enrollments | ❌ No | Shared enrollment tracking |
| lead_scoring_criteria | ❌ No | Shared scoring rules |

### Role Hierarchy

```
super_admin (Full Access)
    ↓
manager (Team Access)
    ↓
agent (Own Data Access)
```

### Permission Model

#### Super Admin
- ✅ Full access to all data
- ✅ Can create/edit/delete any record
- ✅ Can change user roles
- ✅ Bypasses all validation rules

#### Manager
- ✅ Access to own data
- ✅ Access to direct reports' data
- ✅ Can assign leads to self or reports
- ✅ Can create/edit follow-ups for self or reports
- ✅ Can view team performance reports
- ❌ Cannot promote users to manager/super_admin
- ❌ Cannot change own manager

#### Agent
- ✅ Access to own data only
- ✅ Can create leads assigned to self
- ✅ Can manage own follow-ups and meetings
- ✅ Can submit daily reports
- ❌ Cannot reassign leads
- ❌ Cannot change own role or manager
- ❌ Cannot access other agents' data

---

## Database Maintenance

### Recommended Indexes
```sql
-- Already exists: Primary keys, Foreign keys, Unique constraints

-- Additional recommended indexes for performance:
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_bucket ON leads(status_bucket);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_todos_user_id_status ON todos(user_id, status);
```

### Scheduled Jobs (Cron)

#### 1. Notification Generation
**Frequency**: Every 15 minutes  
**Function**: `generate_reminder_notifications()`  
**Purpose**: Creates reminder notifications for upcoming events

```sql
-- Example cron job setup (pg_cron extension)
SELECT cron.schedule(
  'generate-reminders',
  '*/15 * * * *',
  $$SELECT generate_reminder_notifications()$$
);
```

### Backup Strategy
- **Supabase Automatic Backups**: Daily backups (managed by Supabase)
- **Point-in-Time Recovery**: Available for Pro plan
- **Manual Exports**: Regular exports via `pg_dump` for critical data

---

## Migration History

### Applied Migrations
- `20230622000000_create_calls_table.sql` - Created calls tracking table

### Migration Best Practices
1. Always use timestamped migration files
2. Include rollback SQL in comments
3. Test migrations on staging first
4. Never hardcode IDs in migrations
5. Use `IF NOT EXISTS` for idempotency

---

## API Endpoints (Auto-generated by PostgREST)

### Base URL
```
https://[project-ref].supabase.co/rest/v1/
```

### Available Endpoints
- `GET/POST/PATCH/DELETE /users`
- `GET/POST/PATCH/DELETE /clients`
- `GET/POST/PATCH/DELETE /leads`
- `GET/POST/PATCH/DELETE /follow_ups`
- `GET/POST/PATCH/DELETE /meetings`
- `GET/POST/PATCH/DELETE /daily_reports`
- `GET/POST/PATCH/DELETE /attendance`
- `GET/POST/PATCH/DELETE /todos`
- `GET /notifications`
- ... (all other tables)

### RPC Endpoints
- `POST /rpc/bulk_import_leads`
- `POST /rpc/generate_reminder_notifications`
- `GET /rpc/get_current_user_role`
- `GET /rpc/is_manager_of`

---

## Common Query Patterns

### Get User's Leads
```sql
SELECT l.*, c.client_name, c.company
FROM leads l
JOIN clients c ON l.client_id = c.id
WHERE l.agent_id = auth.uid()
ORDER BY l.updated_at DESC;
```

### Get Pending Follow-ups
```sql
SELECT f.*, l.*, c.client_name
FROM follow_ups f
JOIN leads l ON f.lead_id = l.id
JOIN clients c ON l.client_id = c.id
WHERE f.agent_id = auth.uid()
  AND f.status = 'Pending'
  AND f.due_date <= NOW() + INTERVAL '7 days'
ORDER BY f.due_date ASC;
```

### Get Manager's Team Performance
```sql
SELECT 
  u.full_name,
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l.status_bucket = 'P1' THEN 1 END) as p1_leads,
  COUNT(dr.id) as reports_submitted
FROM users u
LEFT JOIN leads l ON l.agent_id = u.id
LEFT JOIN daily_reports dr ON dr.agent_id = u.id 
  AND dr.report_date >= CURRENT_DATE - INTERVAL '30 days'
WHERE u.manager_id = auth.uid()
GROUP BY u.id, u.full_name;
```

### Get Lead Activity Timeline
```sql
SELECT *
FROM lead_activities
WHERE lead_id = 'lead-uuid-here'
ORDER BY activity_date DESC
LIMIT 50;
```

---

## Troubleshooting

### Common Issues

#### 1. Permission Denied Errors
**Cause**: RLS policy blocking access  
**Solution**: Check user's role and ensure proper RLS policies exist

#### 2. Foreign Key Violations
**Cause**: Trying to insert/update with invalid references  
**Solution**: Ensure referenced records exist before insert/update

#### 3. Validation Errors
**Cause**: Trigger validation functions rejecting changes  
**Solution**: Review validation logic in trigger functions

#### 4. Sync Lock Issues
**Cause**: External sync conflicts  
**Solution**: Use `sync_lock` field to prevent concurrent updates

---

## Development Guidelines

### Adding New Tables
1. Create migration file with timestamp
2. Define table with appropriate columns
3. Add foreign key constraints
4. Enable RLS if needed
5. Create RLS policies
6. Add validation trigger if needed
7. Add to this documentation

### Adding New Functions
1. Create function with proper security level
2. Add appropriate comments
3. Test thoroughly
4. Add to this documentation
5. Update RPC endpoints if needed

### Modifying Existing Tables
1. Create new migration file
2. Use `ALTER TABLE` statements
3. Handle existing data carefully
4. Update validation triggers if needed
5. Update this documentation

---

## Changelog

### 2025-11-28
- Initial database schema documentation
- 24 tables documented
- 18 custom functions documented
- 31 triggers documented
- 30 foreign key relationships documented
- 2 Edge Functions documented

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgREST API Reference](https://postgrest.org/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**End of Documentation**

