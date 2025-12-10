"""
Quick test script to verify Ollama connectivity
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('.env.husnain')

ollama_url = os.getenv("OLLAMA_API_URL", "http://localhost:11434/api/chat")
ollama_model = os.getenv("OLLAMA_MODEL_NAME", "llama3.1")

print(f"Testing Ollama connection...")
print(f"URL: {ollama_url}")
print(f"Model: {ollama_model}")
print("-" * 50)

# Test 1: Check if Ollama server is running
try:
    test_url = ollama_url.replace("/api/chat", "/api/tags")
    print(f"\n1. Testing connection to: {test_url}")
    response = requests.get(test_url, timeout=5)
    response.raise_for_status()
    print(f"✅ SUCCESS! Status: {response.status_code}")
    print(f"Available models: {response.json()}")
except Exception as e:
    print(f"❌ FAILED: {e}")
    exit(1)

# Test 2: Try a simple chat completion
try:
    print(f"\n2. Testing chat completion...")
    payload = {
        "model": ollama_model,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Hello from Ollama!' and nothing else."}
        ],
        "stream": False
    }
    
    response = requests.post(ollama_url, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    
    message = data.get("message", {})
    content = message.get("content", "")
    
    print(f"✅ SUCCESS!")
    print(f"Response: {content}")
    
except Exception as e:
    print(f"❌ FAILED: {e}")
    exit(1)

print("\n" + "=" * 50)
print("✅ All tests passed! Ollama is working correctly.")
print("=" * 50)
