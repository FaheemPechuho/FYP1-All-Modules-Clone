# 🚀 Clara Backend - Quick Start Guide

## Prerequisites

- Python 3.10 or higher
- OpenAI API key OR Groq API key
- Supabase account (for CRM integration)
- Microphone and speakers (for voice interaction)

## Installation

### Step 1: Setup Virtual Environment

```bash
cd clara-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

Create a `.env` file in the `clara-backend` directory:

```bash
# Copy example file
cp .env.example .env

# Edit .env with your actual credentials
```

**Required environment variables:**

```env
# LLM API Key (at least one required)
OPENAI_API_KEY=sk-your-openai-key-here
# OR
GROQ_API_KEY=gsk_your-groq-key-here

# Supabase (required for CRM integration)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Agent Configuration
SALES_AGENT_ENABLED=true
```

**📋 Need help setting up Supabase?** See the detailed guide: [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md)

## Testing

### Test the Pipeline

Run the comprehensive test suite:

```bash
python test_pipeline.py
```

This will test:
- ✓ Configuration
- ✓ Supabase connection
- ✓ Orchestrator initialization
- ✓ Sales Agent initialization
- ✓ Message processing
- ✓ Classification accuracy
- ✓ Full pipeline (Voice → Orchestrator → Agent → CRM)

### Test Individual Components

#### Test Orchestrator Only:

```python
from orchestrator.core import get_orchestrator

orchestrator = get_orchestrator()
result = orchestrator.test_pipeline("Hello, I want to buy your product")
print(result)
```

#### Test Sales Agent Only:

```python
from agents.sales_agent.agent import SalesAgent

agent = SalesAgent()
message_data = {
    "raw_message": "I'm interested in your CRM solution",
    "user_info": {"session_id": "test"}
}
response = agent.process(message_data)
print(response)
```

## Running the System

### Option 1: Run as API Server

Start the FastAPI server:

```bash
python main.py
```

The API will be available at `http://localhost:8001`

#### API Endpoints:

- `GET /` - API information
- `GET /health` - Health check
- `POST /api/message` - Process text message
- `POST /api/voice` - Voice interaction
- `GET /api/agents/status` - Agent status
- `GET /api/orchestrator/status` - Orchestrator status

#### Example API Usage:

```bash
# Test with curl
curl -X POST "http://localhost:8001/api/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, I want to learn about your products", "input_channel": "text"}'
```

### Option 2: Direct Python Usage

Create a simple script:

```python
# my_test.py
from orchestrator.core import get_orchestrator
from agents.sales_agent.agent import SalesAgent

# Initialize
orchestrator = get_orchestrator()
agents = {"sales": SalesAgent()}

# Process message
message = "Hi, I'm from TechCorp and interested in your CRM"
processed = orchestrator.process_message(message, input_channel="text")
response = orchestrator.route_to_agent(processed, agents)

print(f"Agent: {response['agent']}")
print(f"Response: {response['message']}")
print(f"Lead Score: {response['metadata']['lead_score']}")
```

Run it:

```bash
python my_test.py
```

### Option 3: Voice Interaction (Advanced)

Make sure Verbi is properly installed and configured:

```python
from input_streams.voice_stream import VoiceStream
from orchestrator.core import get_orchestrator
from agents.sales_agent.agent import SalesAgent

orchestrator = get_orchestrator()
agents = {"sales": SalesAgent()}
voice_stream = VoiceStream()

def process_callback(text):
    processed = orchestrator.process_message(text, input_channel="voice")
    return orchestrator.route_to_agent(processed, agents)

# Start voice interaction
result = voice_stream.voice_interaction(process_callback)
print(result)
```

## Verify Installation

Run this quick verification:

```bash
python -c "
from orchestrator.core import get_orchestrator
from agents.sales_agent.agent import SalesAgent
print('✓ Orchestrator imported successfully')
print('✓ Sales Agent imported successfully')
orchestrator = get_orchestrator()
print('✓ Orchestrator initialized')
agent = SalesAgent()
print('✓ Sales Agent initialized')
print('🎉 Installation successful!')
"
```

## Troubleshooting

### Issue: Import errors

**Solution:** Make sure virtual environment is activated and dependencies are installed:

```bash
pip install -r requirements.txt
```

### Issue: LLM API errors

**Solution:** Check your API keys in `.env`:

```bash
# Test OpenAI key
python -c "import openai; client = openai.OpenAI(); print('OpenAI key valid')"

# Test Groq key
python -c "from groq import Groq; client = Groq(); print('Groq key valid')"
```

### Issue: Supabase connection failed

**Solution:** Verify Supabase credentials:

```bash
python -c "
from crm_integration.supabase_client import test_connection
result = test_connection()
print('Supabase:', 'Connected' if result else 'Failed')
"
```

### Issue: Voice input not working

**Solution:** 
1. Check microphone permissions
2. Install audio dependencies (PortAudio on Mac/Linux)
3. Configure correct STT/TTS models in `.env`

## Next Steps

1. **Customize Sales Agent**
   - Edit `agents/sales_agent/prompts.py` to adjust conversation style
   - Modify `agents/sales_agent/lead_scorer.py` to adjust scoring rules

2. **Add More Agents**
   - Support Agent: `agents/support_agent/` (for Husnain)
   - Marketing Agent: `agents/marketing_agent/` (for Sheryar)

3. **Integrate with Frontend**
   - Connect to your React CRM frontend
   - Use WebSocket for real-time updates

4. **Deploy to Production**
   - Use Docker for deployment
   - Configure environment-specific settings
   - Set up monitoring and logging

## Support

For issues or questions:
- Check logs in `logs/clara-backend.log`
- Review the implementation plan: `IMPLEMENTATION_PLAN.md`
- Contact: Faheem (Sales Agent), Husnain (Support Agent), Sheryar (Marketing Agent)

---

**Happy Building! 🚀**

