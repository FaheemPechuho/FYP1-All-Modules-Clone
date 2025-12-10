# Git Pull Helper Script
# This script will fetch, check for conflicts, and pull changes

# Disable git pager
$env:GIT_PAGER = "cat"

Write-Host "=== Checking Git Status ===" -ForegroundColor Cyan
$status = git status --porcelain 2>&1

if ($status) {
    Write-Host "`nYou have uncommitted changes:" -ForegroundColor Yellow
    git status --short
    Write-Host "`n=== Stashing Local Changes ===" -ForegroundColor Cyan
    git stash push -m "Auto-stash before pull - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
}

Write-Host "`n=== Fetching from Remote ===" -ForegroundColor Cyan
git fetch origin

Write-Host "`n=== Checking for Incoming Changes ===" -ForegroundColor Cyan
$behindCount = git rev-list HEAD..origin/main --count 2>&1
if ($behindCount -and $behindCount -ne "0") {
    Write-Host "There are $behindCount commit(s) to pull" -ForegroundColor Green
    
    Write-Host "`n=== Files that will change ===" -ForegroundColor Cyan
    git diff --name-status HEAD origin/main
    
    Write-Host "`n=== Pulling Changes ===" -ForegroundColor Cyan
    git pull origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nPull successful!" -ForegroundColor Green
        
        if ($status) {
            Write-Host "`n=== Reapplying Your Local Changes ===" -ForegroundColor Cyan
            $stashPop = git stash pop 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Local changes reapplied successfully!" -ForegroundColor Green
                Write-Host "`nFinal Status:" -ForegroundColor Cyan
                git status --short
            } else {
                Write-Host "CONFLICT DETECTED while reapplying changes!" -ForegroundColor Red
                Write-Host $stashPop
                Write-Host "`nTo resolve:" -ForegroundColor Yellow
                Write-Host "1. Fix the conflicts in the files listed above"
                Write-Host "2. Run: git add <resolved-files>"
                Write-Host "3. Run: git stash drop (after resolving)"
            }
        }
    } else {
        Write-Host "Pull failed!" -ForegroundColor Red
    }
} else {
    Write-Host "Already up to date with origin/main" -ForegroundColor Green
    if ($status) {
        Write-Host "`n=== Restoring Your Changes ===" -ForegroundColor Cyan
        git stash pop
    }
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan

