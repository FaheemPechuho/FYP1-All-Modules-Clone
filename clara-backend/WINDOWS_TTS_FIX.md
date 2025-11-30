# 🪟 Windows TTS Installation Fix

## Problem: MeloTTS Build Error on Windows

The `melotts` package has build issues on Windows. Here are **3 working solutions**:

---

## ✅ **Solution 1: Use Piper (Recommended for Windows)** ⭐

**Piper is the easiest option on Windows** - just download a binary, no compilation needed!

### Step 1: Download Piper Binary

1. **Download Piper for Windows**:
   - Go to: https://github.com/rhasspy/piper/releases
   - Download: `piper_windows_amd64.zip` (or `piper_windows_arm64.zip` for ARM)
   - Extract to: `Verbi/piper/` folder

2. **Download Voice Model**:
   - Go to: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US
   - Download: `en_US-lessac-medium.onnx` (or any English voice you prefer)
   - Place in: `Verbi/` folder (same directory as `piper_server.py`)

### Step 2: Update Piper Server Config

Edit `Verbi/piper_server.py`:

```python
piper_executable = "./piper/piper.exe"  # Windows: .exe extension
model_path = "en_US-lessac-medium.onnx"  # Your voice model file
```

### Step 3: Start Piper Server

```bash
cd Verbi
python piper_server.py
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:5000
```

### Step 4: Update Configuration

Edit `clara-backend/.env`:
```env
TTS_MODEL=piper
```

Edit `Verbi/voice_assistant/config.py` (add these lines if missing):
```python
PIPER_SERVER_URL = os.getenv("PIPER_SERVER_URL", "http://localhost:5000")
PIPER_OUTPUT_FILE = "output.wav"
```

**Done!** ✅ Test with: `python test_voice_manual.py`

---

## ✅ **Solution 2: Install MeloTTS from GitHub (Alternative)**

If you really want MeloTTS, try installing directly from GitHub:

```bash
# Install dependencies first
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

# Try installing from GitHub (might work better)
pip install git+https://github.com/myshell-ai/MeloTTS.git

# Or install specific dependencies manually
pip install Cython numpy scipy librosa phonemizer
pip install git+https://github.com/myshell-ai/MeloTTS.git
```

**Note**: This may still fail on Windows. Piper is more reliable.

---

## ✅ **Solution 3: Use Coqui TTS (Windows-Friendly)**

Coqui TTS has better Windows support:

```bash
# Install Coqui TTS
pip install TTS

# Then you'll need to modify the TTS code to use Coqui
# See: https://github.com/coqui-ai/TTS
```

**Note**: Requires code changes to integrate.

---

## 🎯 **Recommended: Use Piper on Windows**

**Why Piper?**
- ✅ **No compilation** - just download binary
- ✅ **Fast** - generates audio in ~0.5 seconds
- ✅ **Lightweight** - ~50MB total
- ✅ **Already integrated** in your codebase
- ✅ **Works perfectly on Windows**

---

## 📋 **Quick Piper Setup (Copy-Paste)**

```bash
# 1. Create piper folder
cd Verbi
mkdir piper

# 2. Download piper.exe from:
#    https://github.com/rhasspy/piper/releases
#    Extract to: Verbi/piper/piper.exe

# 3. Download voice model from:
#    https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US
#    Save as: Verbi/en_US-lessac-medium.onnx

# 4. Update Verbi/piper_server.py:
#    piper_executable = "./piper/piper.exe"
#    model_path = "en_US-lessac-medium.onnx"

# 5. Start server
python piper_server.py

# 6. Update .env
#    TTS_MODEL=piper

# 7. Test
cd ../clara-backend
python test_voice_manual.py
```

---

## 🔍 **Verify Installation**

### Check Piper Server:
```bash
# In Verbi directory
python piper_server.py
# Should see: "Uvicorn running on http://0.0.0.0:5000"
```

### Test TTS:
```bash
# In clara-backend directory
python test_voice_manual.py
# Should hear voice output!
```

---

## 🐛 **Troubleshooting**

### Issue: "Piper binary not found"
**Solution**: 
- Make sure `piper.exe` is in `Verbi/piper/` folder
- Check path in `piper_server.py` is correct

### Issue: "Model file not found"
**Solution**:
- Download `.onnx` voice model
- Place in `Verbi/` folder (same as `piper_server.py`)
- Update `model_path` in `piper_server.py`

### Issue: "Port 5000 already in use"
**Solution**:
- Change port in `piper_server.py`: `uvicorn.run(app, host="0.0.0.0", port=5001)`
- Update `PIPER_SERVER_URL` in config to match

---

## 📊 **Comparison: MeloTTS vs Piper on Windows**

| Feature | MeloTTS | Piper |
|---------|---------|-------|
| **Windows Support** | ❌ Build issues | ✅ Perfect |
| **Installation** | ❌ Complex | ✅ Easy (binary) |
| **Setup Time** | 30+ min | 5 min |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **File Size** | ~500MB | ~50MB |

**Winner for Windows: Piper!** 🏆

---

## ✅ **Next Steps**

1. **Download Piper binary** (5 min)
2. **Download voice model** (2 min)
3. **Update config** (1 min)
4. **Start server** (instant)
5. **Test** (instant)

**Total time: ~10 minutes** vs 30+ minutes for MeloTTS troubleshooting!

---

**Status**: ✅ **Piper is the best solution for Windows!**

