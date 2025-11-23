# 🧪 Clara Backend - Testing Guide

## Quick Testing Checklist

Follow these steps in order to test your multi-agent system.

---

## ✅ **Step 1: Environment Setup**

### 1.1 Create Virtual Environment

```bash
cd "D:\Faheem\Semester 7\FYP\Implementation\Clara\clara-backend"

# Create venv
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# You should see (venv) in your terminal
```

### 1.2 Install Dependencies

```bash
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed fastapi-0.104.1 uvicorn-0.24.0 openai-1.3.7 ...
```

### 1.3 Create .env File

Create `.env` file in `clara-backend/` folder:

```bash
# Copy template
copy env.template.txt .env

# Edit .env with your API keys (use same from Verbi)
notepad .env
```

**Minimal .env content:**
```env
GROQ_API_KEY=gsk_your_actual_key_here
CARTESIA_API_KEY=your_actual_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_actual_service_key_here
SALES_AGENT_ENABLED=true
```

### 1.4 Verify Configuration

```bash
python -c "from config import settings; print('✓ Config loaded'); print('Groq Key:', 'Found' if settings.GROQ_API_KEY else 'MISSING'); print('Supabase URL:', settings.SUPABASE_URL)"
```

**Expected output:**
```
✓ Config loaded
Groq Key: Found
Supabase URL: https://yourproject.supabase.co
```

---

## ✅ **Step 2: Component Testing**

### 2.1 Test Supabase Connection

```bash
python -c "from crm_integration.supabase_client import test_connection; result = test_connection(); print('Supabase:', 'Connected ✓' if result else 'Failed ✗')"
```

**Expected:** `Supabase: Connected ✓`

**If failed:**
- Check SUPABASE_URL is correct
- Check SUPABASE_SERVICE_KEY is correct
- Verify internet connection

### 2.2 Test Orchestrator Initialization

```bash
python -c "from orchestrator.core import get_orchestrator; orch = get_orchestrator(); print('✓ Orchestrator initialized'); print('Enabled agents:', orch.get_enabled_agents())"
```

**Expected:**
```
✓ Orchestrator initialized
Enabled agents: ['sales']
```

### 2.3 Test Sales Agent Initialization

```bash
python -c "from agents.sales_agent.agent import SalesAgent; agent = SalesAgent(); print('✓ Sales Agent initialized'); print('Model:', agent.model)"
```

**Expected:**
```
✓ Sales Agent initialized
Model: llama-3.3-70b-versatile
```

### 2.4 Test Classification

```bash
python -c "
from orchestrator.core import get_orchestrator
orch = get_orchestrator()
result = orch.classifier.classify('I want to buy your product')
print('Intent:', result['intent'])
print('Confidence:', result['confidence'])
"
```

**Expected:**
```
Intent: sales
Confidence: 0.95 (or similar)
```

---

## ✅ **Step 3: Pipeline Testing (Comprehensive)**

Run the full test suite:

```bash
python test_pipeline.py
```

**Expected output:**
```
======================================================================
  CLARA BACKEND - PIPELINE TESTS
======================================================================

📋 Test 1: Configuration
   Environment: development
   Sales Agent Model: llama-3.3-70b-versatile
   STT Model: groq
   TTS Model: cartesia
   ✓ Configuration test passed

🔌 Test 2: Supabase Connection
   ✓ Supabase connection successful

🎭 Test 3: Orchestrator Initialization
   Enabled agents: ['sales']
   ✓ Orchestrator initialized successfully

💼 Test 4: Sales Agent Initialization
   ✓ Sales agent initialized successfully

📨 Test 5: Message Processing
   Message ID: xxxxx
   Routed to: sales
   Confidence: 0.95
   ✓ Message processing successful

🏷️  Test 6: Classification
   ✓ Classification tests completed

💰 Test 7: Sales Agent Processing
   Qualification: unqualified
   Lead Score: 35/100
   CRM Updated: True
   ✓ Sales agent processing successful

🚀 Test 8: Full Pipeline
   ✓ Full pipeline test successful!

======================================================================
  TEST RESULTS SUMMARY
======================================================================
  ✓ PASS             Configuration
  ✓ PASS             Supabase Connection
  ✓ PASS             Orchestrator Init
  ✓ PASS             Sales Agent Init
  ✓ PASS             Message Processing
  ✓ PASS             Classification
  ✓ PASS             Sales Agent Processing
  ✓ PASS             Full Pipeline
======================================================================
  Total: 8 | Passed: 8 | Failed: 0 | Skipped: 0
======================================================================
  🎉 ALL TESTS PASSED!
======================================================================
```

---

## ✅ **Step 4: API Server Testing**

### 4.1 Start the Server

```bash
python main.py
```

**Expected output:**
```
======================================================================
  CLARA MULTI-AGENT BACKEND
  Version: 1.0.0
  Environment: development
======================================================================
🚀 Starting Clara Multi-Agent Backend...
Initializing orchestrator...
Initializing agents...
✓ Sales Agent initialized
✨ Clara Backend started successfully on port 8001
   Environment: development
   Enabled agents: ['sales']
```

Server runs at: **http://localhost:8001**

### 4.2 Test API Endpoints

**Open a NEW terminal** (keep server running in first terminal):

```bash
# Test 1: Health check
curl http://localhost:8001/health

# Expected: {"status":"healthy","orchestrator":"operational","agents":{"sales":"operational"}}
```

