# 🎤 Free & Open-Source TTS Setup Guide

## ⚠️ **Windows Users: Read This First!**

**MeloTTS has build issues on Windows.** If you're on Windows, use **Piper** instead (much easier - just download a binary, no compilation needed).

**Quick Windows Setup:**
```bash
python scripts/setup_piper_windows.py
```

See `WINDOWS_TTS_FIX.md` for detailed Windows instructions.

---

## Overview

This guide helps you switch from **Cartesia** (limited free tokens) to **unlimited open-source TTS** solutions.

---

## 📊 TTS Options Comparison

### ✅ **Recommended: MeloTTS** ⭐

| Feature | MeloTTS | Piper | Coqui TTS |
|---------|---------|-------|-----------|
| **Quality** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Speed** | ⭐⭐⭐ Fast | ⭐⭐⭐⭐⭐ Very Fast | ⭐⭐⭐ Moderate |
| **Setup** | ⭐⭐⭐⭐ Easy | ⭐⭐⭐ Moderate | ⭐⭐ Complex |
| **Languages** | 10+ languages | 20+ languages | 1000+ languages |
| **Voice Options** | Multiple accents | Multiple voices | Many voices |
| **Already Integrated** | ✅ Yes | ✅ Yes | ❌ No |
| **GPU Support** | ✅ Yes (CUDA/MPS) | ❌ CPU only | ✅ Yes |
| **File Size** | ~500MB | ~50MB | ~1GB+ |
| **Best For** | **Production quality** | **Fast & lightweight** | Research |

---

## 🎯 **Recommendation: Use MeloTTS**

**Why MeloTTS?**
- ✅ **Already integrated** in your codebase
- ✅ **High quality** voice synthesis
- ✅ **Unlimited usage** (completely free)
- ✅ **GPU acceleration** (faster on good hardware)
- ✅ **Multiple accents** (EN-US, EN-BR, EN-AU, etc.)
- ✅ **Easy setup** (just install Python package)

---

## 🚀 **Quick Setup: MeloTTS**

### ⚠️ **Windows Users: Skip to Piper Section Below!**

MeloTTS has build issues on Windows. Use **Piper** instead (see Solution 2 below).

### Step 1: Install MeloTTS (Linux/Mac only)

```bash
# Activate your virtual environment
cd clara-backend
source venv/bin/activate  # Linux/Mac

# Install MeloTTS
pip install melotts
```

**Note**: MeloTTS requires PyTorch. If you don't have it:
```bash
# For CPU only
pip install torch torchaudio

# For GPU (CUDA) - if you have NVIDIA GPU
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Windows Alternative**: If you really want MeloTTS on Windows, try:
```bash
pip install git+https://github.com/myshell-ai/MeloTTS.git
```
But **Piper is much easier on Windows!**

### Step 2: Start MeloTTS Server

The codebase already has a FastAPI server for MeloTTS. Start it:

```bash
# Navigate to Verbi directory
cd ..\Verbi

# Start the MeloTTS server
python voice_assistant\local_tts_api.py
```

**Expected Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5150
```

**Keep this terminal open!** The server must be running for TTS to work.

### Step 3: Update Configuration

Edit your `.env` file in `clara-backend`:

```env
# Change from:
TTS_MODEL=cartesia
CARTESIA_API_KEY=your_key_here

# To:
TTS_MODEL=melotts
# CARTESIA_API_KEY is no longer needed
```

### Step 4: Test It!

```bash
cd clara-backend
python test_voice_manual.py
```

**Expected**: Voice output should work without any API limits! 🎉

---

## 🔧 **Alternative: Piper (Faster, Lighter, Windows-Friendly!)** ⭐

**Piper is the BEST option for Windows users!** No compilation needed - just download a binary.

If you want a **faster, lighter** option, or if you're on **Windows**:

### Step 1: Download Piper

**Windows Users: Use the automated setup script!**
```bash
cd clara-backend
python scripts/setup_piper_windows.py
```

**Or manual setup:**

1. **Download Piper Binary**:
   - Go to: https://github.com/rhasspy/piper/releases
   - **Windows**: Download `piper_windows_amd64.zip` (or `piper_windows_arm64.zip` for ARM)
   - **Linux**: Download `piper_linux_amd64.tar.gz`
   - **Mac**: Download `piper_darwin_amd64.tar.gz`
   - Extract to `Verbi/piper/` folder
   - **Windows**: Make sure it's named `piper.exe`

2. **Download Voice Model**:
   - Go to: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US
   - Download: `en_US-lessac-medium.onnx` (or any English voice you prefer)
   - Place in `Verbi/` folder (same directory as `piper_server.py`)

### Step 2: Update Piper Server Config

The `piper_server.py` file has been updated to automatically detect Windows and use `.exe` extension.

**Manual check** (if needed): The code now automatically handles Windows:
- Windows: uses `./piper/piper.exe`
- Linux/Mac: uses `./piper/piper`

