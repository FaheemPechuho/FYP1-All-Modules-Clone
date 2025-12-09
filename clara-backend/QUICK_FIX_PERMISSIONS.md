# 🚨 QUICK FIX: Permission Denied Error

## Your Issue
```
❌ permission denied for schema public
```

## The Problem
**You're using the ANON key instead of the SERVICE ROLE key.**

## The Solution (3 Steps)

### **1️⃣ Get Your Service Role Key**

Go to: **Supabase Dashboard → Settings → API**

Look for **"service_role"** (NOT "anon"):

```
┌────────────────────────────────────┐
│ service_role (secret)              │  ← Click "Reveal"
│ [Reveal]                           │  ← Copy this entire key
└────────────────────────────────────┘
```

### **2️⃣ Update Your .env File**

Open: `clara-backend/.env`

Replace the current key with the service_role key:

```bash
# Before (wrong):
SUPABASE_SERVICE_KEY=eyJhbG... (short key ~200 chars)

# After (correct):
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6... (long key ~400-600 chars)
```

### **3️⃣ Test Again**

```bash
python -m scripts.verify_crm_integration
```

**Expected Result:**
```
✅ Supabase connection working
✅ Required Tables
✅ All checks passed!
```

---

## How to Tell Them Apart

| Key Type | Length | Permissions | Use Case |
|----------|--------|-------------|----------|
| **anon** | ~200-300 chars | Limited (RLS restricted) | Frontend apps |
| **service_role** | ~400-600 chars | Full access (bypasses RLS) | Backend apps |

**Clara needs the service_role key!** ✅

---

## Still Not Working?

### Check if you copied the full key:
```bash
# In PowerShell:
$env:SUPABASE_SERVICE_KEY

# Should show a VERY long string
# If short (~200 chars), you copied the anon key
# If long (~400-600 chars), you have the right key
```

### Make sure .env is loaded:
```bash
# Check if the file exists
ls .env

# Restart your terminal/PowerShell after editing .env
```

### Verify the key in Supabase:
1. Go to Supabase → Settings → API
2. Compare the first 20 characters
3. Make sure you clicked "Reveal" on the **service_role** section

---

## ✅ Once Fixed

Run the verification again:
```bash
python -m scripts.verify_crm_integration
```

Then start Clara:
```bash
python main.py
```

---

**Need more help?** Check `TROUBLESHOOTING.md` for detailed diagnostics.

