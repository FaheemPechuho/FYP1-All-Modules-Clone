# 🧪 Manual Testing Guide - Full Pipeline Test

This guide will help you manually test the complete pipeline: **Voice → Text → Orchestrator → Sales Agent → CRM**

---

## 📋 Prerequisites

1. ✅ Backend server is ready to run
2. ✅ `.env` file is configured with API keys
3. ✅ Microphone and speakers are working (for voice tests)
4. ✅ Supabase connection is working

---

## 🚀 Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd "D:\Faheem\Semester 7\FYP\Implementation\Clara\clara-backend"

# Activate virtual environment (if using one)
venv\Scripts\activate

# Start the server
python main.py
```

**Expected output:**
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     🚀 Starting Clara Multi-Agent Backend...
INFO:     ✓ Sales Agent initialized
INFO:     ✓ Voice stream initialized
INFO:     ✨ Clara Backend started successfully on port 8001
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

**✅ Server is running!** Keep this terminal open.

---

## 🧪 Step 2: Test via API (Text Messages)

### Option A: Using Browser (Swagger UI)

1. Open your browser and go to: **http://localhost:8001/docs**
2. You'll see the interactive API documentation
3. Test the `/api/message` endpoint:
   - Click on `POST /api/message`
   - Click "Try it out"
   - Enter this JSON:
   ```json
   {
     "message": "Hello, I'm Sarah Johnson from TechStart Inc. We're looking for a CRM solution.",
     "input_channel": "text",
     "session_id": "test-session-1"
   }
   ```
   - Click "Execute"
   - Check the response for:
     - ✅ Agent response message
     - ✅ Lead score
     - ✅ CRM update status
     - ✅ Qualification status

### Option B: Using PowerShell/Command Line

Open a **new terminal** (keep server running) and test:

```powershell
# Test 1: Health check
Invoke-RestMethod -Uri "http://localhost:8001/health" -Method Get

# Test 2: Process a message (New Lead Scenario)
$body = @{
    message = "Hello, I'm John from Acme Corp. We're interested in your CRM solution."
    input_channel = "text"
    session_id = "manual-test-1"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/message" -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Hello John! I'd be happy to help you with our CRM solution...",
  "agent": "sales",
  "metadata": {
    "qualification_status": "qualified",
    "lead_score": 75,
    "crm_updated": true,
    "lead_id": "xxx-xxx-xxx"
  },
  "actions": ["lead_created", "crm_updated"]
}
```

---

## 🎤 Step 3: Test Voice Interaction

### Method 1: Via API Endpoint

In PowerShell (new terminal):

```powershell
# Test voice interaction
Invoke-RestMethod -Uri "http://localhost:8001/api/voice" -Method Post
```

**What happens:**
1. 🎤 Your microphone will start recording
2. 🗣️ Speak your message (e.g., "Hello, I'm interested in your product")
3. 📝 System transcribes your speech
4. 🤖 Processes through orchestrator and sales agent
5. 🔊 System responds with voice output

### Method 2: Direct Python Script

Create a file `test_voice_manual.py`:

```python
"""Manual Voice Testing Script"""
from orchestrator.core import get_orchestrator
from agents.sales_agent.agent import SalesAgent
from input_streams.voice_stream import VoiceStream

# Initialize
print("🔧 Initializing components...")
orchestrator = get_orchestrator()
agents = {"sales": SalesAgent()}
voice_stream = VoiceStream()
print("✅ All components ready!\n")

# Define processing callback
def process_callback(text):
    print(f"\n📝 You said: {text}")
    print("🔄 Processing through orchestrator...")
    
    processed = orchestrator.process_message(
        raw_message=text,
        input_channel="voice"
    )
    
    print(f"✅ Routed to: {processed['routing']['target_agent']}")
    print("🤖 Getting agent response...")
    
    response = orchestrator.route_to_agent(processed, agents)
    
    print(f"💬 Agent: {response['message'][:100]}...")
    
    # Show metadata
    metadata = response.get("metadata", {})
    if metadata.get("lead_score"):
        print(f"📊 Lead Score: {metadata['lead_score']}/100")
    if metadata.get("crm_updated"):
        print("✅ CRM Updated")
    
    return response

# Start voice interaction
print("="*60)
print("🎤 VOICE INTERACTION TEST")
print("="*60)
print("\n📢 Speak after the beep...")
print("(Press Ctrl+C to stop)\n")

try:
    result = voice_stream.voice_interaction(process_callback)
    
    if result['success']:
        print("\n✅ Voice interaction successful!")
        print(f"Transcribed: {result.get('transcribed_text')}")
        print(f"Response: {result.get('response_text')[:100]}...")
    else:
        print(f"\n❌ Error: {result.get('error')}")
except KeyboardInterrupt:
    print("\n\n⏹️  Stopped by user")
except Exception as e:
    print(f"\n❌ Error: {e}")