```bash
# Test 2: Process a message
curl -X POST http://localhost:8001/api/message ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"Hello, I'm interested in your CRM product\", \"input_channel\": \"text\"}"

# Expected: JSON response with agent message, lead score, etc.
```

```bash
# Test 3: Check orchestrator status
curl http://localhost:8001/api/orchestrator/status

# Expected: Full orchestrator status with routing stats
```

```bash
# Test 4: Test pipeline
curl -X POST "http://localhost:8001/api/test/pipeline?message=I want to buy your product"

# Expected: Test result with classification
```

### 4.3 Test with Browser

Open browser and go to:
- **http://localhost:8001** - See API info
- **http://localhost:8001/docs** - Interactive API documentation (Swagger UI)

---

## ✅ **Step 5: Voice Integration Testing (Advanced)**

### 5.1 Test Voice Stream Components

```bash
python -c "
from input_streams.voice_stream import VoiceStream
vs = VoiceStream()
print('✓ Voice stream initialized')
print('STT Model:', vs._transcribe.__name__)
print('TTS Model: cartesia')
"
```

### 5.2 Test Complete Voice Flow

**Important:** Make sure your microphone is working!

```python
# Create test file: test_voice.py
from orchestrator.core import get_orchestrator
from agents.sales_agent.agent import SalesAgent
from input_streams.voice_stream import VoiceStream

# Initialize components
orchestrator = get_orchestrator()
agents = {"sales": SalesAgent()}
voice_stream = VoiceStream()

print("🎤 Say something after the beep...")

# Define processing callback
def process_callback(text):
    print(f"📝 You said: {text}")
    processed = orchestrator.process_message(text, input_channel="voice")
    return orchestrator.route_to_agent(processed, agents)

# Test voice interaction
result = voice_stream.voice_interaction(process_callback)

if result['success']:
    print("✓ Voice interaction successful!")
    print(f"Response: {result['response_text']}")
else:
    print("✗ Voice interaction failed:", result.get('error'))
```

Run it:
```bash
python test_voice.py
```

---

## ✅ **Step 6: CRM Integration Testing**

### 6.1 Test Lead Creation

```python
# Create test file: test_crm.py
from agents.sales_agent.crm_connector import SalesCRMConnector

connector = SalesCRMConnector()

# Test lead data
lead_info = {
    "company_name": "Test Corp",
    "contact_person": "John Doe",
    "email": "john@testcorp.com",
    "phone": "+1234567890",
    "industry": "Technology"
}

qualification_result = {
    "qualification_status": "marketing_qualified",
    "bant_assessment": {
        "budget": "medium",
        "authority": "yes",
        "need": "high",
        "timeline": "this_quarter"
    },
    "extracted_info": lead_info
}

score_breakdown = {
    "total_score": 65,
    "category_scores": {
        "company_fit": 15,
        "engagement": 20,
        "bant": 20,
        "intent_signals": 10
    }
}

# Create lead
lead = connector.create_or_update_lead(
    lead_info, 
    qualification_result, 
    score_breakdown
)

if lead:
    print("✓ Lead created successfully!")
    print(f"Lead ID: {lead['id']}")
    print(f"Score: {lead.get('lead_score')}/100")
    print(f"Stage: {lead.get('status_bucket')}")
else:
    print("✗ Failed to create lead")
```

Run it:
```bash
python test_crm.py
```

Then **check your Supabase dashboard** to verify the lead was created!

---

## 🐛 **Troubleshooting**

### Issue: "ModuleNotFoundError"
**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: "No LLM API key configured"
**Solution:**
- Check `.env` file exists
- Verify `GROQ_API_KEY` is set
- Restart terminal after creating `.env`

### Issue: "Supabase connection failed"
**Solution:**
- Verify `SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_KEY` (not anon key!)
- Test connection: https://app.supabase.com

### Issue: "Voice input not working"
**Solution:**
- Check microphone permissions
- Verify `GROQ_API_KEY` and `CARTESIA_API_KEY` in `.env`
- Test microphone: `python -c "import pyaudio; print('OK')"`

### Issue: API server won't start
**Solution:**
- Check if port 8001 is already in use
- Try different port: `ORCHESTRATOR_PORT=8002` in `.env`
- Check logs: `logs/clara-backend.log`

---

## ✅ **Test Results Documentation**

After testing, document your results:

```
✅ Configuration: PASS
✅ Supabase: PASS
✅ Orchestrator: PASS
✅ Sales Agent: PASS
✅ Classification: PASS
✅ Full Pipeline: PASS
✅ API Endpoints: PASS
✅ Voice Integration: PASS (or SKIP if not testing)
✅ CRM Integration: PASS

Overall Status: ✅ READY FOR DEMO
```

---

## 📊 **Performance Benchmarks**

Expected performance:
- Orchestrator processing: < 500ms
- Sales Agent response: < 3s
- Full pipeline: < 5s
- API endpoint latency: < 100ms

---

## 🎯 **Next Steps After Testing**

1. ✅ All tests pass → Ready for integration with frontend
2. ✅ API working → Can start building UI
3. ✅ Voice working → Can demo voice features
4. ✅ CRM working → Leads are being tracked

---

**Good luck with testing! 🚀**

If you encounter any issues, check the logs at `logs/clara-backend.log`

