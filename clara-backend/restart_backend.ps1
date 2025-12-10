#!/usr/bin/env pwsh
# Backend Restart Script for Clara CRM
# This script stops the current backend and starts it with updated code

Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "  Clara Backend Restart Script" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Step 1: Find and stop existing backend process
Write-Host "[1/3] Checking for running backend..." -ForegroundColor Yellow

try {
    $connections = Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue
    
    if ($connections) {
        $pid = $connections[0].OwningProcess
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        
        if ($process) {
            Write-Host "      Found backend running (PID: $pid)" -ForegroundColor Green
            Write-Host "      Stopping process..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force
            Start-Sleep -Seconds 2
            Write-Host "      ✅ Backend stopped successfully" -ForegroundColor Green
        }
    } else {
        Write-Host "      No backend process found on port 8001" -ForegroundColor Gray
    }
} catch {
    Write-Host "      ⚠️  Could not check for existing process: $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Verify Ollama is running
Write-Host "[2/3] Verifying Ollama connection..." -ForegroundColor Yellow

try {
    $ollamaTest = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop
    
    if ($ollamaTest.StatusCode -eq 200) {
        Write-Host "      ✅ Ollama is running on port 11434" -ForegroundColor Green
        
        $models = ($ollamaTest.Content | ConvertFrom-Json).models
        Write-Host "      Available models:" -ForegroundColor Gray
        foreach ($model in $models) {
            Write-Host "        - $($model.name)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "      ❌ Ollama is NOT running!" -ForegroundColor Red
    Write-Host "      Please start Ollama first: ollama serve" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue anyway (will use fallback)"
}

Write-Host ""

# Step 3: Start backend
Write-Host "[3/3] Starting backend with updated code..." -ForegroundColor Yellow

$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path

try {
    Write-Host "      Working directory: $backendPath" -ForegroundColor Gray
    Write-Host "      Loading environment from: .env.husnain" -ForegroundColor Gray
    Write-Host ""
    Write-Host "      Starting Python server..." -ForegroundColor Green
    Write-Host "      (Press Ctrl+C to stop)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""
    
    # Start the backend
    Set-Location $backendPath
    python main.py
    
} catch {
    Write-Host ""
    Write-Host "      ❌ Failed to start backend: $_" -ForegroundColor Red
    exit 1
}
