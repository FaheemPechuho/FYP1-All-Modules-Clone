# TrendtialCRM Database Complete Clone Guide

## 📋 Overview

This guide will help you create a complete clone of your TrendtialCRM Supabase database. The clone includes:

✅ **All Tables** (24 tables with complete schemas)  
✅ **All Functions** (17 database functions)  
✅ **All Triggers** (15 triggers)  
✅ **All RLS Policies** (42 security policies)  
✅ **Custom Types** (4 enum types)  
✅ **Default Data** (Pipeline stages)  
✅ **Edge Functions** (2 functions: `create-user`, `reset-user-password`)

---

## 🚀 Quick Start

### Option 1: Create New Supabase Project (Recommended)

1. **Create a new Supabase project**
   - Go to: https://app.supabase.com
   - Click "New Project"
   - Choose organization, name, database password, and region
   - Wait for project to be ready (~2 minutes)

2. **Apply the database schema**
   - Open SQL Editor in your new project
   - Copy all contents from `COMPLETE_TRENDTIALCRM_CLONE.sql`
   - Paste into SQL Editor
   - Click "Run" (should take ~10-30 seconds)

3. **Deploy Edge Functions**
   ```bash
   cd trendtialcrm
   supabase functions deploy create-user --project-ref jtdrwkwsbufwhzahfesu YOUR_NEW_PROJECT_REF
   supabase functions deploy reset-user-password --project-ref YOUR_NEW_PROJECT_REF
   ```

4. **Update Clara Backend configuration**
   - Copy the new project's URL and keys from Settings → API
   - Update `clara-backend/.env`:
     ```env
     SUPABASE_URL=https://YOUR_NEW_PROJECT_REF.supabase.co
     SUPABASE_SERVICE_KEY=your_new_service_role_key_here
     ```

---

### Option 2: Use Existing Supabase Project

⚠️ **WARNING**: This will modify your existing database. Make sure you have backups!

1. **Open SQL Editor in your Supabase Dashboard**
   - Navigate to: https://app.supabase.com/project/YOUR_PROJECT_REF/sql

2. **Run the clone script**
   - Copy all contents from `COMPLETE_TRENDTIALCRM_CLONE.sql`
   - Paste into SQL Editor
   - Review carefully (script uses `IF NOT EXISTS` for safety)
   - Click "Run"

3. **Verify the migration**
   - Check that all tables are created
   - Check that functions are present
   - Test with a simple query:
     ```sql
     SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = 'public' 
     ORDER BY table_name;
     ```

---

## 📊 What's Included

### 🗄️ Tables (24)

**Core CRM Tables:**
- `users` - User accounts with role-based access control
- `clients` - Client/company information
- `leads` - Lead/deal tracking
- `pipeline_stages` - Configurable sales pipeline
- `calls` - Call tracking
- `meetings` - Meeting scheduling
- `follow_ups` - Follow-up task management
- `lead_activities` - Activity timeline

**Supporting Tables:**
- `admin_audit` - Administrative action logs
- `attendance` - User attendance tracking
- `daily_reports` - Agent performance reports
- `notifications` - In-app notifications
- `notification_preferences` - User notification settings
- `nurture_sequences` - Automated nurturing campaigns
- `nurture_steps` - Individual campaign steps
- `lead_nurture_enrollments` - Lead enrollment tracking
- `lead_scoring_criteria` - Scoring rules
- `todos` - Task management
- `todo_comments` - Task comments
- `todo_attachments` - Task attachments
- `user_links` - Social media links

### ⚙️ Functions (17)

**Core Utility Functions:**
- `handle_new_user()` - Auto-creates user profile on auth signup
- `get_current_user_role()` - Returns current user's role
- `is_manager_of()` - Checks manager-agent relationship
- `handle_updated_at()` - Auto-updates timestamp columns
- `update_updated_at_column()` - Timestamp trigger function
- `trigger_set_timestamp()` - Alternative timestamp function
- `set_completed_at()` - Tracks todo completion time

**Validation Functions:**
- `validate_client_changes()` - Client data validation
- `validate_lead_engagement_changes()` - Lead data validation
- `validate_follow_up_changes()` - Follow-up validation
- `validate_meeting_changes()` - Meeting validation
- `validate_user_update()` - User update validation

**Business Logic Functions:**
- `bulk_import_leads()` - Bulk lead import with client creation
- `import_leads_bulk()` - Alternative bulk import
- `clean_import_data()` - Data sanitization
- `create_agent_if_not_exists()` - Auto-create agent users
- `generate_reminder_notifications()` - Scheduled notification generation
- `upsert_follow_ups_bulk()` - Bulk follow-up creation
- `upsert_meetings_bulk()` - Bulk meeting creation

