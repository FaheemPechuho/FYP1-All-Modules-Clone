# 🎤 Voice Setup for Windows - Clara Backend

## 📋 Overview

Clara Backend integrates with **Verbi Voice Assistant** for STT/TTS capabilities. This requires several audio packages that can be tricky on Windows.

---

## ⚠️ PyAudio Installation on Windows

PyAudio is the **most problematic** package. Here are **3 methods** (try in order):

---

## 🚀 Method 1: Using pipwin (Recommended for Windows)

```bash
# Install pipwin first
pip install pipwin

# Install PyAudio using pipwin (downloads pre-compiled binaries)
pipwin install pyaudio
```

**This is the easiest method and works 90% of the time!**

---

## 🔧 Method 2: Direct pip install

```bash
pip install PyAudio
```

If you see **"Microsoft Visual C++ 14.0 is required"** error, try Method 3.

---

## 📦 Method 3: Manual wheel installation

If both methods above fail, download the pre-compiled wheel:

### **Step 1: Check your Python version**
```bash
python --version
# Example: Python 3.10.11
```

### **Step 2: Check if you have 32-bit or 64-bit Python**
```bash
python -c "import struct; print(struct.calcsize('P') * 8)"
# Output: 64 (means 64-bit) or 32 (means 32-bit)
```

### **Step 3: Download the correct wheel**

Visit: https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio

Download matching your Python version:
- **Python 3.10, 64-bit**: `PyAudio‑0.2.14‑cp310‑cp310‑win_amd64.whl`
- **Python 3.11, 64-bit**: `PyAudio‑0.2.14‑cp311‑cp311‑win_amd64.whl`
- **Python 3.9, 64-bit**: `PyAudio‑0.2.14‑cp39‑cp39‑win_amd64.whl`

### **Step 4: Install the wheel**
```bash
# Navigate to Downloads
cd %USERPROFILE%\Downloads

# Install (replace with your filename)
pip install PyAudio-0.2.14-cp310-cp310-win_amd64.whl
```

---

## 🎯 Complete Installation

After PyAudio is installed, install all other dependencies:

```bash
# Install all dependencies from requirements.txt
pip install -r requirements.txt
```

Or manually:

```bash
# Core voice packages
pip install sounddevice numpy soundfile pygame SpeechRecognition pydub keyboard

# TTS/STT Services
pip install elevenlabs cartesia

# Optional (if you want local LLM)
pip install ollama

# Other dependencies
pip install tqdm colorama
```

---

## ✅ Verify Installation

### **Test PyAudio:**
```bash
python -c "import pyaudio; print('PyAudio works!')"
```

### **Test all voice packages:**
```bash
python -c "import pyaudio, sounddevice, numpy, soundfile, pygame, speech_recognition; print('All voice packages installed!')"
```

### **List audio devices:**
```bash
python -c "import pyaudio; p = pyaudio.PyAudio(); [print(f'{i}: {p.get_device_info_by_index(i)[\"name\"]}') for i in range(p.get_device_count())]; p.terminate()"
```

---

## 📝 What Each Package Does

| Package | Purpose | Required? |
|---------|---------|-----------|
| **PyAudio** | Audio I/O (microphone/speakers) | ✅ Critical |
| **sounddevice** | Alternative audio library | ✅ Critical |
| **numpy** | Audio data processing | ✅ Critical |
| **soundfile** | Audio file I/O | ✅ Critical |
| **pygame** | Audio playback | ✅ Required |
| **SpeechRecognition** | STT wrapper | ✅ Required |
| **pydub** | Audio manipulation | ✅ Required |
| **keyboard** | Keyboard control | ⚠️ Optional |
| **elevenlabs** | ElevenLabs TTS API | ⚠️ Optional |
| **cartesia** | Cartesia TTS API | ⚠️ Optional |
| **ollama** | Local LLM support | ⚠️ Optional |

---

## 🚫 What's NOT Included

### **webrtcvad** - Voice Activity Detection
**Why removed?** Requires C++ compilation on Windows which often fails.

**Solution:** Clara uses **energy-based VAD** instead (no compilation needed, works out of the box).

---

## 🆘 Troubleshooting

### **Error: "Microsoft Visual C++ 14.0 is required"**
**Solution:** Use Method 1 (pipwin) or Method 3 (wheel file)

### **Error: "Could not find a version that satisfies the requirement"**
**Solution:** Check your Python version and download the correct wheel

### **Error: "No module named 'pyaudio'"**
**Solution:** Make sure you're in the correct virtual environment:
```bash
# Activate venv
venv\Scripts\activate

# Then install
pip install pyaudio
```

### **Error: "PortAudio library not found"**
**Solution:** PyAudio wasn't installed correctly. Try pipwin method.

### **Microphone not working**
**Solution:** 
1. Check Windows microphone permissions
2. Run device list command (see "Verify Installation" above)
3. Make sure microphone is not muted

---

## 🎤 Testing Voice Input/Output

### **Test Microphone:**
```python
import pyaudio
import numpy as np

p = pyaudio.PyAudio()
print(f"Found {p.get_device_count()} audio devices")
print("\nMicrophones:")
for i in range(p.get_device_count()):
    info = p.get_device_info_by_index(i)
    if info['maxInputChannels'] > 0:
        print(f"  {i}: {info['name']}")
p.terminate()
```

### **Test Speakers:**
```python
import numpy as np
import sounddevice as sd

# Generate a 1-second 440Hz tone (A note)
duration = 1
frequency = 440
sample_rate = 44100
t = np.linspace(0, duration, int(sample_rate * duration))
tone = 0.3 * np.sin(2 * np.pi * frequency * t)

print("Playing test tone...")
sd.play(tone, sample_rate)
sd.wait()
print("Done!")
```

---

## 🔄 Alternative: Skip Voice for Now

If you're having too much trouble with audio packages:

### **Option 1: Text-only mode**
Run clara-backend without voice features initially. Focus on:
- Text-based agent testing
- CRM integration
- Frontend development

Add voice later when you have more time.

### **Option 2: Use Docker**
Docker avoids Windows-specific issues entirely. We can set up a Docker container with all dependencies pre-installed.

### **Option 3: Linux/WSL2**
Use Windows Subsystem for Linux (WSL2) where audio packages install easily:
```bash
sudo apt-get install python3-pyaudio portaudio19-dev
pip install -r requirements.txt
```

---

## 📞 Need Help?

**Still stuck?** Share the error message in your team chat. Common issues:
- Missing Visual C++ Build Tools
- Wrong Python version
- 32-bit vs 64-bit mismatch
- Firewall blocking downloads

---

## ✅ Success Checklist

After setup, you should be able to:
- [ ] Import pyaudio without errors
- [ ] See list of audio devices
- [ ] Run `python main.py` without ModuleNotFoundError
- [ ] Record audio (if microphone connected)
- [ ] Play audio (if speakers connected)

---

**Good luck!** 🚀 Once this is set up, you won't need to touch it again!

---

**Aligned with**: `Verbi/requirements.txt` (v1.0)  
**Last Updated**: November 2025

