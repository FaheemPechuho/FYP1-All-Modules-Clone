# 🚀 QUICK START GUIDE - HUSNAIN'S SUPPORT AGENT

## ✅ WHAT'S ALREADY DONE

1. ✅ Python packages installed (FastAPI, Supabase, Transformers, etc.)
2. ✅ Folder structure created
3. ✅ Main FastAPI application (`main_husnain.py`)
4. ✅ Ticket API with Supabase integration
5. ✅ Database schema SQL file ready

---

## 🔥 NEXT STEPS (DO THIS NOW!)

### Step 1: Setup Supabase (5 minutes)

**Go to:** https://supabase.com

1. Click "Start your project" (FREE!)
2. Sign up with GitHub or Email
3. Click "New Project"
4. Fill in:
   - Name: `clara-crm`
   - Database Password: `Choose a strong password` (save it!)
   - Region: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for setup

**Get Your Credentials:**
1. In Supabase dashboard, click "Settings" (⚙️ gear icon)
2. Click "API"
3. Copy these TWO values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

---

### Step 2: Create Database Tables in Supabase

1. In Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New query"
3. Open this file: `d:/BS SE/FYP/FYP1-All-Modules-Clone/clara-backend/database/complete_schema.sql`
4. Copy ALL the SQL code
5. Paste into Supabase SQL editor
6. Click "Run" (▶️ button at bottom right)
7. You should see: ✅ "Success. No rows returned"

---

### Step 3: Configure Your .env File

**In VS Code:**

1. Copy `.env.example` to `.env`:
   ```powershell
   copy .env.example .env
   ```

2. Open `.env` file and update these lines:
   ```env
   SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   SUPABASE_KEY=eyJ...your-anon-key...
   ```

3. Save the file

---

### Step 4: Start Your API Server!

**Run this command:**

```powershell
cd "d:/BS SE/FYP/FYP1-All-Modules-Clone/clara-backend"
python main_husnain.py
```

**You should see:**
```
🚀 Starting Clara AI Support Agent...
📚 API Documentation: http://localhost:8001/docs
💚 Health Check: http://localhost:8001/health
✅ Ticket API routes loaded
INFO:     Uvicorn running on http://0.0.0.0:8001
```

---

### Step 5: Test Your API!

**Open browser:** http://localhost:8001/docs

**You'll see Swagger UI with these endpoints:**
- `GET /` - Root
- `GET /health` - Health check (shows GPU status)
- `GET /api/test` - Test Supabase connection
- `POST /api/tickets/` - Create ticket ⭐
- `GET /api/tickets/` - List tickets
- `GET /api/tickets/{id}` - Get single ticket
- `PATCH /api/tickets/{id}` - Update ticket
- `DELETE /api/tickets/{id}` - Delete ticket

**Test Creating a Ticket:**

1. Click `POST /api/tickets/`
2. Click "Try it out"
3. Enter this JSON:
   ```json
   {
     "customer_email": "test@example.com",
     "subject": "Cannot login to my account",
     "description": "I've been trying to login but it says invalid password",
     "channel": "email"
   }
   ```
4. Click "Execute"
5. You should get **201 Created** response with ticket details!

---

## 🎯 PHASE 1 COMPLETE CHECKLIST

```
✅ Supabase project created
✅ Database tables created (run SQL schema)
✅ .env file configured with Supabase credentials
✅ API server running on port 8001
✅ Swagger UI accessible at /docs
✅ Test ticket created successfully
```

---

## 🔥 WHAT'S NEXT (PHASE 2)

After Phase 1 is complete, we'll add:

1. **AI Classification** - Automatically categorize tickets (DistilBERT)
2. **RAG System** - Answer questions using knowledge base
3. **GPU Acceleration** - Speed up ML models (if GPU available)
4. **Email Integration** - Process emails automatically
5. **Escalation Logic** - Smart ticket routing

---

## 🆘 TROUBLESHOOTING

**Problem:** "Database not configured" error
**Solution:** Make sure `.env` file has correct SUPABASE_URL and SUPABASE_KEY

**Problem:** "Failed to create ticket" error
**Solution:** Check Supabase SQL schema ran successfully (Step 2)

**Problem:** Port 8001 already in use
**Solution:** Change port in `main_husnain.py` line 106: `port=8002`

**Problem:** GPU not available
**Solution:** It's OK! Everything works on CPU. For GPU, install CUDA Toolkit from NVIDIA

---

## 📞 READY FOR PHASE 2?

Once you complete the checklist above, tell me:

**"Phase 1 Complete! Ready for AI/ML integration"**

Then I'll help you implement:
- Classification model training
- RAG knowledge base system
- GPU-accelerated inference
- Email automation

---

**Good luck! 🚀 You're doing great!**
