"""
Voice Activity Detection (VAD) Module

Detects when the user starts speaking during TTS playback.
Uses energy-based VAD (no C++ compilation required).
"""

import pyaudio
import numpy as np
import collections
import logging
import threading
import time

class VADDetector:
    """
    Voice Activity Detector using WebRTC VAD.
    Monitors audio input and detects when user starts speaking.
    """
    
    def __init__(self, 
                 sample_rate=16000,
                 frame_duration_ms=30,
                 aggressiveness=3,
                 speech_frames_threshold=10,
                 energy_threshold=500):
        """
        Initialize VAD detector (energy-based, no compilation needed).
        
        Args:
            sample_rate: Audio sample rate (Hz)
            frame_duration_ms: Frame duration (ms)
            aggressiveness: VAD aggressiveness (0-3, higher = stricter)
                           Maps to energy threshold multiplier
            speech_frames_threshold: Number of consecutive speech frames to trigger
            energy_threshold: Base energy threshold for speech detection
        """
        self.sample_rate = sample_rate
        self.frame_duration_ms = frame_duration_ms
        self.aggressiveness = aggressiveness
        self.speech_frames_threshold = speech_frames_threshold
        
        # Calculate frame size
        self.frame_size = int(sample_rate * frame_duration_ms / 1000)
        self.bytes_per_frame = self.frame_size * 2  # 16-bit audio
        
        # Energy-based VAD threshold (adjust based on aggressiveness)
        # Higher aggressiveness = higher threshold = less sensitive
        self.energy_threshold = energy_threshold * (1 + aggressiveness * 0.5)
        
        # Audio setup
        self.audio = None
        self.stream = None
        
        # Detection state
        self.is_monitoring = False
        self.monitoring_thread = None
        self.speech_detected_callback = None
        
        # Ring buffer for speech detection
        self.speech_frames = collections.deque(maxlen=30)
        
        # Calibration for ambient noise
        self.ambient_energy = 0
        self.calibrated = False
        
        logging.info(f"VADDetector initialized: rate={sample_rate}Hz, "
                    f"frame={frame_duration_ms}ms, aggressiveness={aggressiveness}, "
                    f"energy_threshold={self.energy_threshold:.1f}")
    
    def start_monitoring(self, speech_detected_callback):
        """
        Start monitoring for voice activity.
        
        Args:
            speech_detected_callback: Function to call when speech is detected
        """
        if self.is_monitoring:
            logging.warning("VAD monitoring already active")
            return
        
        self.speech_detected_callback = speech_detected_callback
        self.is_monitoring = True
        
        # Start monitoring thread
        self.monitoring_thread = threading.Thread(
            target=self._monitoring_loop,
            daemon=True,
            name="VADMonitoringThread"
        )
        self.monitoring_thread.start()
        logging.info("VAD monitoring started")
    
    def stop_monitoring(self):
        """Stop monitoring for voice activity."""
        if not self.is_monitoring:
            return
        
        self.is_monitoring = False
        
        # Only join if we're not calling from within the monitoring thread itself
        if self.monitoring_thread and threading.current_thread() != self.monitoring_thread:
            self.monitoring_thread.join(timeout=1.0)
        
        self._close_stream()
        logging.info("VAD monitoring stopped")
    
    def _open_stream(self):
        """Open audio input stream."""
        try:
            self.audio = pyaudio.PyAudio()
            self.stream = self.audio.open(
                format=pyaudio.paInt16,
                channels=1,
                rate=self.sample_rate,
                input=True,
                frames_per_buffer=self.frame_size,
                stream_callback=None
            )
            logging.debug("VAD audio stream opened")
        except Exception as e:
            logging.error(f"Failed to open VAD audio stream: {e}")
            raise
    
    def _close_stream(self):
        """Close audio input stream."""
        try:
            if self.stream:
                self.stream.stop_stream()
                self.stream.close()
                self.stream = None
            
            if self.audio:
                self.audio.terminate()
                self.audio = None
            
            logging.debug("VAD audio stream closed")
        except Exception as e:
            logging.error(f"Error closing VAD stream: {e}")
    
    def _calculate_energy(self, audio_data):
        """Calculate energy of audio frame."""
        try:
            # Convert bytes to numpy array
            audio_array = np.frombuffer(audio_data, dtype=np.int16)
            # Calculate RMS energy
            energy = np.sqrt(np.mean(audio_array.astype(np.float32) ** 2))
            return energy
        except Exception as e:
            logging.debug(f"Error calculating energy: {e}")
            return 0
    
    def _calibrate_ambient_noise(self, num_frames=10):
        """Calibrate ambient noise level."""
        if self.calibrated:
            return
        
        logging.info("Calibrating ambient noise for VAD...")
        energies = []
        
        for _ in range(num_frames):
            try:
                audio_data = self.stream.read(
                    self.frame_size,
                    exception_on_overflow=False
                )
                energy = self._calculate_energy(audio_data)
                energies.append(energy)
            except Exception as e:
                logging.debug(f"Calibration error: {e}")
                continue
        
        if energies:
            self.ambient_energy = np.mean(energies)
            # Set threshold above ambient noise
            self.energy_threshold = max(
                self.energy_threshold,
                self.ambient_energy * (2 + self.aggressiveness)
            )
            logging.info(f"VAD calibrated: ambient={self.ambient_energy:.1f}, "
                        f"threshold={self.energy_threshold:.1f}")
        
        self.calibrated = True
    
    def _monitoring_loop(self):
        """Main monitoring loop running in separate thread."""
        try:
            self._open_stream()
            
            # Calibrate ambient noise
            self._calibrate_ambient_noise()
            
            consecutive_speech_frames = 0
            
            while self.is_monitoring:
                # Read audio frame
                try:
                    audio_data = self.stream.read(
                        self.frame_size,
                        exception_on_overflow=False
                    )
                except Exception as e:
                    logging.error(f"Error reading audio frame: {e}")
                    time.sleep(0.01)
                    continue
                
                # Check if frame contains speech (energy-based)
                try:
                    energy = self._calculate_energy(audio_data)
                    is_speech = energy > self.energy_threshold
                    
                    # Log for debugging (first few frames only)
                    if consecutive_speech_frames < 3:
                        logging.debug(f"Energy: {energy:.1f}, Threshold: {self.energy_threshold:.1f}, Speech: {is_speech}")
                except Exception as e:
                    logging.debug(f"VAD processing error: {e}")
                    is_speech = False
                
                # Update speech frame buffer
                self.speech_frames.append(1 if is_speech else 0)
                
                # Count consecutive speech frames
                if is_speech:
                    consecutive_speech_frames += 1
                else:
                    consecutive_speech_frames = 0
                
                # Trigger callback if speech threshold reached
                if consecutive_speech_frames >= self.speech_frames_threshold:
                    logging.info(f"Speech detected! ({consecutive_speech_frames} consecutive frames, "
                               f"energy: {energy:.1f} > {self.energy_threshold:.1f})")
                    
                    if self.speech_detected_callback:
                        self.speech_detected_callback()
                    
                    # Reset counter and stop monitoring (one-shot detection)
                    consecutive_speech_frames = 0
                    break
                
                # Small delay to prevent CPU spinning
                time.sleep(0.001)
        
        except Exception as e:
            logging.error(f"VAD monitoring loop error: {e}")
        finally:
            self._close_stream()
    
    def is_active(self):
        """Check if VAD monitoring is currently active."""
        return self.is_monitoring
    
    def __del__(self):
        """Cleanup on deletion."""
        self.stop_monitoring()

