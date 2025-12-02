# ✅ PHASE 1 CHECKLIST - HUSNAIN

**Goal:** Make ticket API work with your Supabase database

---

## What I've Done For You ✅

1. ✅ Created `.env` file with your Supabase credentials
2. ✅ Created `main_husnain.py` (FastAPI server)
3. ✅ Created `ticket_api.py` (ticket CRUD endpoints)
4. ⏳ Installing Python packages (running now...)

---

## What YOU Need To Do (3 Simple Steps)

### **STEP 1: Add Support Agent Tables to Your Supabase** 🔍

Your existing tables (✅ already have):
- ✅ users
- ✅ clients
- ✅ leads
- ✅ meetings
- ✅ pipeline_stages

**Need to ADD these tables for Support Agent:**
- ⏳ tickets
- ⏳ customers
- ⏳ queues
- ⏳ slas
- ⏳ kb_articles (knowledge base)
- ⏳ kb_chunks
- ⏳ kb_embeddings
- ⏳ citations
- ⏳ ticket_history

**HOW TO ADD THEM:**

1. Go to your Supabase dashboard: https://jtdrwkwsbufwhzahfesu.supabase.co
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New query"**
4. Open this file: `database/add_support_tables.sql`
5. Copy ALL the SQL code
6. Paste into Supabase SQL editor
7. Click **"Run"** (▶️ button)
8. Should see: ✅ "Support Agent tables created successfully!"

---

### **STEP 2: Run The Server** 🚀

After packages finish installing (wait 1-2 minutes), run:

```powershell
cd "d:/BS SE/FYP/FYP1-All-Modules-Clone/clara-backend"
python main_husnain.py
```

**Expected output:**
```
🚀 Starting Clara AI Support Agent...
📚 API Documentation: http://localhost:8001/docs
💚 Health Check: http://localhost:8001/health
✅ Supabase client initialized
✅ Ticket API routes loaded
INFO:     Uvicorn running on http://0.0.0.0:8001
```

If you see this → SUCCESS! ✅

---

### **STEP 3: Test In Browser** 🌐

Open: **http://localhost:8001/docs**

You'll see Swagger UI with these endpoints:

#### Test 1: Health Check
- Click `GET /health`
- Click "Try it out" → "Execute"
- Should show: `"status": "healthy"`

#### Test 2: Database Connection
- Click `GET /api/test`
- Click "Try it out" → "Execute"
- Should show: `"status": "connected"` ✅

#### Test 3: Create a Ticket
- Click `POST /api/tickets/`
- Click "Try it out"
- Paste this JSON:
  ```json
  {
    "customer_email": "test@example.com",
    "subject": "Test ticket",
    "description": "This is a test ticket",
    "channel": "email"
  }
  ```
- Click "Execute"
- Should get **201 Created** with ticket details ✅

#### Test 4: List Tickets
- Click `GET /api/tickets/`
- Click "Try it out" → "Execute"
- Should see your test ticket in the list ✅

---

## ⚠️ If Something Fails

### Error: "Table 'tickets' does not exist"
**Solution:** You need to create tables in Supabase
→ Tell me and I'll give you the SQL script

### Error: "Invalid API key"
**Solution:** Double-check `.env` file has correct `SUPABASE_KEY`

### Error: "Module not found"
**Solution:** Wait for pip install to finish, then try again

---

## 🎯 Phase 1 Is Complete When:

```
✅ Server starts without errors
✅ GET /health returns "healthy"
✅ GET /api/test returns "connected"
✅ POST /api/tickets/ creates a ticket
✅ GET /api/tickets/ shows the ticket
✅ You can see the ticket in Supabase Table Editor
```

---

## 📞 What To Tell Me Next

After you complete Steps 1-3, tell me:

1. **If server started:** "Server is running! ✅"
2. **Your Supabase table situation:**
   - "I have tickets/customers/users tables already" OR
   - "I don't have these tables, need to create them"
3. **Any errors you see**

Then I'll help you fix any issues or move to **Phase 2 (AI Classification)!**

---

**Right now: Wait 1-2 minutes for packages to install, then try STEP 2** 🚀
