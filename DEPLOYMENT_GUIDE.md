# Deployment Guide — TrendtialCRM + Clara Backend

## Architecture Overview

```
[Browser]
    │
    ▼
[Vercel]  ← TrendtialCRM (React/Vite frontend)
    │  VITE_CLARA_BACKEND_URL
    ▼
[Render.com]  ← Clara Backend (FastAPI, Python)
    │  Groq API (replaces Ollama in production)
    │  Supabase (already cloud)
    ▼
[Supabase]  ← Database (no change needed)
```

### What is NOT deployed
- **Ollama** — local LLM binary; replaced automatically by Groq in production
- **Verbi / Piper TTS** — optional local voice assistant; stays local-only

---

## Local Development (Single Terminal)

Instead of 4 terminals, run everything with one command:

```powershell
cd d:\fyp\repo
.\start-local.ps1
```

This starts all 4 services (Ollama, Clara Backend, Frontend, Verbi) with
colour-coded output. Press **Ctrl+C** to stop everything at once.

---

## Step 1 — Deploy Clara Backend to Render.com

### 1.1 Push to GitHub
Make sure `clara-backend/` (or the full repo) is pushed to GitHub.

### 1.2 Create a new Web Service on Render
1. Go to https://render.com → **New → Web Service**
2. Connect your GitHub repo
3. Set **Root Directory** to `clara-backend` (if deploying sub-folder)
4. Settings:
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements-prod.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`

### 1.3 Add Environment Variables in Render Dashboard
Go to **Environment** tab and add:

| Key | Value |
|---|---|
| `ENVIRONMENT` | `production` |
| `GROQ_API_KEY` | *(from d:\fyp\clarabackend.env)* |
| `GEMINI_API_KEY` | *(from d:\fyp\clarabackend.env)* |
| `SUPABASE_URL` | *(from d:\fyp\clarabackend.env)* |
| `SUPABASE_ANON_KEY` | *(from d:\fyp\clarabackend.env)* |
| `SUPABASE_SERVICE_KEY` | *(from d:\fyp\clarabackend.env)* |
| `RESEND_API_KEY` | *(from d:\fyp\clarabackend.env)* |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` |
| `VOICE_INPUT_ENABLED` | `false` |
| `SALES_AGENT_ENABLED` | `true` |
| `MARKETING_AGENT_ENABLED` | `true` |
| `SUPPORT_AGENT_ENABLED` | `false` |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` *(fill in after Vercel deploy)* |

### 1.4 Deploy
Click **Deploy**. Wait for build to finish (~3-5 min).
Your backend URL will be: `https://clara-backend.onrender.com` (or similar).

Test it: `https://clara-backend.onrender.com/health`

---

## Step 2 — Deploy TrendtialCRM Frontend to Vercel

### 2.1 Import project
1. Go to https://vercel.com → **Add New Project**
2. Import the GitHub repo
3. Set **Root Directory** to `trendtialcrm`
4. Framework preset: **Vite** (auto-detected)

### 2.2 Add Environment Variables in Vercel Dashboard
Go to **Settings → Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_CLARA_BACKEND_URL` | `https://clara-backend.onrender.com` *(your Render URL)* |
| `VITE_SUPABASE_URL` | `https://qgzngizgcdjomscontuk.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | *(from trendtialcrm.env)* |
| `VITE_SUPABASE_SERVICE_KEY` | *(from trendtialcrm.env)* |
| `VITE_GOOGLE_SHEETS_API_KEY` | *(from trendtialcrm.env, optional)* |
| `VITE_SHEET_ID` | *(from trendtialcrm.env, optional)* |

### 2.3 Deploy
Click **Deploy**. Build will run `npm run build` automatically.
Your frontend URL: `https://your-app.vercel.app`

### 2.4 Update CORS on Render
Go back to Render → Environment → update `ALLOWED_ORIGINS`:
```
https://your-app.vercel.app
```
Then **redeploy** the Render service (Manual Deploy → Deploy latest commit).

---

## How Ollama → Groq Switching Works

The file `clara-backend/utils/llm_helper.py` handles this automatically:

```
ENVIRONMENT=development → tries Ollama (localhost:11434) first
                         → falls back to Groq if Ollama is unreachable

ENVIRONMENT=production  → goes straight to Groq API (no Ollama probe)
```

All 7 marketing/support agent files now use `call_llm()` from this helper
instead of direct `requests.post(ollama_url, ...)` calls.

---

## Troubleshooting

### Backend fails to start on Render
- Check build logs for missing packages
- Ensure all required env vars are set

### Frontend can't reach backend (CORS error)
- Confirm `ALLOWED_ORIGINS` on Render matches your exact Vercel URL
- Re-deploy Render after changing env vars

### Groq errors in production
- Confirm `GROQ_API_KEY` starts with `gsk_` in Render env vars
- Check Groq rate limits: https://console.groq.com

### Voice features not working in production
- Expected — Verbi/Piper is local-only (requires audio hardware + 113MB model)
- Voice works normally in local dev via `start-local.ps1`
