# voice_assistant/main.py

import logging
import time
from colorama import Fore, init
from voice_assistant.audio import record_audio, play_audio
from voice_assistant.transcription import transcribe_audio
from voice_assistant.response_generation import generate_response
from voice_assistant.text_to_speech import text_to_speech
from voice_assistant.utils import delete_file
from voice_assistant.config import Config
from voice_assistant.api_key_manager import get_transcription_api_key, get_response_api_key, get_tts_api_key
from voice_assistant.vad_detector import VADDetector
from voice_assistant.interruption_handler import get_interruption_handler

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize colorama
init(autoreset=True)

import sys
import threading


# Suppress "generator ignored GeneratorExit" warnings during TTS interruption
def custom_unraisablehook(unraisable):
    """Custom handler for unraisable exceptions to suppress generator cleanup warnings."""
    # Check if this is a generator cleanup error we expect during interruption
    if (isinstance(unraisable.exc_value, RuntimeError) and 
        "generator ignored GeneratorExit" in str(unraisable.exc_value)):
        # Silently ignore this expected error during TTS interruption
        return
    # For all other unraisable exceptions, use default behavior
    sys.__unraisablehook__(unraisable)

# Install custom unraisable exception hook
sys.unraisablehook = custom_unraisablehook


def main():
    """
    Main function to run the voice assistant.
    """
    chat_history = [
        {"role": "system", "content": """You are Verbi, a comprehensive personal assistant with access to the user's calendar, emails, tasks, weather information, news, contacts, and expenses. 
        Use the provided functions to retrieve information and assist the user. Always provide thoughtful and detailed responses. Assume today's date is 2024-08-24"""}
    ]
    
    # Initialize VAD detector and interruption handler
    vad_detector = VADDetector(
        sample_rate=16000,
        frame_duration_ms=30,
        aggressiveness=3,
        speech_frames_threshold=8
    )
    interrupt_handler = get_interruption_handler()
    
    logging.info(Fore.CYAN + "Voice Assistant with VAD Interruption Ready!" + Fore.RESET)
    logging.info(Fore.YELLOW + "You can now interrupt the assistant by speaking during responses." + Fore.RESET)

    while True:
        try:
            # Record audio from the microphone and save it as 'test.wav'
            record_audio(Config.INPUT_AUDIO)

            # Get the API key for transcription
            transcription_api_key = get_transcription_api_key()
            
            # Transcribe the audio file
            user_input = transcribe_audio(Config.TRANSCRIPTION_MODEL, transcription_api_key, Config.INPUT_AUDIO, Config.LOCAL_MODEL_PATH)

            # Check if the transcription is empty and restart the recording if it is. This check will avoid empty requests if vad_filter is used in the fastwhisperapi.
            if not user_input:
                logging.info("No transcription was returned. Starting recording again.")
                continue
            logging.info(Fore.GREEN + "You said: " + user_input + Fore.RESET)

            # Check if the user wants to exit the program
            if "goodbye" in user_input.lower() or "arrivederci" in user_input.lower():
                break

            # Append the user's input to the chat history
            chat_history.append({"role": "user", "content": user_input})

            # Get the API key for response generation
            response_api_key = get_response_api_key()

            # Generate a response
            response_text = generate_response(Config.RESPONSE_MODEL, response_api_key, chat_history, Config.LOCAL_MODEL_PATH)
            logging.info(Fore.CYAN + "Response: " + response_text + Fore.RESET)

            # Append the assistant's response to the chat history
            chat_history.append({"role": "assistant", "content": response_text})

            # Determine the output file format based on the TTS model
            if Config.TTS_MODEL == 'openai' or Config.TTS_MODEL == 'elevenlabs' or Config.TTS_MODEL == 'melotts' or Config.TTS_MODEL == 'cartesia':
                output_file = 'output.mp3'
            else:
                output_file = 'output.wav'

            # Get the API key for TTS
            tts_api_key = get_tts_api_key()

            # Define speech detection callback
            def on_speech_detected():
                """Callback when user speech is detected during TTS."""
                logging.info(Fore.RED + "🎤 User interruption detected!" + Fore.RESET)
                interrupt_handler.request_interrupt("user_speech_during_tts")
                vad_detector.stop_monitoring()
            
            # Clear any previous interruption state
            interrupt_handler.clear_interrupt()
            
            # Start VAD monitoring for Cartesia (streaming TTS)
            if Config.TTS_MODEL == "cartesia":
                logging.debug("Starting VAD monitoring...")
                vad_detector.start_monitoring(on_speech_detected)

            # Convert the response text to speech and save it to the appropriate file
            try:
                text_to_speech(Config.TTS_MODEL, tts_api_key, response_text, output_file, Config.LOCAL_MODEL_PATH)
            except RuntimeError as e:
                # Suppress generator cleanup errors during interruption (expected behavior)
                if "generator ignored GeneratorExit" not in str(e):
                    raise
            
            # Stop VAD monitoring after TTS
            if vad_detector.is_active():
                vad_detector.stop_monitoring()
            
            # Check if TTS was interrupted
            was_interrupted = interrupt_handler.is_interrupted()
            
            if was_interrupted:
                logging.info(Fore.YELLOW + "⚠️ Response interrupted by user. Starting new recording..." + Fore.RESET)
                interrupt_handler.clear_interrupt()
                # Continue to next iteration to record user's interruption
                continue

            # Play the generated speech audio (for non-streaming models)
            if Config.TTS_MODEL != "cartesia":
                play_audio(output_file)
            
            # Clean up audio files
            # delete_file(Config.INPUT_AUDIO)
            # delete_file(output_file)

        except KeyboardInterrupt:
            logging.info(Fore.CYAN + "\nShutting down voice assistant..." + Fore.RESET)
            # Stop VAD monitoring
            if vad_detector.is_active():
                vad_detector.stop_monitoring()
            break
        except Exception as e:
            logging.error(Fore.RED + f"An error occurred: {e}" + Fore.RESET)
            # Stop VAD on error
            if vad_detector.is_active():
                vad_detector.stop_monitoring()
            delete_file(Config.INPUT_AUDIO)
            if 'output_file' in locals():
                delete_file(output_file)
            time.sleep(1)

if __name__ == "__main__":
    main()