### 🔔 Triggers (15)

**Auth Triggers:**
- `on_auth_user_created` - Triggers on new auth user

**Data Validation Triggers:**
- `before_client_changes_validation`
- `before_lead_engagement_changes_validation`
- `before_follow_up_changes_validation`
- `before_meeting_changes_validation`
- `before_user_update_validation`

**Timestamp Update Triggers:**
- `set_clients_updated_at`
- `set_leads_updated_at`
- `set_follow_ups_updated_at`
- `set_meetings_updated_at`
- `on_daily_reports_updated`
- `update_notifications_updated_at`
- `update_notification_preferences_updated_at`
- `update_todos_updated_at`
- `set_todo_completed_at`

### 🔐 RLS Policies (42)

**Complete Row-Level Security** for:
- Users (6 policies)
- Clients (1 policy)
- Leads (4 policies)
- Follow-ups (3 policies)
- Meetings (3 policies)
- Admin Audit (2 policies)
- Attendance (3 policies)
- Daily Reports (3 policies)
- Notifications (3 policies)
- Notification Preferences (3 policies)
- Todos (4 policies)
- Todo Comments (2 policies)
- Todo Attachments (2 policies)
- User Links (1 policy)

### 📦 Custom Types (4)

- `attendance_status_enum`: CheckedOut, CheckedIn, OnLeave
- `team_type_enum`: telesales, linkedin, cold_email
- `todo_status`: pending, in_progress, completed, cancelled
- `todo_priority`: low, medium, high, urgent

---

## 🧪 Verification Steps

After running the clone script, verify everything is set up correctly:

### 1. Check Tables

```sql
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: 24 tables
```

### 2. Check Functions

```sql
SELECT COUNT(*) as function_count 
FROM pg_proc p
LEFT JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public';
-- Expected: 17+ functions
```

### 3. Check Triggers

```sql
SELECT COUNT(*) as trigger_count 
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal AND n.nspname IN ('public', 'auth');
-- Expected: 15+ triggers
```

### 4. Check RLS Policies

```sql
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public';
-- Expected: 42+ policies
```

### 5. Check Pipeline Stages

```sql
SELECT * FROM pipeline_stages ORDER BY order_position;
-- Expected: 7 default stages
```

### 6. Test User Creation

```sql
-- This should work if RLS is properly configured
SELECT * FROM users WHERE id = auth.uid();
```

---

## 🔧 Edge Functions

Your TrendtialCRM has **2 Edge Functions** that need to be deployed separately:

### 1. `create-user`
- **Purpose**: Creates new user accounts with proper role assignment
- **Path**: `trendtialcrm/supabase/functions/create-user/index.ts`
- **Verify JWT**: ✅ Yes

### 2. `reset-user-password`
- **Purpose**: Handles password reset requests
- **Path**: `trendtialcrm/supabase/functions/reset-user-password/index.ts`
- **Verify JWT**: ❌ No

### Deployment Commands

```bash
# Make sure you're in the trendtialcrm directory
cd trendtialcrm

# Deploy both functions
supabase functions deploy create-user --project-ref YOUR_PROJECT_REF
supabase functions deploy reset-user-password --project-ref YOUR_PROJECT_REF

# Or deploy all functions at once
supabase functions deploy --project-ref YOUR_PROJECT_REF
```

### Test Edge Functions

```bash
# Test create-user function
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-user' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","password":"securepass123","role":"agent"}'

# Test reset-user-password function
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/reset-user-password' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com"}'
```

---

## 🔄 Syncing with Original Database

If you want to keep your clone synchronized with the original database:

### 1. Export Data from Original

```bash
# Using Supabase CLI
supabase db dump --project-ref ORIGINAL_PROJECT_REF --data-only > data_export.sql
```

### 2. Import Data to Clone

```bash
# Apply to new database
psql -h db.YOUR_NEW_PROJECT_REF.supabase.co \
     -U postgres \
     -d postgres \
     -f data_export.sql
```

### 3. Or Use Supabase Studio

- Go to Database → Backups
- Create a backup of original database
- Download the backup
- Restore to new project

---

## 🛠️ Customization

### Adding New Roles

To add a new role beyond `agent`, `manager`, `super_admin`:

