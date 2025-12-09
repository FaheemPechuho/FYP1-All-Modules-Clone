# 🌐 SUPABASE SETUP - NO LOCAL DATABASE NEEDED!

**You DON'T need to install PostgreSQL locally!**  
**Supabase provides cloud PostgreSQL for FREE!**

---

## 📝 STEP-BY-STEP SUPABASE SETUP

### **Step 1: Create Supabase Account** (2 minutes)

1. Go to: **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with:
   - GitHub account (recommended), OR
   - Email + Password

---

### **Step 2: Create New Project** (3 minutes)

1. After login, click **"New Project"**
2. Fill in the form:
   ```
   Name:              clara-crm
   Database Password: [Choose a strong password - save it!]
   Region:            [Choose closest to you: e.g., Southeast Asia (Singapore)]
   ```
3. Click **"Create new project"**
4. **Wait 2-3 minutes** for Supabase to setup your database

---

### **Step 3: Get Your API Credentials** (1 minute)

Once project is ready:

1. Click **"Settings"** (⚙️ gear icon in left sidebar)
2. Click **"API"** in the settings menu
3. You'll see two important values:

**Copy these TWO values:**

```
Project URL:        https://xxxxxxxxxxx.supabase.co
anon public key:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...
                    (very long string starting with eyJ)
```

**SAVE THESE!** You'll need them in the next step.

---

### **Step 4: Create Database Tables** (2 minutes)

Now we need to create all the tables (tickets, customers, etc.)

1. In Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New query"** button (top right)
3. **Open this file in VS Code:**  
   `d:/BS SE/FYP/FYP1-All-Modules-Clone/clara-backend/database/complete_schema.sql`
4. **Copy ALL the SQL code** (select all → Ctrl+C)
5. **Paste into Supabase SQL editor**
6. Click **"Run"** button (▶️ at bottom right)

**Expected result:**
```
✅ Success. No rows returned
```

**What this does:**
- Creates 12 tables (tickets, customers, users, kb_articles, etc.)
- Adds pgvector extension (for AI semantic search)
- Inserts sample data (queues, SLAs, admin users, 2 KB articles)

---

### **Step 5: Verify Tables Created** (30 seconds)

1. Click **"Table Editor"** in left sidebar
2. You should see these tables:
   - ✅ customers
   - ✅ users
   - ✅ tickets
   - ✅ ticket_history
   - ✅ queues
   - ✅ slas
   - ✅ kb_articles
   - ✅ kb_chunks
   - ✅ kb_embeddings
   - ✅ citations
   - ✅ meetings
   - ✅ tasks

If you see all these tables: **SUCCESS!** ✅

---

### **Step 6: Configure Your Application** (1 minute)

**In VS Code:**

1. Navigate to: `clara-backend` folder
2. Create `.env` file (copy from `.env.example`):
   ```powershell
   copy .env.example .env
   ```
3. Open `.env` file
4. Update these lines with YOUR credentials from Step 3:
   ```env
   SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
   SUPABASE_KEY=eyJhbGci...YOUR-LONG-ANON-KEY...
   ```
5. Save the file

---

### **Step 7: Start Your API Server** (30 seconds)

**Run in PowerShell:**

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

**If you see this → YOU'RE READY!** ✅

---

### **Step 8: Test Your API** (2 minutes)

**Open browser:** http://localhost:8001/docs

You'll see **Swagger UI** with all your API endpoints!

**Test 1: Health Check**
1. Click `GET /health`
2. Click "Try it out" → "Execute"
3. Should show:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "gpu": { "available": false, "device": "CPU Only" }
   }
   ```

**Test 2: Create Your First Ticket!**
1. Click `POST /api/tickets/`
2. Click "Try it out"
3. Enter this JSON:
   ```json
   {
     "customer_email": "john@example.com",
     "subject": "Password reset needed",
     "description": "I forgot my password and can't login",
     "channel": "email"
   }
   ```
4. Click "Execute"
5. Should get **201 Created** response with ticket details!

**Test 3: View Your Ticket**
1. Click `GET /api/tickets/`
2. Click "Try it out" → "Execute"
3. Should see list with your ticket!

---

## 🎉 PHASE 1 COMPLETE!

**Checklist:**
```
✅ Supabase account created
✅ Project created and running
✅ Database tables created (12 tables)
✅ .env configured with credentials
✅ API server running
✅ Swagger UI accessible
✅ Test ticket created successfully
```

---

## 🚀 WHAT'S NEXT (PHASE 2)

Now you're ready for AI features! Tell me:

**"Phase 1 complete! Ready for Phase 2"**

Then I'll add:
- 🤖 **AI Classification** - Auto-categorize tickets (DistilBERT)
- 🧠 **RAG System** - Answer questions from knowledge base
- 📧 **Email Integration** - Auto-process support emails
- 🚨 **Smart Escalation** - Intelligent ticket routing

---

## 💡 WHY SUPABASE?

**Advantages:**
- ✅ No local database installation
- ✅ Free tier (500MB database, 2GB bandwidth)
- ✅ Auto-backups
- ✅ Built-in authentication
- ✅ Real-time subscriptions
- ✅ Dashboard for viewing data
- ✅ Automatic API generation
- ✅ Works from anywhere (cloud-hosted)

**Perfect for your FYP!**

---

## 🆘 TROUBLESHOOTING

**Problem:** "Invalid API key"
**Solution:** Make sure you copied the **anon public** key, not the service_role key

**Problem:** "Project URL not found"
**Solution:** Check the URL format: `https://xxxxx.supabase.co` (no trailing slash)

**Problem:** SQL execution failed
**Solution:** 
1. Make sure your project finished setting up (wait 3 mins)
2. Try running the SQL in smaller chunks
3. Check "SQL Editor" → "Query History" for errors

**Problem:** "Table already exists" error
**Solution:** That's OK! Tables are created. Just continue to next step.

---

## 📱 VIEW YOUR DATA

**To see your tickets in Supabase:**
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Click "tickets" table
4. You'll see all tickets with a nice UI!

**You can:**
- View data
- Edit records
- Filter/search
- Export to CSV

---

**START NOW! 🚀**

Follow these 8 steps and you'll have a working API in **10 minutes!**
