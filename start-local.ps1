# =============================================================================
# start-local.ps1 - Start all FYP services from ONE terminal
# Usage: cd d:\fyp\repo  then  .\start-local.ps1
# Ctrl+C stops all background jobs cleanly
# =============================================================================

$ErrorActionPreference = "Stop"

$ROOT     = $PSScriptRoot
$BACKEND  = Join-Path $ROOT "clara-backend"
$FRONTEND = Join-Path $ROOT "trendtialcrm"
$VERBI    = Join-Path $ROOT "Verbi"
$VENV_PY  = Join-Path $BACKEND "venv\Scripts\python.exe"
$VENV_UV  = Join-Path $BACKEND "venv\Scripts\uvicorn.exe"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  FYP LOCAL STARTER - all services in one terminal" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop everything" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

function Write-Tagged {
    param($tag, $color, $msg)
    Write-Host ("[$tag] " + $msg) -ForegroundColor $color
}

# 1. Ollama
Write-Tagged "OLLAMA" "Yellow" "Starting Ollama server..."
$ollamaJob = Start-Job -Name "Ollama" -ScriptBlock {
    & ollama serve 2>&1
}

# 2. Clara Backend
Write-Tagged "BACKEND" "Green" "Starting Clara Backend on :8001..."
$backendJob = Start-Job -Name "Backend" -ScriptBlock {
    param($dir, $uv)
    Set-Location $dir
    $env:PYTHONIOENCODING = 'utf-8'
    & $uv main:app --host 0.0.0.0 --port 8001 --log-level info 2>&1
} -ArgumentList $BACKEND, $VENV_UV

# 3. TrendtialCRM Frontend
Write-Tagged "FRONTEND" "Magenta" "Starting TrendtialCRM frontend on :8080..."
$frontendJob = Start-Job -Name "Frontend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    & npm run dev 2>&1
} -ArgumentList $FRONTEND

# 4. Verbi / Piper Server (optional)
Write-Tagged "VERBI" "Cyan" "Starting Verbi Piper TTS server on :5000..."
$verbiJob = Start-Job -Name "Verbi" -ScriptBlock {
    param($dir, $py)
    Set-Location $dir
    & $py piper_server.py 2>&1
} -ArgumentList $VERBI, $VENV_PY

Write-Host ""
Write-Host "All services started. Tailing logs (Ctrl+C to stop all)..." -ForegroundColor White
Write-Host ""

$colours = @{
    "Ollama"   = "Yellow"
    "Backend"  = "Green"
    "Frontend" = "Magenta"
    "Verbi"    = "Cyan"
}

$jobs = @($ollamaJob, $backendJob, $frontendJob, $verbiJob)

try {
    while ($true) {
        foreach ($job in $jobs) {
            $output = Receive-Job -Job $job -ErrorAction SilentlyContinue
            if ($output) {
                foreach ($line in $output) {
                    Write-Tagged $job.Name $colours[$job.Name] $line
                }
            }
        }
        Start-Sleep -Milliseconds 300
    }
}
finally {
    Write-Host ""
    Write-Host "Stopping all services..." -ForegroundColor Red
    foreach ($job in $jobs) {
        Stop-Job   -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
    }
    Write-Host "All services stopped." -ForegroundColor Red
}