```sql
-- 1. Modify the CHECK constraint on users table
ALTER TABLE public.users 
DROP CONSTRAINT users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('agent', 'manager', 'super_admin', 'YOUR_NEW_ROLE'));

-- 2. Add RLS policies for the new role
CREATE POLICY "your_new_role_access" 
    ON public.leads 
    FOR ALL 
    TO authenticated 
    USING (get_current_user_role() = 'YOUR_NEW_ROLE');
```

### Adding New Pipeline Stages

```sql
INSERT INTO public.pipeline_stages (name, description, order_position, probability, color_code)
VALUES ('Onboarding', 'Client onboarding phase', 8, 100, '#3b82f6');
```

### Modifying Lead Scoring

```sql
INSERT INTO public.lead_scoring_criteria 
    (name, category, condition_field, condition_operator, condition_value, score_points)
VALUES 
    ('High Deal Value', 'firmographic', 'deal_value', 'greater_than', '50000', 20),
    ('Fast Timeline', 'demographic', 'timeline', 'equals', 'immediate', 15);
```

---

## 📝 Important Notes

1. **Service Role Key**: The clone uses the same security model as the original. Clara Backend MUST use the `service_role` key to bypass RLS.

2. **Auth Users**: The `users` table references `auth.users`. Make sure auth users are created via Supabase Auth API or Edge Functions.

3. **Manager Hierarchy**: The `manager_id` in users table creates a hierarchical structure. Ensure it references valid user IDs.

4. **Sync Lock**: The `sync_lock` field in leads prevents conflicts with Google Sheets sync. Set to `false` for Clara-managed leads.

5. **Pipeline Stage IDs**: When creating leads, you can reference `pipeline_stage_id`. Get IDs from:
   ```sql
   SELECT id, name FROM pipeline_stages ORDER BY order_position;
   ```

6. **BANT Fields**: The leads table includes BANT framework fields that Clara's qualification system uses:
   - `budget` (TEXT)
   - `authority` (TEXT)
   - `need` (TEXT)
   - `timeline` (TEXT)

---

## ❗ Troubleshooting

### "Permission denied for schema public"

**Solution**: You're using the anon key instead of service_role key. Update `.env`:
```env
SUPABASE_SERVICE_KEY=eyJhbGci...  # This should be your service_role key
```

### "Relation does not exist"

**Solution**: The schema hasn't been applied. Run `COMPLETE_TRENDTIALCRM_CLONE.sql` in SQL Editor.

### "Function get_current_user_role() does not exist"

**Solution**: Functions weren't created. Ensure the entire SQL script ran successfully without errors.

### Edge Functions not working

**Solutions**:
1. Check function is deployed: `supabase functions list --project-ref YOUR_REF`
2. Verify JWT settings in Supabase Dashboard
3. Check function logs: `supabase functions logs create-user --project-ref YOUR_REF`

### RLS Policies blocking Clara

**Solution**: Clara must use the `service_role` key which bypasses ALL RLS policies.

---

## 🎯 Next Steps

After successfully cloning your database:

1. ✅ **Test Clara Integration**
   ```bash
   cd clara-backend
   python scripts/verify_crm_integration.py
   ```

2. ✅ **Create a Test User**
   ```sql
   -- Insert a super_admin user for testing
   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
   VALUES (
       gen_random_uuid(),
       'admin@test.com',
       crypt('password123', gen_salt('bf')),
       NOW()
   );
   ```

3. ✅ **Create Clara's AI Agent User**
   ```python
   from crm_integration import UsersAPI
   
   users_api = UsersAPI()
   clara_agent = users_api.get_default_agent()
   print(f"Clara Agent ID: {clara_agent['id']}")
   ```

4. ✅ **Test Lead Creation**
   ```python
   from crm_integration import LeadsAPI
   
   leads_api = LeadsAPI()
   test_lead = leads_api.create_lead({
       "client_name": "Test Client",
       "agent_id": clara_agent['id'],
       "status_bucket": "P1",
       "lead_source": "voice_assistant"
   })
   ```

---

## 📞 Support

If you encounter any issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the original schema: `trendtialcrm/SUPABASE_DATABASE_SCHEMA.md`
3. Examine Clara integration docs: `CLARA_INTEGRATION_QUICKSTART.md`

---

## 🎉 Success!

Your TrendtialCRM database has been successfully cloned! Clara Backend can now:

- ✅ Create and manage leads
- ✅ Track calls and conversations
- ✅ Schedule follow-ups and meetings
- ✅ Log activities automatically
- ✅ Utilize BANT qualification
- ✅ Manage the full sales pipeline

**Ready to start testing!** 🚀

