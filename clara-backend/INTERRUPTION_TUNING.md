# 🎤 Interruption System Tuning Guide

## ✅ Recent Improvements

The interruption system has been made **more sensitive** to detect speech more easily:

### Changes Made:
1. **Lowered Aggressiveness**: `3` → `1` (more sensitive to softer speech)
2. **Faster Detection**: `8 frames` → `5 frames` (detects speech sooner)
3. **Lower Energy Threshold**: `500` → `300` (more sensitive to speech volume)
4. **Better Initialization**: Added 200ms delay for VAD calibration
5. **Improved Error Handling**: Better handling of interruption signals

### Current Settings:
```python
VADDetector(
    sample_rate=16000,
    frame_duration_ms=30,
    aggressiveness=1,              # More sensitive (was 3)
    speech_frames_threshold=5,     # Faster detection (was 8)
    energy_threshold=300           # Lower threshold (was 500)
)
```

## 🔧 How to Adjust Sensitivity

If you still need to adjust the sensitivity, edit `clara-backend/input_streams/voice_stream.py` around line 58:

### Make it MORE Sensitive (easier to interrupt):
```python
self.vad_detector = VADDetector(
    sample_rate=16000,
    frame_duration_ms=30,
    aggressiveness=0,              # Even more sensitive
    speech_frames_threshold=3,      # Very fast detection
    energy_threshold=200            # Very low threshold
)
```

### Make it LESS Sensitive (fewer false positives):
```python
self.vad_detector = VADDetector(
    sample_rate=16000,
    frame_duration_ms=30,
    aggressiveness=2,              # Less sensitive
    speech_frames_threshold=7,      # More frames needed
    energy_threshold=400            # Higher threshold
)
```

## 📊 Parameter Guide

### `aggressiveness` (0-3)
- **0**: Very sensitive (detects even soft speech, may have false positives)
- **1**: Sensitive ⭐ **Current setting**
- **2**: Moderate (balanced)
- **3**: Less sensitive (only loud speech, fewer false positives)

### `speech_frames_threshold` (3-15)
- **Lower (3-5)**: Faster interruption, may have false positives
- **Medium (5-8)**: Balanced ⭐ **Current: 5**
- **Higher (10-15)**: More reliable, but delayed response

### `energy_threshold` (100-1000)
- **Lower (100-300)**: More sensitive ⭐ **Current: 300**
- **Medium (300-500)**: Balanced
- **Higher (500-1000)**: Less sensitive, needs louder speech

## 🧪 Testing Interruption

1. **Start the conversation**:
   ```bash
   python test_voice_manual.py
   ```

2. **Test interruption**:
   - Wait for agent to start speaking
   - Speak at **normal volume** (you shouldn't need to shout)
   - Agent should stop within 100-300ms

3. **If it doesn't work**:
   - Check logs for "VAD monitoring active" message
   - Check logs for "User interruption detected" message
   - Try speaking slightly louder
   - Adjust settings if needed (see above)

## 🐛 Troubleshooting

### Issue: Still need to speak very loudly
**Solution**: Lower the settings further:
- Set `aggressiveness=0`
- Set `speech_frames_threshold=3`
- Set `energy_threshold=200`

### Issue: Too many false interruptions
**Solution**: Increase the settings:
- Set `aggressiveness=2`
- Set `speech_frames_threshold=7`
- Set `energy_threshold=400`

### Issue: Agent doesn't stop when I interrupt
**Possible causes**:
1. VAD not detecting speech (adjust sensitivity)
2. Interruption signal not reaching TTS (check logs)
3. TTS not checking for interruption (should be automatic)

**Check logs for**:
- "VAD monitoring active" - confirms VAD started
- "User interruption detected" - confirms speech detected
- "TTS interrupted" - confirms TTS received signal

## 📝 How It Works

1. **VAD Monitoring Starts**: Before TTS begins speaking
2. **Speech Detection**: VAD monitors microphone in real-time
3. **Interruption Triggered**: When 5 consecutive speech frames detected
4. **Signal Sent**: Interruption handler sets flag
5. **TTS Checks**: Cartesia TTS checks flag between audio chunks
6. **TTS Stops**: Generator breaks, audio stream stops
7. **User Speech Captured**: System automatically records your interruption

## 💡 Tips

1. **Speak clearly** - Don't mumble when interrupting
2. **Normal volume** - You shouldn't need to shout
3. **Wait for agent to start** - VAD is only active during TTS
4. **Check environment** - Quiet room works best
5. **Microphone quality** - Better mic = better detection

## 🔍 Debug Mode

To see more detailed VAD information, the system logs:
- Energy levels vs threshold
- Speech frame detection
- Interruption triggers

Watch the console output when testing to see what's happening.

---

**Current settings should work well for most users. Adjust only if needed!**

