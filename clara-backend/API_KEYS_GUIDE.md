# 🔑 API Keys Guide - Clara Backend

## Configuration Summary

Your Clara backend is configured to match your **Verbi voice assistant** setup for consistency:

- **LLM:** Groq (llama-3.3-70b-versatile) ✅ FREE & Fast
- **STT:** Groq Whisper ✅ FREE
- **TTS:** Cartesia ✅ Streaming & Natural

---

## 🚀 Required API Keys (3 Total)

### 1. Groq API Key (FREE) ⭐ PRIMARY

**Used for:**
- LLM responses (Sales Agent conversations)
- Speech-to-Text (Voice transcription)

**Get it:**
1. Go to: https://console.groq.com/
2. Sign up (free account)
3. Navigate to "API Keys"
4. Click "Create API Key"
5. Copy the key (starts with `gsk_`)

**Add to `.env`:**
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Cost:** ✅ **FREE** (generous limits)
**Speed:** ⚡ Very fast (faster than OpenAI)

---

### 2. Cartesia API Key

**Used for:**
- Text-to-Speech (Voice output with streaming)

**Get it:**
1. Go to: https://play.cartesia.ai/
2. Sign up
3. Go to API section
4. Create API key

**Add to `.env`:**
```env
CARTESIA_API_KEY=your_cartesia_key_here
```

**Cost:** Free tier available
**Why:** Natural voice, streaming support (same as Verbi)

---

### 3. Supabase Credentials (From trendtialcrm)

**Used for:**
- CRM database (leads, clients, activities)

**Get it:**
You already have this from your `trendtialcrm` project!

1. Go to: https://app.supabase.com/
2. Select your **trendtialcrm** project
3. Go to **Settings** → **API**
4. Copy:
   - Project URL
   - anon (public) key
   - service_role key ⚠️ (keep secret!)

**Add to `.env`:**
```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
```

⚠️ **Important:** Use the SAME Supabase project as trendtialcrm for data consistency

---

## 📋 Optional API Keys (Backups)

### OpenAI (Optional Backup)

**Used for:** Backup LLM if Groq is unavailable

**Get it:**
- https://platform.openai.com/api-keys
- Create new secret key

**Add to `.env`:**
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Cost:** Paid (usage-based)

---

### Deepgram (Optional Backup)

**Used for:** Backup STT/TTS

**Get it:**
- https://console.deepgram.com/
- Sign up and get API key

**Add to `.env`:**
```env
DEEPGRAM_API_KEY=your_deepgram_key
```

---

## ⚡ Quick Setup (Copy-Paste Ready)

Create a file `.env` in `clara-backend/` folder:

```env
# ===== REQUIRED (3 keys) =====
GROQ_API_KEY=gsk_your_groq_key_here
CARTESIA_API_KEY=your_cartesia_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# ===== Agent & Voice Config =====
SALES_AGENT_ENABLED=true
STT_MODEL=groq
TTS_MODEL=cartesia
SALES_AGENT_MODEL=llama-3.3-70b-versatile

# ===== Optional Defaults =====
ORCHESTRATOR_PORT=8001
LOG_LEVEL=INFO
CLASSIFICATION_CONFIDENCE_THRESHOLD=0.75
```

That's it! These 3 keys + config is all you need.

---

## ✅ Verify Your Setup

After creating `.env`, run:

```bash
cd clara-backend

# Test 1: Check config loads
python -c "from config import settings; print('✓ Config loaded')"

# Test 2: Check Groq key
python -c "from config import settings; print('✓ Groq key:', 'Found' if settings.GROQ_API_KEY else 'MISSING')"

# Test 3: Check Cartesia key
python -c "from config import settings; print('✓ Cartesia key:', 'Found' if settings.CARTESIA_API_KEY else 'MISSING')"

# Test 4: Check Supabase
python -c "from crm_integration.supabase_client import test_connection; print('✓ Supabase:', 'Connected' if test_connection() else 'Failed')"

# Test 5: Run full pipeline test
python test_pipeline.py
```

---

## 💡 Cost Breakdown

| Service | Purpose | Cost | Notes |
|---------|---------|------|-------|
| Groq | LLM + STT | ✅ **FREE** | Generous free tier |
| Cartesia | TTS | Free tier | Premium for production |
| Supabase | CRM Database | Free tier | 500MB free |
| **Total** | **All features** | **$0** | Perfect for development! |

---

## 🔄 Sync with Verbi

Your Verbi `.env` should have:
```env
GROQ_API_KEY=gsk_xxx
CARTESIA_API_KEY=xxx
```

Use the **SAME keys** in clara-backend `.env` for consistency!

---

## 🚨 Important Notes

1. **Never commit `.env` to Git** - It's in `.gitignore`
2. **Keep service_role key secret** - Don't share or expose
3. **Groq is recommended** - Free, fast, and reliable
4. **Reuse your Supabase project** - Don't create a new one
5. **Test after setup** - Run `python test_pipeline.py`

---

## 📞 Need Help?

### Issue: "No LLM API key configured"
**Solution:** Add `GROQ_API_KEY` to `.env`

### Issue: "Supabase connection failed"
**Solution:** Check URL and service_role key from trendtialcrm

### Issue: "Cartesia not found"
**Solution:** Add `CARTESIA_API_KEY` to `.env`

### Issue: "Module not found"
**Solution:** Run `pip install -r requirements.txt`

---

## 🎯 Summary

**Minimum Required:**
- ✅ Groq API Key (FREE)
- ✅ Cartesia API Key (FREE tier)
- ✅ Supabase credentials (from trendtialcrm)

**That's it!** You're ready to go! 🚀

---

**Last Updated:** November 22, 2025
**Matches:** Verbi voice assistant configuration

