# 🚀 Git Cheat Sheet - Quick Reference

## 🎯 Most Used Commands

### **Daily Workflow:**
```bash
# Start your day
git checkout main
git pull origin main

# Create/switch to your branch
git checkout -b feature/[agent]/[feature-name]

# Check what changed
git status

# Add files
git add .

# Commit
git commit -m "[PREFIX] Description"

# Push
git push origin feature/[agent]/[feature-name]
```

---

## 👥 By Team Member

### **Faheem (Sales):**
```bash
git checkout -b feature/sales/your-feature
git commit -m "[SALES] Your commit message"
git push origin feature/sales/your-feature
```

### **Sheryar (Marketing):**
```bash
git checkout -b feature/marketing/your-feature
git commit -m "[MARKETING] Your commit message"
git push origin feature/marketing/your-feature
```

### **Husnain (Support):**
```bash
git checkout -b feature/support/your-feature
git commit -m "[SUPPORT] Your commit message"
git push origin feature/support/your-feature
```

---

## 📝 Commit Message Prefixes

| Member | Prefixes |
|--------|----------|
| **Faheem** | `[SALES]` `[LEADS]` `[CRM]` `[INTEGRATION]` |
| **Sheryar** | `[MARKETING]` `[NOTIFICATIONS]` `[ANALYTICS]` |
| **Husnain** | `[SUPPORT]` `[ADMIN]` `[MEETINGS]` `[TODOS]` |
| **All** | `[FIX]` `[TEST]` `[DOCS]` `[ORCHESTRATOR]` |

---

## 🔧 Essential Git Commands

### **Setup (Once):**
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### **Clone Repository:**
```bash
git clone https://github.com/sheryarkayani/trendtialcrm.git
cd trendtialcrm
```

### **Branches:**
```bash
git branch                    # List branches
git branch -a                 # List all (including remote)
git checkout main             # Switch to main
git checkout -b new-branch    # Create new branch
git branch -d old-branch      # Delete branch
```

### **Staging & Committing:**
```bash
git status                    # What changed?
git diff                      # See changes
git add file.tsx             # Stage specific file
git add .                    # Stage all changes
git commit -m "message"      # Commit
git commit --amend           # Edit last commit
```

### **Syncing:**
```bash
git pull origin main         # Get latest from main
git push origin branch-name  # Push your changes
git fetch                    # Check for updates
```

### **Undo Changes:**
```bash
git checkout -- file.tsx     # Discard file changes
git reset HEAD file.tsx      # Unstage file
git reset --soft HEAD~1      # Undo last commit (keep changes)
git reset --hard HEAD~1      # Undo last commit (⚠️ lose changes)
```

---

## 🆘 Emergency Fixes

### **Made changes on wrong branch:**
```bash
git stash                    # Save changes
git checkout correct-branch  # Switch
git stash pop               # Restore changes
```

### **Need to start over:**
```bash
git checkout main
git reset --hard origin/main
```

### **Merge conflict:**
```bash
git status                   # See conflicts
# Edit files to resolve
git add resolved-file.tsx
git commit -m "[FIX] Resolve conflict"
```

---

## ✅ Daily Checklist

- [ ] `git pull origin main` (morning)
- [ ] Work on feature branch (not main!)
- [ ] `git status` (check changes)
- [ ] `git add .` (stage changes)
- [ ] `git commit -m "[PREFIX] Message"` (commit)
- [ ] `git push` (push changes)
- [ ] Update team in group chat

---

## 🚫 DON'T DO THIS

❌ `git push --force`  
❌ Commit to `main` directly  
❌ `git reset --hard` (unless sure)  
❌ Commit passwords or API keys  
❌ Large binary files (>10MB)  

---

## 📞 Get Help

**Stuck?** Ask in team group!  
**Conflict?** Call Faheem  
**Lost changes?** Don't panic, ask first!  

---

**Print this or keep it open while coding!** 🖨️

