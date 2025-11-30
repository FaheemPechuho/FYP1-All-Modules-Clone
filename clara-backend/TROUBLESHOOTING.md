# 🔧 Troubleshooting Guide - Clara ↔ TrendtialCRM Integration

## ❌ Common Issue: "Permission Denied for Schema Public"

### **Symptoms**
```
❌ Supabase connection failed: {'message': 'permission denied for schema public', 'code': '42501'}
```

### **Root Cause**
You're using the **ANON KEY** instead of the **SERVICE ROLE KEY**.

- **ANON KEY**: Limited permissions, restricted by Row Level Security (RLS)
- **SERVICE ROLE KEY**: Full database access, bypasses RLS (needed for Clara)

---

## ✅ Solution

### **Step 1: Get Your Service Role Key**

1. Open your **Supabase Dashboard**
2. Go to **Settings → API**
3. Find the **"service_role" key** section (usually at the bottom)
4. Click **"Reveal"** and copy the full key

**Visual Guide:**
```
Supabase Dashboard → Settings → API

┌─────────────────────────────────────┐
│ Project API Keys                    │
├─────────────────────────────────────┤
│ anon / public                       │  ← ❌ DON'T use this
│ eyJhbGciOiJIUzI1NiIsInR5cCI6...    │
│                                     │
│ service_role (secret)               │  ← ✅ USE THIS ONE
│ [Reveal]                            │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6...    │
└─────────────────────────────────────┘
```

### **Step 2: Update Your .env File**

```bash
# clara-backend/.env

# ❌ WRONG - Using anon key
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...

# ✅ CORRECT - Using service_role key
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6... (much longer key)
```

**How to tell the difference:**
- **Anon key**: Usually ~200-300 characters
- **Service key**: Usually 400-600+ characters (much longer!)

### **Step 3: Verify Your Configuration**

```bash
cd clara-backend
python -m scripts.verify_crm_integration
```

**Expected Output:**
```
✅ SUPABASE_URL: https://your-project.supabase.co...
✅ SUPABASE_SERVICE_KEY: eyJhbGciOiJIUzI1Ni...
✅ Supabase client initialized
✅ Supabase connection working
```

---

## 🔐 Security Note

**⚠️ IMPORTANT**: The service_role key has **full database access**. 

**DO:**
- ✅ Store it in `.env` file (which is in `.gitignore`)
- ✅ Use it only in backend applications
- ✅ Keep it secret

**DON'T:**
- ❌ Commit it to Git
- ❌ Use it in frontend code
- ❌ Share it publicly

---

## 🐛 Other Common Issues

### **Issue 2: Tables Don't Exist**

**Symptoms:**
```
❌ users - MISSING
❌ clients - MISSING
❌ leads - MISSING
```

**Solution:**

1. **Option A: Use TrendtialCRM's Database**
   - Point Clara Backend to the same Supabase project as TrendtialCRM
   - Update `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`

2. **Option B: Apply Schema**
   ```sql
   -- In Supabase SQL Editor, run:
   -- File: clara-backend/supabase_schema_trendtial_compatible.sql
   ```

### **Issue 3: Clara AI Agent Not Found**

**Symptoms:**
```
⚠️ CRM Connector initialized but no default agent ID
```

**Solution:**

Manually create the Clara AI agent user:

```sql
-- In Supabase SQL Editor:
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'clara@trendtialcrm.ai',
    crypt('temporary-password-change-this', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
) RETURNING id;

-- Then create the public.users entry:
INSERT INTO public.users (id, email, full_name, role)
VALUES (
    -- Use the ID returned from above query
    'paste-uuid-here',
    'clara@trendtialcrm.ai',
    'Clara AI Voice Assistant',
    'agent'
);
```

**Or simpler (if your users table allows it):**
```sql
-- If your users table doesn't require auth.users FK:
INSERT INTO public.users (email, full_name, role)
VALUES ('clara@trendtialcrm.ai', 'Clara AI Voice Assistant', 'agent');
```

### **Issue 4: Foreign Key Violations**

**Symptoms:**
```
ERROR: insert or update on table "leads" violates foreign key constraint
```

**Solution:**

Check the order of operations:
1. Ensure `users` table has Clara AI agent
2. Ensure `clients` table exists
3. Then create leads

```python
# Correct order:
users_api = UsersAPI()
clara = users_api.get_default_agent()  # Must succeed first

leads_api = LeadsAPI()
lead = leads_api.create_lead(lead_data, agent_id=clara["id"])
```

---

## 📋 Verification Checklist

Run this before reporting issues:

```bash
# 1. Check environment variables
cat .env | grep SUPABASE

# 2. Verify key type
# Service keys are MUCH longer than anon keys

# 3. Run verification script
python -m scripts.verify_crm_integration

# 4. Check Supabase Dashboard
# Go to Authentication → Users
# Verify clara@trendtialcrm.ai exists

# 5. Check tables
# Go to Table Editor
# Verify users, clients, leads, calls tables exist
```

---

## 🆘 Still Having Issues?

### **Quick Diagnostic Commands**

```python
# Test Supabase connection directly
from crm_integration import get_supabase_client

client = get_supabase_client()

# Try listing tables (should work with service key)
result = client.table("users").select("id").limit(1).execute()
print(result.data)

# If you get "permission denied", you're using the wrong key
```

### **Check Your Configuration**

```python
from config import settings

print(f"URL: {settings.SUPABASE_URL}")
print(f"Key length: {len(settings.SUPABASE_SERVICE_KEY)}")
print(f"Key prefix: {settings.SUPABASE_SERVICE_KEY[:20]}")

# Service keys typically:
# - Start with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
# - Length: 400-600+ characters
# - Contain "service_role" when decoded
```

---

## 📞 Need Help?

1. **Check logs**: `logs/clara-backend.log`
2. **Review documentation**: 
   - `CLARA_INTEGRATION_QUICKSTART.md`
   - `CLARA_INTEGRATION_PHASE1_COMPLETE.md`
3. **Verify schema**: `trendtialcrm/SUPABASE_DATABASE_SCHEMA.md`

---

## ✅ Success Indicators

When everything is working correctly:

```
✅ Supabase Connection
✅ Required Tables
✅ Clara AI Agent
✅ API Initialization
✅ Lead Creation Flow
✅ Call Tracking

Overall: 6/6 checks passed

🎉 All checks passed! Integration is ready!
```

Then you can start Clara:
```bash
python main.py
```

---

**Remember**: Always use the **service_role** key for backend applications! 🔑

