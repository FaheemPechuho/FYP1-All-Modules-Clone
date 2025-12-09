#!/usr/bin/env python3
"""
Quick setup script for Piper TTS on Windows
Easier than MeloTTS - just download binary, no compilation!
"""

import os
import sys
import platform
import urllib.request
import zipfile
from pathlib import Path

# Colors for terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
RESET = "\033[0m"

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠️  {text}{RESET}")

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def print_info(text):
    print(f"{BLUE}ℹ️  {text}{RESET}")

def check_windows():
    """Check if running on Windows"""
    if platform.system() != "Windows":
        print_warning("This script is optimized for Windows.")
        print_info("Piper works on all platforms, but setup may differ.")
        response = input("Continue anyway? (y/n): ")
        return response.lower() == 'y'
    print_success("Windows detected")
    return True

def create_piper_folder():
    """Create piper directory if it doesn't exist"""
    piper_dir = Path("../Verbi/piper")
    piper_dir.mkdir(parents=True, exist_ok=True)
    print_success(f"Piper directory ready: {piper_dir}")
    return piper_dir

def download_piper_binary(piper_dir):
    """Guide user to download Piper binary"""
    print_header("Step 1: Download Piper Binary")
    
    print_info("Piper binary needs to be downloaded manually.")
    print("\nInstructions:")
    print("1. Go to: https://github.com/rhasspy/piper/releases")
    print("2. Download: piper_windows_amd64.zip (for 64-bit Windows)")
    print("   OR: piper_windows_arm64.zip (for ARM Windows)")
    print("3. Extract the zip file")
    print(f"4. Copy 'piper.exe' to: {piper_dir.absolute()}")
    
    input("\nPress Enter when you've downloaded and placed piper.exe...")
    
    piper_exe = piper_dir / "piper.exe"
    if piper_exe.exists():
        print_success(f"Found piper.exe at: {piper_exe}")
        return True
    else:
        print_error(f"piper.exe not found at: {piper_exe}")
        print_info("Please download and place it there, then run this script again.")
        return False

def download_voice_model():
    """Guide user to download voice model"""
    print_header("Step 2: Download Voice Model")
    
    verbi_dir = Path("../Verbi")
    model_path = verbi_dir / "en_US-lessac-medium.onnx"
    
    print_info("Voice model needs to be downloaded manually.")
    print("\nInstructions:")
    print("1. Go to: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US")
    print("2. Download: en_US-lessac-medium.onnx")
    print(f"3. Place it in: {verbi_dir.absolute()}")
    
    input("\nPress Enter when you've downloaded and placed the .onnx file...")
    
    if model_path.exists():
        print_success(f"Found voice model at: {model_path}")
        return True
    else:
        print_error(f"Voice model not found at: {model_path}")
        print_info("Please download and place it there, then run this script again.")
        return False

def update_piper_server():
    """Update piper_server.py for Windows"""
    print_header("Step 3: Update Piper Server Config")
    
    server_file = Path("../Verbi/piper_server.py")
    if not server_file.exists():
        print_error(f"piper_server.py not found at: {server_file}")
        return False
    
    # Read current content
    content = server_file.read_text()
    
    # Check if already updated
    if "platform.system()" in content:
        print_success("piper_server.py already configured for Windows")
        return True
    
    # Update the executable path check
    old_check = 'if not os.path.isfile(piper_executable) or not os.access(piper_executable, os.X_OK):'
    new_check = '''    # Check if binary exists (Windows doesn't need X_OK check)
    if not os.path.isfile(piper_executable):'''
    
    if old_check in content:
        content = content.replace(old_check, new_check)
        # Also update the executable path
        if './piper/piper"' in content:
            content = content.replace(
                'piper_executable = "./piper/piper"',
                '''    # Windows: use .exe, Linux/Mac: no extension
    import platform
    if platform.system() == "Windows":
        piper_executable = "./piper/piper.exe"
    else:
        piper_executable = "./piper/piper"'''
            )
        server_file.write_text(content)
        print_success("Updated piper_server.py for Windows")
        return True
    else:
        print_warning("piper_server.py structure may have changed. Please check manually.")
        return True

