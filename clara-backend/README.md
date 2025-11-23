# 🤖 Clara Multi-Agent Backend

An intelligent multi-agent system for CRM automation using voice, email, and chatbot interfaces.

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- Supabase account
- OpenAI/Groq API key

### Installation

```bash
# Navigate to project directory
cd clara-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
```

### Configuration

Edit `.env` file with your credentials:
- Add your LLM API keys (OpenAI, Groq, etc.)
- Add Supabase credentials
- Configure which agents to enable

### Running the System

```bash
# Start the orchestrator
python main.py

# The API will be available at http://localhost:8001
```

## 📁 Project Structure

```
clara-backend/
├── orchestrator/          # Message routing and classification
├── agents/               # Individual AI agents
│   ├── sales_agent/     # FAHEEM: Lead qualification & scoring
│   ├── support_agent/   # HUSNAIN: Ticket handling
│   └── marketing_agent/ # SHERYAR: Feedback analysis
├── input_streams/        # Different input channels
├── crm_integration/      # Supabase CRM integration
├── utils/               # Shared utilities
└── tests/               # Unit tests
```

## 🎯 Agents

### Sales Agent (Faheem)
- Lead qualification
- Lead scoring
- CRM updates
- Follow-up scheduling

### Support Agent (Husnain)
- Ticket creation
- FAQ handling
- Issue escalation

### Marketing Agent (Sheryar)
- Feedback classification
- Sentiment analysis
- Campaign suggestions

## 🔗 API Endpoints

### Orchestrator
- `POST /api/message` - Process incoming message
- `GET /api/health` - Health check
- `GET /api/agents/status` - Check agent status

### Voice Stream
- `POST /api/voice/transcribe` - Convert voice to text
- `POST /api/voice/synthesize` - Convert text to voice

## 🧪 Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_sales_agent.py

# Run with coverage
pytest --cov=. --cov-report=html
```

## 📊 Architecture

```
Voice/Email/Chat → Orchestrator → Agent → CRM
                       ↓
                   Classifier
                       ↓
                    Router
```

## 🤝 Contributing

Each team member owns specific modules:
- **Faheem**: Sales Agent, Voice Integration
- **Husnain**: Support Agent, Email Integration
- **Sheryar**: Marketing Agent, Chatbot Integration
- **All**: Orchestrator

## 📝 License

Proprietary - FYP Project 2025

