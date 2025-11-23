# 🗄️ Supabase Database Setup Guide

This guide will help you set up your Supabase database for the Clara multi-agent system.

---

## 📋 **Prerequisites**

1. A Supabase account (free tier works fine)
2. A Supabase project created

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Get Your Supabase Credentials**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **service_role key** (⚠️ This is SECRET - the long key under "service_role")

### **Step 2: Add Credentials to .env**

Update your `.env` file in `clara-backend/`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-role-key-here...
```

⚠️ **IMPORTANT:** Use the **service_role** key, NOT the anon key!

### **Step 3: Create Database Tables**

1. In your Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase_schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** (or press F5)

You should see: ✅ "Success. No rows returned"

### **Step 4: Verify Tables Were Created**

Run this query in the SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- ✅ `activities`
- ✅ `clients`
- ✅ `conversations`
- ✅ `leads`

### **Step 5: Test Connection**

Run the test pipeline:

```bash
python test_pipeline.py
```

You should now see:
```
✓ PASS - Supabase Connection
```

---

## 🎯 **Quick Verification Checklist**

- [ ] Supabase project created
- [ ] **service_role** key copied (not anon key!)
- [ ] `SUPABASE_URL` added to `.env`
- [ ] `SUPABASE_SERVICE_KEY` added to `.env`
- [ ] `supabase_schema.sql` executed in SQL Editor
- [ ] All 4 tables created successfully
- [ ] `test_pipeline.py` passes Supabase connection test

---

## 🔍 **Troubleshooting**

### **Error: "permission denied for schema public"**

**Problem:** You might be using the `anon` key instead of the `service_role` key.

**Solution:** 
1. Go to Settings → API in Supabase
2. Copy the **service_role** key (the longer one marked as secret)
3. Update `SUPABASE_SERVICE_KEY` in your `.env` file

### **Error: "relation does not exist"**

**Problem:** Tables haven't been created yet.

**Solution:** Run the `supabase_schema.sql` in the SQL Editor (Step 3 above)

### **Error: "getaddrinfo failed"**

**Problem:** The `SUPABASE_URL` is incorrect or placeholder.

**Solution:** 
1. Check your `.env` file
2. Make sure `SUPABASE_URL` is a real URL like `https://xxxxx.supabase.co`
3. Copy it exactly from Settings → API in Supabase Dashboard

---

## 📊 **Database Schema Overview**

### **Tables:**

1. **`clients`** - Customer/company information
   - Basic info: name, email, phone, company
   - Industry, size, website
   - Status tracking

2. **`leads`** - Sales leads and qualification
   - BANT information (Budget, Authority, Need, Timeline)
   - Qualification status and scoring
   - Conversation context

3. **`activities`** - All interactions and events
   - Activity type, agent, outcome
   - Message content and responses
   - Session tracking

4. **`conversations`** - Conversation history
   - Session management
   - Message history (JSONB)
   - Status and summaries

---

## 🔐 **Security Notes**

- **service_role** key bypasses Row Level Security (RLS)
- Perfect for backend operations
- ⚠️ **NEVER expose this key to clients/frontend**
- Keep it in `.env` file (which is in `.gitignore`)

---

## 🎉 **Next Steps**

Once your Supabase is set up:

1. ✅ Run `python test_pipeline.py` to verify everything works
2. 🚀 Start testing the full pipeline with real data
3. 📊 View your leads in Supabase Dashboard → Table Editor
4. 🔄 Integrate with your frontend/voice interface

---

## 📚 **Additional Resources**

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

Need help? Check the logs in `test_pipeline.py` for detailed error messages! 🐛

