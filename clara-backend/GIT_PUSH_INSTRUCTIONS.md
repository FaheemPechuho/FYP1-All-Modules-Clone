# Git Push Instructions - After Removing Large File

## ✅ Status

The large file (`en_US-lessac-high.onnx`) has been:
- ✅ Removed from Git tracking
- ✅ Added to `.gitignore`
- ✅ Removed from commit history using `git filter-branch`

## 🚀 Next Steps

### Option 1: Force Push (If you're the only one working on this repo)

Since we rewrote Git history, you need to force push:

```bash
git push origin main --force
```

**⚠️ WARNING:** Force push rewrites history on GitHub. Only do this if:
- You're the only one working on this repository, OR
- You've coordinated with your team

### Option 2: Create New Branch (Safer)

If others might be using the repo:

```bash
# Create a new branch without the large file
git checkout -b main-clean
git push origin main-clean

# Then merge or replace main later
```

### Option 3: Reset and Re-apply (If force push fails)

If force push is blocked:

```bash
# Create a new orphan branch
git checkout --orphan main-new
git add .
git commit -m "Initial commit without large files"
git branch -D main
git branch -m main
git push origin main --force
```

---

## ✅ Verification

Before pushing, verify the file is gone:

```bash
# Check current commit doesn't have the file
git ls-tree -r HEAD --name-only | findstr onnx
# Should return nothing

# Check file size in commits
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | findstr "108"
# Should not show the large file
```

---

## 📝 What Happened

1. **Removed file from tracking**: `git rm --cached`
2. **Added to .gitignore**: Prevents future tracking
3. **Removed from history**: `git filter-branch` rewrote all commits
4. **Cleaned up**: Removed backup refs and garbage collected

---

## 🎯 Current State

- ✅ File removed from all commits
- ✅ File still exists locally (for your use)
- ✅ File is in `.gitignore` (won't be tracked)
- ✅ Ready to push (with force if needed)

---

## 💡 For Future Reference

**To avoid this in the future:**
1. Always add large files to `.gitignore` BEFORE committing
2. Use Git LFS for large files if you need them in the repo
3. Check file sizes before committing: `git add` will warn about large files

---

## 🚨 If Push Still Fails

If you still get errors after force push:

1. **Check for other large files:**
   ```bash
   git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | findstr "blob" | sort -k3 -n -r | Select-Object -First 10
   ```

2. **Use Git LFS for large files:**
   ```bash
   git lfs install
   git lfs track "*.onnx"
   git add .gitattributes
   ```

3. **Contact GitHub Support** if the file is stuck in their system

