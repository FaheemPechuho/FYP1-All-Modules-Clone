"""
Interruption Handler for Voice Assistant

Manages interruption state across different threads (TTS, VAD, main loop).
"""

import threading
import logging

class InterruptionHandler:
    """
    Centralized interruption state management.
    Thread-safe singleton for managing interruptions.
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self.interrupt_event = threading.Event()
        self.tts_active = threading.Event()
        self.interrupt_reason = None
        self._lock = threading.Lock()
        
        logging.info("InterruptionHandler initialized")
    
    def request_interrupt(self, reason="user_speech"):
        """Request an interruption of current TTS playback."""
        with self._lock:
            self.interrupt_reason = reason
            self.interrupt_event.set()
            logging.info(f"Interruption requested: {reason}")
    
    def clear_interrupt(self):
        """Clear the interruption flag."""
        with self._lock:
            self.interrupt_event.clear()
            self.interrupt_reason = None
            logging.debug("Interruption cleared")
    
    def is_interrupted(self):
        """Check if interruption has been requested."""
        return self.interrupt_event.is_set()
    
    def set_tts_active(self, active):
        """Mark TTS as active or inactive."""
        if active:
            self.tts_active.set()
        else:
            self.tts_active.clear()
        logging.debug(f"TTS active: {active}")
    
    def is_tts_active(self):
        """Check if TTS is currently playing."""
        return self.tts_active.is_set()
    
    def get_interrupt_reason(self):
        """Get the reason for the interruption."""
        with self._lock:
            return self.interrupt_reason
    
    def reset(self):
        """Reset all interruption states."""
        with self._lock:
            self.interrupt_event.clear()
            self.tts_active.clear()
            self.interrupt_reason = None
            logging.debug("InterruptionHandler reset")


# Global instance
_handler = InterruptionHandler()

def get_interruption_handler():
    """Get the global interruption handler instance."""
    return _handler