```

Run it:
```bash
python test_voice_manual.py
```

---

## 📝 Step 4: Test Different Scenarios

### Scenario 1: New Lead Qualification

**Test Conversation Flow:**

1. **Turn 1:**
   ```json
   {
     "message": "Hello, I'm Sarah Johnson from TechStart Inc.",
     "session_id": "scenario-1-new-lead"
   }
   ```
   **Expected:** Agent greets, asks about company

2. **Turn 2:**
   ```json
   {
     "message": "We're a startup with about 50 employees.",
     "session_id": "scenario-1-new-lead"
   }
   ```
   **Expected:** Agent acknowledges, continues qualification

3. **Turn 3:**
   ```json
   {
     "message": "We're looking for a CRM solution to manage our sales pipeline.",
     "session_id": "scenario-1-new-lead"
   }
   ```
   **Expected:** Agent identifies need, asks about budget/timeline

4. **Turn 4:**
   ```json
   {
     "message": "Our budget is around $30,000 and we need to implement within 2 months.",
     "session_id": "scenario-1-new-lead"
   }
   ```
   **Expected:** Agent captures budget, asks about decision maker

5. **Turn 5:**
   ```json
   {
     "message": "Yes, I'm the CEO and I make the final decisions.",
     "session_id": "scenario-1-new-lead"
   }
   ```
   **Expected:** 
   - ✅ Lead qualified
   - ✅ Lead score calculated (should be high)
   - ✅ CRM updated with new lead
   - ✅ Lead ID returned

**Check Results:**
- Go to your Supabase dashboard
- Check the `leads` table
- Verify the new lead was created with correct information

---

### Scenario 2: Existing Lead Follow-up

**Test Conversation Flow:**

1. **Turn 1:**
   ```json
   {
     "message": "Hi, this is Sarah Johnson from TechStart Inc. again.",
     "session_id": "scenario-2-existing"
   }
   ```
   **Expected:** Agent recognizes returning customer

2. **Turn 2:**
   ```json
   {
     "message": "I wanted to follow up on our previous conversation about the CRM solution.",
     "session_id": "scenario-2-existing"
   }
   ```
   **Expected:** Agent references previous conversation

3. **Turn 3:**
   ```json
   {
     "message": "We've reviewed the proposal and we're ready to move forward.",
     "session_id": "scenario-2-existing"
   }
   ```
   **Expected:** 
   - ✅ Agent updates lead status
   - ✅ CRM updated with new activity
   - ✅ Lead score may increase

**Check Results:**
- Verify in Supabase that the existing lead was updated
- Check `activities` table for new activity log

---

### Scenario 3: General Follow-up Questions

**Test Conversation Flow:**

1. **Turn 1:**
   ```json
   {
     "message": "I have a question about pricing.",
     "session_id": "scenario-3-questions"
   }
   ```
   **Expected:** Agent provides pricing information

2. **Turn 2:**
   ```json
   {
     "message": "What are your payment terms?",
     "session_id": "scenario-3-questions"
   }
   ```
   **Expected:** Agent explains payment terms

3. **Turn 3:**
   ```json
   {
     "message": "Do you offer a trial period?",
     "session_id": "scenario-3-questions"
   }
   ```
   **Expected:** Agent provides trial information

**Check Results:**
- Verify agent responses are appropriate
- Check that conversation context is maintained

---

## 🔍 Step 5: Verify Results

### Check Orchestrator Status

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/api/orchestrator/status" -Method Get
```

**Look for:**
- Total messages processed
- Routing accuracy
- Agent distribution

### Check Agent Status

```powershell
Invoke-RestMethod -Uri "http://localhost:8001/api/agents/status" -Method Get
```

**Look for:**
- Agent operational status
- Processing statistics
- Success rates

### Check Supabase Database

1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. Check these tables:
   - **`leads`** - Should have new leads from your tests
   - **`activities`** - Should have activity logs
   - **`companies`** - Should have company information if provided

---

## 📊 Testing Checklist

Use this checklist to track your manual testing:

### Configuration
- [ ] Server starts without errors
- [ ] All components initialize successfully
- [ ] TTS Model shows as "cartesia" (not "deepgram")
- [ ] STT Model shows as "groq"

### Text Message Processing
- [ ] Health check endpoint works
- [ ] `/api/message` endpoint processes messages
- [ ] Messages are correctly routed to sales agent
- [ ] Agent responses are appropriate

### Voice Interaction
- [ ] Voice stream initializes
- [ ] Microphone recording works
- [ ] Speech-to-text transcription works
- [ ] Text-to-speech output works
- [ ] Complete voice interaction cycle works

### Scenario 1: New Lead
- [ ] Lead is created in CRM
- [ ] Lead score is calculated
- [ ] Qualification status is set
- [ ] Company information is captured
- [ ] Budget and timeline are recorded

### Scenario 2: Existing Lead
- [ ] Existing lead is found/updated
- [ ] Activity is logged
- [ ] Conversation context is maintained
- [ ] Lead status is updated appropriately

### Scenario 3: Follow-up Questions
- [ ] Agent provides relevant answers
- [ ] Context is maintained across turns
- [ ] Responses are natural and helpful

### CRM Integration
- [ ] Leads appear in Supabase `leads` table
- [ ] Activities are logged in `activities` table
- [ ] Company information is stored correctly
- [ ] Lead scores are saved

---

## 🐛 Troubleshooting

### Issue: Server won't start
- Check if port 8001 is already in use
- Verify all dependencies are installed
- Check `.env` file has required keys

### Issue: Voice not working
- Check microphone permissions
- Verify audio drivers are working
- Check `TTS_MODEL` and `STT_MODEL` in `.env`
- Verify API keys (Groq for STT, Cartesia for TTS)

### Issue: CRM not updating
- Check Supabase connection
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
- Check Supabase logs for errors

### Issue: Agent not responding
- Check agent is enabled in `.env` (`SALES_AGENT_ENABLED=true`)
- Verify Groq API key is valid
- Check server logs for errors

---

## 📝 Notes

- Keep the server terminal open while testing
- Use different `session_id` values for different test scenarios
- Check server logs for detailed processing information
- Monitor Supabase dashboard to see real-time updates

---

## ✅ Success Criteria

Your manual testing is successful if:

1. ✅ Server starts and all components initialize
2. ✅ Text messages are processed correctly
3. ✅ Voice interaction works end-to-end
4. ✅ New leads are created in CRM
5. ✅ Existing leads are updated correctly
6. ✅ Lead scores are calculated appropriately
7. ✅ All activities are logged in CRM

---

**Happy Testing! 🚀**

