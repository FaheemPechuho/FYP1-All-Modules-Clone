#!/bin/bash
# =============================================================================
# Clara Marketing Agent - Quick Start Script
# Owner: Sheryar
#
# This script installs dependencies and starts the Clara backend with
# LangChain + Gemini integration for the Marketing Hub.
# =============================================================================

echo "=============================================="
echo "  Clara Marketing Agent (LangChain + Gemini)"
echo "=============================================="

# Navigate to clara-backend directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/upgrade pip
pip install --upgrade pip

# Install core dependencies (minimal for Marketing Agent)
echo "Installing dependencies..."
pip install fastapi uvicorn pydantic pydantic-settings python-dotenv
pip install langchain langchain-core langchain-google-genai google-generativeai
pip install supabase httpx requests loguru colorama

echo ""
echo "=============================================="
echo "  Starting Clara Backend on port 8001..."
echo "=============================================="
echo ""
echo "Marketing Agent API endpoints:"
echo "  - POST /api/marketing/generate-email"
echo "  - POST /api/marketing/generate-sms"
echo "  - POST /api/marketing/generate-call-script"
echo "  - POST /api/marketing/generate-ad-copy"
echo "  - POST /api/marketing/analyze-lead"
echo "  - GET  /api/marketing/campaign-insights"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

