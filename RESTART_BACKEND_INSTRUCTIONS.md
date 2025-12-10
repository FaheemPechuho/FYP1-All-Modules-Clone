# 🔄 Backend Restart Instructions

## Issue
The backend is currently running with old code that doesn't have the Ollama integration. You need to restart it to load the updated `content_generator.py`.

## Current Status
- ✅ Ollama is running correctly (tested and verified)
- ✅ Code has been updated to use Ollama
- ⚠️ Backend server (PID 22936) is running old code

## Solution: Restart the Backend

### Option 1: Stop and Restart (Recommended)

1. **Stop the current backend process:**
   ```powershell
   # Find the process
   Get-Process python | Where-Object {$_.Id -eq 22936}
   
   # Stop it
   Stop-Process -Id 22936 -Force
   ```

2. **Start the backend with updated code:**
   ```powershell
   cd "d:\BS SE\FYP\FYP1-All-Modules-Clone\clara-backend"
   
   # Activate your virtual environment (if using one)
   # .\venv\Scripts\Activate.ps1
   
   # Start the backend
   python main.py
   ```

### Option 2: Quick Restart Script

Create a file `restart_backend.ps1`:
```powershell
# Stop existing backend
$process = Get-Process python -ErrorAction SilentlyContinue | Where-Object {
    (Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue).OwningProcess -contains $_.Id
}

if ($process) {
    Write-Host "Stopping backend (PID: $($process.Id))..."
    Stop-Process -Id $process.Id -Force
    Start-Sleep -Seconds 2
}

# Start backend
Write-Host "Starting backend..."
cd "d:\BS SE\FYP\FYP1-All-Modules-Clone\clara-backend"
python main.py
```

Then run:
```powershell
.\restart_backend.ps1
```

### Option 3: Manual Terminal Restart

1. Find the terminal/console where the backend is running
2. Press `Ctrl+C` to stop it
3. Run again:
   ```bash
   python main.py
   ```

## Verification

After restarting, check the logs for:
```
✅ Ollama initialized with model: llama3.1
```

Then test in the UI:
1. Go to Marketing Hub → Content Studio
2. Generate any content
3. You should see: "Content generated via Clara Agent (Ollama - Local LLM)"

## Troubleshooting

### If Ollama still not detected:

1. **Check environment variables are loaded:**
   ```python
   # In Python console
   import os
   from dotenv import load_dotenv
   load_dotenv('.env.husnain')
   print(os.getenv('OLLAMA_API_URL'))
   print(os.getenv('OLLAMA_MODEL_NAME'))
   ```

2. **Check backend logs:**
   Look for warnings like:
   - "⚠️ Ollama not available (connection error)"
   - "⚠️ Ollama timeout"
   - "⚠️ Ollama check failed"

3. **Verify Ollama is running:**
   ```powershell
   curl http://localhost:11434/api/tags
   ```

### If you see "Using Direct Gemini API":

This means the backend couldn't connect to Ollama. Check:
- Is Ollama service running? (`ollama serve`)
- Is port 11434 accessible?
- Are there firewall issues?

## Expected Behavior After Restart

✅ **Backend startup logs should show:**
```
INFO:content_generator:✅ Ollama initialized with model: llama3.1
INFO:content_generator:ContentGenerator initialized with Ollama (llama3.1)
```

✅ **UI should show:**
- Badge: "Powered by Ollama - Local AI"
- Status: "Clara Agent connected (Ollama - Local LLM)"
- Toast: "Content generated via Clara Agent (Ollama - Local LLM)"

❌ **If you still see:**
- "Using Direct Gemini API (Ollama backend unavailable)"
- "Powered by LangChain + Google Gemini AI"

Then the backend is still running old code or Ollama connection is failing.