def update_env_file():
    """Update .env file to use Piper"""
    env_path = Path(".env")
    
    if not env_path.exists():
        print_warning(".env file not found. Creating from template...")
        template_path = Path("env.template.txt")
        if template_path.exists():
            env_path.write_text(template_path.read_text())
        else:
            print_error("env.template.txt not found. Please create .env manually.")
            return False
    
    # Read current .env
    content = env_path.read_text()
    
    # Update TTS_MODEL
    if "TTS_MODEL=" in content:
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            if line.startswith("TTS_MODEL="):
                new_lines.append("TTS_MODEL=piper")
            else:
                new_lines.append(line)
        content = '\n'.join(new_lines)
    else:
        content += "\n# TTS Configuration\nTTS_MODEL=piper\n"
    
    # Add PIPER_SERVER_URL if not present
    if "PIPER_SERVER_URL=" not in content:
        content += "PIPER_SERVER_URL=http://localhost:5000\n"
    
    # Write back
    env_path.write_text(content)
    print_success(".env file updated to use Piper")
    return True

def update_verbi_config():
    """Update Verbi config to include Piper settings"""
    config_file = Path("../Verbi/voice_assistant/config.py")
    if not config_file.exists():
        print_warning("Verbi config file not found. Skipping...")
        return True
    
    content = config_file.read_text()
    
    # Check if PIPER settings already exist
    if "PIPER_SERVER_URL" in content:
        print_success("Verbi config already has Piper settings")
        return True
    
    # Add Piper settings before the validate_config method
    if "PIPER_SERVER_URL" not in content:
        # Find a good place to insert (after CARTESIA_API_KEY)
        if "CARTESIA_API_KEY" in content:
            content = content.replace(
                "CARTESIA_API_KEY = os.getenv(\"CARTESIA_API_KEY\")",
                "CARTESIA_API_KEY = os.getenv(\"CARTESIA_API_KEY\")\n    PIPER_SERVER_URL = os.getenv(\"PIPER_SERVER_URL\", \"http://localhost:5000\")\n    PIPER_OUTPUT_FILE = \"output.wav\""
            )
            config_file.write_text(content)
            print_success("Updated Verbi config with Piper settings")
            return True
    
    return True

def main():
    """Main setup function"""
    print_header("Piper TTS Setup for Windows")
    
    print_info("This script will help you set up Piper TTS (easier than MeloTTS on Windows)")
    print("\nYou'll need to:")
    print("  1. Download piper.exe (binary)")
    print("  2. Download a voice model (.onnx file)")
    print("  3. This script will configure everything else")
    
    response = input("\nContinue? (y/n): ")
    if response.lower() != 'y':
        print("Setup cancelled.")
        return
    
    # Check Windows
    if not check_windows():
        return
    
    # Step 1: Create piper folder
    piper_dir = create_piper_folder()
    
    # Step 2: Download binary (manual)
    if not download_piper_binary(piper_dir):
        print_error("Setup incomplete. Please download piper.exe and run again.")
        return
    
    # Step 3: Download voice model (manual)
    if not download_voice_model():
        print_error("Setup incomplete. Please download voice model and run again.")
        return
    
    # Step 4: Update server config
    if not update_piper_server():
        print_warning("Could not update server config. Please check manually.")
    
    # Step 5: Update .env
    if not update_env_file():
        print_warning("Could not update .env. Please set TTS_MODEL=piper manually.")
    
    # Step 6: Update Verbi config
    update_verbi_config()
    
    # Final instructions
    print_header("Setup Complete! 🎉")
    print_success("Piper TTS is configured!")
    print("\nNext steps:")
    print("1. Start the Piper server:")
    print("   cd ../Verbi")
    print("   python piper_server.py")
    print("\n2. In a NEW terminal, test your voice assistant:")
    print("   cd clara-backend")
    print("   python test_voice_manual.py")
    print("\n3. Enjoy unlimited TTS! No API tokens needed! 🚀")
    print("\n" + "="*60)

if __name__ == "__main__":
    main()

