"""
Voice Stream - Integrate voice input with orchestrator
Owner: Faheem
"""

import sys
import os
from typing import Dict, Any, Optional, Callable
from pathlib import Path

# Add parent directory to path to import from Verbi
verbi_path = Path(__file__).parent.parent.parent / "Verbi"
sys.path.insert(0, str(verbi_path))

from voice_assistant.transcription import transcribe_audio
from voice_assistant.text_to_speech import text_to_speech
from voice_assistant.audio import record_audio, play_audio
from voice_assistant.config import Config as VerbiConfig

from utils.logger import get_logger
from config import settings

logger = get_logger("voice_stream")


class VoiceStream:
    """
    Voice stream handler - integrates voice I/O with orchestrator
    
    Handles:
    - Audio recording
    - Speech-to-Text conversion
    - Text-to-Speech synthesis
    - Audio playback
    """
    
    def __init__(self):
        """Initialize voice stream"""
        self.input_audio_path = "voice_input.wav"
        self.output_audio_path = "voice_output.wav"
        
        # Determine TTS output format (Cartesia uses streaming, others use files)
        if settings.TTS_MODEL in ['openai', 'elevenlabs', 'melotts']:
            self.output_audio_path = "voice_output.mp3"
        elif settings.TTS_MODEL == 'cartesia':
            # Cartesia streams directly, but we may need a temp file
            self.output_audio_path = "voice_output.mp3"
        
        logger.info("Voice stream initialized")
        logger.info(f"STT Model: {settings.STT_MODEL}")
        logger.info(f"TTS Model: {settings.TTS_MODEL}")
    
    def capture_voice_input(self) -> Optional[str]:
        """
        Capture voice input and convert to text
        
        Returns:
            Transcribed text or None if failed
        """
        try:
            logger.info("Recording audio...")
            
            # Record audio using Verbi's audio module
            record_audio(self.input_audio_path)
            
            # Transcribe audio
            logger.info("Transcribing audio...")
            transcribed_text = self._transcribe(self.input_audio_path)
            
            if not transcribed_text or not transcribed_text.strip():
                logger.warning("No speech detected or transcription empty")
                return None
            
            logger.info(f"Transcribed: {transcribed_text}")
            return transcribed_text
            
        except Exception as e:
            logger.error(f"Error capturing voice input: {e}")
            return None
    
    def generate_voice_output(self, text: str) -> bool:
        """
        Generate voice output from text
        
        Args:
            text: Text to convert to speech
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info("Generating speech...")
            
            # Get appropriate API key based on TTS model
            api_key = self._get_tts_api_key()
            
            # Generate speech using Verbi's TTS module
            text_to_speech(
                model=settings.TTS_MODEL,
                api_key=api_key,
                text=text,
                output_file=self.output_audio_path,
                local_model_path=None
            )
            
            logger.info("Speech generated successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error generating voice output: {e}")
            return False
    
    def play_voice_output(self) -> bool:
        """
        Play generated voice output
        
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info("Playing audio...")
            
            # Play audio using Verbi's audio module
            play_audio(self.output_audio_path)
            
            return True
            
        except Exception as e:
            logger.error(f"Error playing voice output: {e}")
            return False
    
    def voice_interaction(
        self,
        process_message_callback: Callable[[str], Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Complete voice interaction cycle
        
        Args:
            process_message_callback: Function to process the transcribed text
            
        Returns:
            Interaction result
        """
        try:
            # Step 1: Capture voice input
            transcribed_text = self.capture_voice_input()
            
            if not transcribed_text:
                return {
                    "success": False,
                    "error": "Failed to capture voice input"
                }
            
            # Step 2: Process message through orchestrator (via callback)
            logger.info("Processing message through orchestrator...")
            processing_result = process_message_callback(transcribed_text)
            
            # Step 3: Generate and play voice response
            response_text = processing_result.get("message", "I apologize, I didn't understand that.")
            
            voice_generated = self.generate_voice_output(response_text)
            
            if voice_generated:
                self.play_voice_output()
            else:
                logger.error("Failed to generate voice output")
            
            return {
                "success": True,
                "transcribed_text": transcribed_text,
                "response_text": response_text,
                "voice_output_generated": voice_generated,
                "processing_result": processing_result
            }
            
        except Exception as e:
            logger.error(f"Error in voice interaction: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _transcribe(self, audio_file_path: str) -> str:
        """
        Transcribe audio file
        
        Args:
            audio_file_path: Path to audio file
            
        Returns:
            Transcribed text
        """
        # Get API key based on STT model
        if settings.STT_MODEL == 'groq':
            api_key = settings.GROQ_API_KEY
        elif settings.STT_MODEL == 'openai':
            api_key = settings.OPENAI_API_KEY
        elif settings.STT_MODEL == 'deepgram':
            api_key = settings.DEEPGRAM_API_KEY
        else:
            api_key = None
        
        # Transcribe using Verbi's transcription module
        text = transcribe_audio(
            model=settings.STT_MODEL,
            api_key=api_key,
            audio_file_path=audio_file_path,
            local_model_path=None
        )
        
        return text
    
    def _get_tts_api_key(self) -> Optional[str]:
        """Get TTS API key based on configured model (matching Verbi config)"""
        if settings.TTS_MODEL == 'openai':
            return settings.OPENAI_API_KEY
        elif settings.TTS_MODEL == 'deepgram':
            return settings.DEEPGRAM_API_KEY
        elif settings.TTS_MODEL == 'cartesia':
            return settings.CARTESIA_API_KEY
        elif settings.TTS_MODEL == 'elevenlabs':
            return os.getenv("ELEVENLABS_API_KEY")
        else:
            return None
    
    def cleanup(self):
        """Clean up audio files"""
        try:
            if os.path.exists(self.input_audio_path):
                os.remove(self.input_audio_path)
            
            if os.path.exists(self.output_audio_path):
                os.remove(self.output_audio_path)
            
            logger.info("Cleaned up audio files")
            
        except Exception as e:
            logger.warning(f"Error cleaning up audio files: {e}")


def test_voice_stream():
    """Test voice stream functionality"""
    logger.info("=== Testing Voice Stream ===")
    
    voice_stream = VoiceStream()
    
    # Test 1: Capture voice input
    logger.info("\nTest 1: Capturing voice input...")
    text = voice_stream.capture_voice_input()
    
    if text:
        logger.info(f"✓ Voice input captured: {text}")
    else:
        logger.error("✗ Failed to capture voice input")
        return False
    
    # Test 2: Generate voice output
    logger.info("\nTest 2: Generating voice output...")
    test_response = "Hello! This is a test of the voice output system."
    success = voice_stream.generate_voice_output(test_response)
    
    if success:
        logger.info("✓ Voice output generated")
    else:
        logger.error("✗ Failed to generate voice output")
        return False
    
    # Test 3: Play voice output
    logger.info("\nTest 3: Playing voice output...")
    success = voice_stream.play_voice_output()
    
    if success:
        logger.info("✓ Voice output played")
    else:
        logger.error("✗ Failed to play voice output")
        return False
    
    # Cleanup
    voice_stream.cleanup()
    
    logger.info("\n=== All voice stream tests passed! ===")
    return True


if __name__ == "__main__":
    test_voice_stream()