```python
model_path = "en_US-lessac-medium.onnx"  # Path to your voice model
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

Edit `Verbi/voice_assistant/config.py`:

```python
TTS_MODEL = 'piper'  # Change from 'cartesia'
```

And add to `Verbi/voice_assistant/config.py`:

```python
PIPER_SERVER_URL = os.getenv("PIPER_SERVER_URL", "http://localhost:5000")
PIPER_OUTPUT_FILE = "output.wav"
```

Update `.env`:
```env
TTS_MODEL=piper
PIPER_SERVER_URL=http://localhost:5000
```

---

## 📝 **Configuration Files to Update**

### 1. `clara-backend/.env`

```env
# TTS Configuration
TTS_MODEL=melotts  # or 'piper'
# CARTESIA_API_KEY=  # No longer needed!
```

### 2. `Verbi/voice_assistant/config.py` (if using Piper)

```python
TTS_MODEL = 'piper'  # or 'melotts'
PIPER_SERVER_URL = os.getenv("PIPER_SERVER_URL", "http://localhost:5000")
PIPER_OUTPUT_FILE = "output.wav"
```

---

## 🎛️ **MeloTTS Voice Options**

MeloTTS supports multiple accents. Edit `Verbi/voice_assistant/local_tts_generation.py`:

```python
# Available accents:
# - EN-US (US English) - Default
# - EN-BR (British English)
# - EN-AU (Australian English)
# - EN-IND (Indian English)
# - ES (Spanish)
# - FR (French)
# - ZH (Chinese)
# - JP (Japanese)
# - KR (Korean)

generate_audio_file_melotts(
    text="Hello, how can I help you?",
    language="EN",
    accent="EN-US",  # Change this!
    speed=1.0,
    filename="output.wav"
)
```

---

## ⚡ **Performance Tips**

### MeloTTS:
- **First run**: Slower (model loading)
- **Subsequent runs**: Fast (~1-2 seconds for short text)
- **GPU**: 5-10x faster if you have CUDA/MPS

### Piper:
- **Always fast**: ~0.5-1 second
- **CPU only**: No GPU needed
- **Lightweight**: Low memory usage

---

## 🐛 **Troubleshooting**

### Issue: "ModuleNotFoundError: No module named 'melo'"

**Solution:**
```bash
pip install melotts
```

### Issue: "Connection refused" when using MeloTTS

**Solution:**
1. Make sure `local_tts_api.py` is running
2. Check it's on port `5150`
3. Verify firewall isn't blocking

### Issue: "Piper binary not found"

**Solution:**
1. Download Piper from: https://github.com/rhasspy/piper/releases
2. Extract to `Verbi/piper/`
3. Update path in `piper_server.py`

### Issue: "Model file not found" (Piper)

**Solution:**
1. Download voice model from: https://github.com/rhasspy/piper?tab=readme-ov-file#voices
2. Place `.onnx` file in `Verbi/` folder
3. Update `model_path` in `piper_server.py`

### Issue: Slow TTS generation

**Solutions:**
- **MeloTTS**: Install GPU version of PyTorch for 5-10x speedup
- **Piper**: Already fast, but you can use smaller voice models
- **Both**: Close other applications to free up CPU/RAM

---

## 🔄 **Switching Between TTS Models**

You can easily switch between models by changing `TTS_MODEL` in `.env`:

```env
# Use MeloTTS
TTS_MODEL=melotts

# Use Piper
TTS_MODEL=piper

# Use Cartesia (if you have tokens)
TTS_MODEL=cartesia
```

**No code changes needed!** The system automatically uses the correct TTS engine.

---

## 📊 **Comparison: Cartesia vs MeloTTS vs Piper**

| Feature | Cartesia | MeloTTS | Piper |
|---------|----------|---------|-------|
| **Cost** | ❌ Limited free | ✅ Unlimited | ✅ Unlimited |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Setup** | ✅ Easy | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Internet** | ✅ Required | ❌ Offline | ❌ Offline |
| **Streaming** | ✅ Yes | ❌ No | ❌ No |
| **Interruption** | ✅ Yes | ⚠️ Limited | ⚠️ Limited |

**Note**: MeloTTS and Piper don't support streaming interruption like Cartesia. However, they generate audio files quickly, so the delay is minimal.

---

## ✅ **Quick Start Checklist**

- [ ] Install MeloTTS: `pip install melotts`
- [ ] Start MeloTTS server: `python Verbi/voice_assistant/local_tts_api.py`
- [ ] Update `.env`: `TTS_MODEL=melotts`
- [ ] Test: `python test_voice_manual.py`
- [ ] Verify: Voice output works without API limits! 🎉

---

## 🎯 **Recommended Setup**

**For Production:**
- Use **MeloTTS** (best quality)
- Run server in background or as service
- Use GPU if available

**For Development:**
- Use **Piper** (faster, lighter)
- Quick testing and iteration
- Lower resource usage

**For Best of Both:**
- Keep both installed
- Switch via `.env` as needed
- Use MeloTTS for demos, Piper for testing

---

## 📚 **Additional Resources**

- **MeloTTS Docs**: https://github.com/myshell-ai/MeloTTS
- **Piper Docs**: https://github.com/rhasspy/piper
- **Coqui TTS** (if you want to add it): https://github.com/coqui-ai/TTS

---

## 🚀 **Next Steps**

1. **Install MeloTTS** (recommended)
2. **Start the server**
3. **Update `.env`**
4. **Test voice output**
5. **Enjoy unlimited TTS!** 🎉

---

**Status**: ✅ Ready to use  
**Cost**: 💰 **FREE** (unlimited)  
**Quality**: ⭐⭐⭐⭐⭐ Excellent

