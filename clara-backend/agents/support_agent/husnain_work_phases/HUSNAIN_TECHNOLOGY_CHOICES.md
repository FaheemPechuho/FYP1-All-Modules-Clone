# 🛠️ TECHNOLOGY CHOICES & OPTIONS - COMPLETE GUIDE

**For:** Husnain (Support Agent Owner)  
**Constraint:** ⚠️ NO PAID APIs - Everything must be FREE/Open-Source  
**Purpose:** Help you choose the best free alternatives for each component

---

## 📊 DECISION MATRIX: YOUR TECH STACK

| Component | ⭐ Recommended (Easy) | Alternative 1 (Better) | Alternative 2 (Advanced) |
|-----------|---------------------|----------------------|-------------------------|
| **LLM (for RAG)** | Ollama + Llama 3.1 8B | LM Studio + Mistral | HuggingFace Transformers |
| **Embeddings** | sentence-transformers | OpenAI (paid ❌) | Custom trained model |
| **Vector DB** | pgvector (PostgreSQL) | Chroma (standalone) | FAISS (in-memory) |
| **Classification** | scikit-learn TF-IDF+SVM | Fine-tuned DistilBERT | spaCy + custom rules |
| **Speech-to-Text** | faster-whisper | Whisper.cpp | Vosk (lightweight) |
| **Text-to-Speech** | pyttsx3 (offline) | Coqui TTS | Google TTS (paid ❌) |
| **Email** | Python imaplib/smtplib | Email integration libraries | - |
| **Backend** | FastAPI | Flask | Django |
| **Frontend** | React + Material-UI | React + Ant Design | Vue.js |
| **Database** | PostgreSQL 14+ | PostgreSQL 16 | MySQL (not recommended) |

---

## 🤖 LARGE LANGUAGE MODELS (FOR RAG ANSWERS)

### **Option 1: Ollama (⭐ HIGHLY RECOMMENDED)**

**Why Choose This:**
- ✅ Easiest setup (one installer)
- ✅ Works offline (no internet needed after download)
- ✅ OpenAI-compatible API (easy code)
- ✅ Good performance on 16GB RAM laptops
- ✅ Multiple models available

**Setup:**
```bash
# Download from https://ollama.ai/download
# Install .exe (Windows)

# Pull model (choose based on your RAM)
ollama pull llama3.1:8b      # 4.7GB - Best quality (16GB+ RAM)
ollama pull phi3:mini        # 2.3GB - Good balance (8GB RAM)
ollama pull gemma:2b         # 1.5GB - Lightweight (4GB RAM)

# Test
ollama run llama3.1:8b
```

**Python Code:**
```python
import ollama

response = ollama.chat(
    model='llama3.1:8b',
    messages=[
        {'role': 'system', 'content': 'You are a helpful support agent.'},
        {'role': 'user', 'content': 'How do I reset my password?'}
    ],
    options={'temperature': 0.3, 'num_predict': 150}
)

answer = response['message']['content']
```

**Pros:**
- 100% free
- No API key needed
- Works offline
- Fast responses (2-5 seconds)
- Multiple model choices

**Cons:**
- Requires 8-16GB RAM
- First download is large (~5GB)
- Slightly slower than cloud APIs

---

### **Option 2: LM Studio (ALTERNATIVE)**

**Why Choose This:**
- ✅ Beautiful GUI (easier than command line)
- ✅ Download models with one click
- ✅ Built-in model search
- ✅ Windows-friendly

**Setup:**
```
1. Download from https://lmstudio.ai/
2. Install
3. Open LM Studio
4. Search for "Llama-3.1-8B"
5. Click Download
6. Click "Start Server"
7. Use API at http://localhost:1234/v1
```

**Python Code:**
```python
import requests

response = requests.post(
    'http://localhost:1234/v1/chat/completions',
    json={
        'model': 'llama-3.1-8b',
        'messages': [
            {'role': 'user', 'content': 'How do I reset my password?'}
        ],
        'temperature': 0.3
    }
)

answer = response.json()['choices'][0]['message']['content']
```

**Pros:**
- User-friendly GUI
- No command line needed
- OpenAI-compatible API
- Model library built-in

**Cons:**
- Requires 12-16GB RAM
- Larger application size
- GUI might be slower

---

### **Option 3: HuggingFace Transformers (ADVANCED)**

**Why Choose This:**
- ✅ More control over model
- ✅ Can fine-tune models
- ✅ Access to all HuggingFace models
- ✅ Good for research/academic projects

**Setup:**
```bash
pip install transformers torch accelerate
```

**Python Code:**
```python
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

# Load model (downloads once, ~5GB)
model_name = "microsoft/phi-2"  # Smaller model for laptops
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    device_map="auto",
    torch_dtype="auto"
)

# Generate answer
generator = pipeline('text-generation', model=model, tokenizer=tokenizer)

prompt = """Answer this question: How do I reset my password?

Answer:"""

result = generator(prompt, max_length=200, temperature=0.3)
answer = result[0]['generated_text'].split('Answer:')[1].strip()
```

**Pros:**
- Full control
- Can fine-tune
- Research-grade

**Cons:**
- More complex setup
- Requires CUDA/GPU for speed
- Steeper learning curve
- Slower inference

---

## 🔍 EMBEDDINGS (FOR SEMANTIC SEARCH)

### **Option 1: sentence-transformers (⭐ RECOMMENDED)**

**Why Choose This:**
- ✅ Easiest to use
- ✅ Pre-trained models
- ✅ Great quality
- ✅ Fast inference

**Setup:**
```bash
pip install sentence-transformers
```

**Python Code:**
```python
from sentence_transformers import SentenceTransformer

# Load model (downloads once, ~80MB)
model = SentenceTransformer('all-MiniLM-L6-v2')

# Generate embeddings
texts = [
    "How do I reset my password?",
    "I can't login to my account",
    "What are your business hours?"
]

embeddings = model.encode(texts)
# Returns numpy array of shape (3, 384)

# For single text
single_embedding = model.encode("Password reset help")
```

**Model Choices:**

| Model | Size | Dimensions | Speed | Quality | Use Case |
|-------|------|-----------|-------|---------|----------|
| `all-MiniLM-L6-v2` | 80MB | 384 | ⚡⚡⚡ | ⭐⭐⭐ | **General (Best)** |
| `all-mpnet-base-v2` | 420MB | 768 | ⚡⚡ | ⭐⭐⭐⭐ | High quality |
| `paraphrase-MiniLM-L3-v2` | 60MB | 384 | ⚡⚡⚡⚡ | ⭐⭐ | Fast, lower quality |
| `multi-qa-MiniLM-L6-cos-v1` | 80MB | 384 | ⚡⚡⚡ | ⭐⭐⭐⭐ | **Q&A specific** |

**Recommendation:** Start with `all-MiniLM-L6-v2` (balanced), switch to `multi-qa-MiniLM-L6-cos-v1` if focusing on Q&A.

**Pros:**
- 100% free
- No API key
- Works offline
- Very fast (~1000 sentences/second on CPU)
- Good quality

**Cons:**
- Not as good as OpenAI's text-embedding-3 (but that's paid)
- Fixed model (can't fine-tune easily)

---

## 📊 NLP CLASSIFICATION

### **Option 1: scikit-learn TF-IDF + SVM (⭐ RECOMMENDED FOR BEGINNERS)**

**Why Choose This:**
- ✅ Fast training (< 1 minute)
- ✅ Fast inference (< 50ms)
- ✅ Easy to understand
- ✅ No GPU needed
- ✅ Can reach 85-90% accuracy

**Python Code:**
```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import joblib

# Training data
texts = [
    "I can't login",
    "Password reset help",
    "I was charged twice",
    "Need a refund",
    # ... 1000+ more samples
]
labels = ["technical", "technical", "billing", "billing", ...]

# Split data
X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2)

# Create pipeline
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
    ('classifier', SVC(kernel='linear', probability=True))
])

# Train
pipeline.fit(X_train, y_train)

# Test
accuracy = pipeline.score(X_test, y_test)
print(f"Accuracy: {accuracy:.2%}")

# Save model
joblib.dump(pipeline, 'ticket_classifier.pkl')

# Predict
prediction = pipeline.predict(["My account is locked"])
confidence = pipeline.predict_proba(["My account is locked"]).max()
```

**Pros:**
- Very fast
- No GPU needed
- Easy to debug
- Small model size (~5MB)
- Transparent (can see feature importance)

**Cons:**
- Needs good training data (1000+ samples)
- Not as accurate as deep learning
- Doesn't understand context well

---

### **Option 2: Fine-tuned DistilBERT (BETTER ACCURACY)**

**Why Choose This:**
- ✅ 90-95% accuracy (better than SVM)
- ✅ Understands context
- ✅ Transfer learning (needs less data)

**Setup:**
```bash
pip install transformers datasets torch
```

**Python Code:**
```python
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset

# Load pretrained model
tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
model = DistilBertForSequenceClassification.from_pretrained(
    'distilbert-base-uncased',
    num_labels=3  # technical, billing, general
)

# Prepare data
train_texts = ["I can't login", "Password reset help", ...]
train_labels = [0, 0, 1, 1, 2, ...]  # 0=technical, 1=billing, 2=general

def tokenize(batch):
    return tokenizer(batch['text'], padding=True, truncation=True)

dataset = Dataset.from_dict({'text': train_texts, 'label': train_labels})
dataset = dataset.map(tokenize, batched=True)

# Training arguments
training_args = TrainingArguments(
    output_dir='./results',
    num_train_epochs=3,
    per_device_train_batch_size=16,
    learning_rate=2e-5,
)

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
)

trainer.train()

# Save
model.save_pretrained('./ticket_classifier_bert')

# Predict
inputs = tokenizer("My account is locked", return_tensors='pt')
outputs = model(**inputs)
prediction = outputs.logits.argmax(-1).item()
```

**Pros:**
- Higher accuracy
- Better context understanding
- Transfer learning

**Cons:**
- Slower inference (100-200ms)
- Needs GPU for training (use Google Colab free)
- Larger model (~250MB)
- More complex

**When to use:** If scikit-learn can't reach 80% accuracy, upgrade to this.

---

## 🎤 SPEECH-TO-TEXT (VOICE INTEGRATION)

### **Option 1: faster-whisper (⭐ RECOMMENDED)**

**Why Choose This:**
- ✅ OpenAI's Whisper model (excellent quality)
- ✅ 2-5x faster than original Whisper
- ✅ Works offline
- ✅ Multiple model sizes

**Setup:**
```bash
pip install faster-whisper
```

**Python Code:**
```python
from faster_whisper import WhisperModel

# Choose model size based on laptop
# tiny    (39 MB)  - Fast, 85% accuracy
# base    (74 MB)  - Good balance
# small   (244 MB) - High accuracy
# medium  (769 MB) - Very high accuracy (⭐ recommended)
# large   (1550 MB) - Best accuracy (slow)

model = WhisperModel("medium", device="cpu", compute_type="int8")

# Transcribe audio file
segments, info = model.transcribe("audio.mp3", language="en")

for segment in segments:
    print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")

# Or get full transcript
transcript = " ".join([segment.text for segment in segments])
```

**Pros:**
- Excellent accuracy (95%+)
- Works offline
- Multiple language support
- Punctuation included
- Speaker diarization

**Cons:**
- Requires ~2-4GB RAM
- Medium model is ~800MB download
- CPU: 5-10 seconds per minute of audio
- GPU: Real-time transcription

---

### **Option 2: Vosk (LIGHTWEIGHT)**

**Why Choose This:**
- ✅ Very small models (< 50MB)
- ✅ Real-time capable on CPU
- ✅ Low memory usage

**Setup:**
```bash
pip install vosk
# Download model from https://alphacephei.com/vosk/models
```

**Python Code:**
```python
from vosk import Model, KaldiRecognizer
import wave

model = Model("vosk-model-small-en-us-0.15")
wf = wave.open("audio.wav", "rb")

rec = KaldiRecognizer(model, wf.getframerate())

while True:
    data = wf.readframes(4000)
    if len(data) == 0:
        break
    rec.AcceptWaveform(data)

result = rec.FinalResult()
```

**Pros:**
- Very fast
- Small model size
- Low resource usage
- Real-time capable

**Cons:**
- Lower accuracy (~85%)
- Less natural punctuation
- Fewer languages

---

## 💾 VECTOR DATABASE (FOR RAG)

### **Option 1: pgvector (⭐ RECOMMENDED)**

**Why Choose This:**
- ✅ Integrated with PostgreSQL (you already have it)
- ✅ No extra database to manage
- ✅ ACID guarantees
- ✅ Good performance (<100ms queries)

**Setup:**
```sql
-- In PostgreSQL
CREATE EXTENSION vector;

CREATE TABLE kb_embeddings (
    id UUID PRIMARY KEY,
    chunk_id UUID,
    embedding VECTOR(384),
    content TEXT
);

CREATE INDEX ON kb_embeddings USING ivfflat (embedding vector_cosine_ops);
```

**Python Code:**
```python
import psycopg2
import numpy as np

conn = psycopg2.connect("dbname=clara_crm user=postgres")
cur = conn.cursor()

# Insert embedding
embedding = np.random.rand(384).tolist()
cur.execute(
    "INSERT INTO kb_embeddings (id, embedding, content) VALUES (%s, %s, %s)",
    (uuid4(), embedding, "How to reset password...")
)

# Search
query_embedding = np.random.rand(384).tolist()
cur.execute(
    """
    SELECT content, 1 - (embedding <=> %s) as similarity
    FROM kb_embeddings
    ORDER BY embedding <=> %s
    LIMIT 5
    """,
    (query_embedding, query_embedding)
)

results = cur.fetchall()
```

**Pros:**
- No extra database
- ACID transactions
- Mature and stable
- Good documentation

**Cons:**
- Slightly slower than specialized vector DBs
- Setup requires index tuning

---

### **Option 2: Chroma (ALTERNATIVE)**

**Why Choose This:**
- ✅ Purpose-built for embeddings
- ✅ Very easy setup
- ✅ Good for prototyping

**Setup:**
```bash
pip install chromadb
```

**Python Code:**
```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("kb_chunks")

# Add embeddings
collection.add(
    embeddings=[[0.1, 0.2, ...], [0.3, 0.4, ...]],
    documents=["How to reset password", "Login issues"],
    ids=["chunk1", "chunk2"]
)

# Query
results = collection.query(
    query_embeddings=[[0.15, 0.25, ...]],
    n_results=5
)
```

**Pros:**
- Very simple API
- Fast queries
- Built-in metadata filtering

**Cons:**
- Separate database to manage
- Less mature than PostgreSQL
- No ACID guarantees

---

## 📧 EMAIL INTEGRATION

**Only One Good Free Option: Python Built-ins**

```python
import imaplib
import smtplib
from email.mime.text import MIMEText

# Receive emails (IMAP)
mail = imaplib.IMAP4_SSL('imap.gmail.com')
mail.login('support@company.com', 'app_password')
mail.select('inbox')
status, messages = mail.search(None, 'UNSEEN')
# ... process emails

# Send emails (SMTP)
msg = MIMEText('Your ticket is resolved!')
msg['Subject'] = '[Ticket #12345] Resolved'
msg['From'] = 'support@company.com'
msg['To'] = 'customer@email.com'

smtp = smtplib.SMTP_SSL('smtp.gmail.com', 465)
smtp.login('support@company.com', 'app_password')
smtp.send_message(msg)
smtp.quit()
```

**Gmail App Password Setup:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Use this password (NOT your real password!)

---

## 🎯 RECOMMENDED FINAL STACK FOR YOU

```
┌─────────────────────────────────────────┐
│  HUSNAIN'S RECOMMENDED TECH STACK       │
├─────────────────────────────────────────┤
│                                         │
│  LLM: Ollama + Llama 3.1 8B            │
│  Embeddings: sentence-transformers      │
│  Vector DB: pgvector (PostgreSQL)       │
│  Classification: scikit-learn (SVM)     │
│  STT: faster-whisper (medium)          │
│  Email: Python imaplib/smtplib          │
│                                         │
│  Backend: FastAPI + Python 3.10        │
│  Database: PostgreSQL 14+               │
│  Frontend: React + Material-UI          │
│                                         │
│  Total Cost: $0 (100% FREE)            │
│                                         │
└─────────────────────────────────────────┘
```

**Why This Stack:**
- ✅ All free and open-source
- ✅ Works on 16GB RAM laptop
- ✅ Good balance of quality and speed
- ✅ Mature, well-documented tools
- ✅ Easy to learn and debug
- ✅ Production-ready

---

## 📊 PERFORMANCE COMPARISON

| Component | Speed | Quality | Resource | Setup |
|-----------|-------|---------|----------|-------|
| **Ollama Llama 3.1 8B** | 2-5s | ⭐⭐⭐⭐ | 8GB RAM | Easy |
| **sentence-transformers** | <100ms | ⭐⭐⭐⭐ | 500MB RAM | Easy |
| **scikit-learn SVM** | <50ms | ⭐⭐⭐ | 100MB RAM | Easy |
| **pgvector** | <100ms | ⭐⭐⭐⭐ | Shared | Medium |
| **faster-whisper** | 5-10s/min | ⭐⭐⭐⭐⭐ | 2GB RAM | Easy |

---

## ✅ FINAL RECOMMENDATIONS

**For FYP Success, Use:**
1. **Ollama** - Easiest LLM setup, works offline
2. **sentence-transformers** - Best free embeddings
3. **scikit-learn** - Fast, transparent classification
4. **pgvector** - No extra database to manage
5. **faster-whisper medium** - Best STT accuracy/speed balance

**Upgrade Later (if time permits):**
- scikit-learn → DistilBERT (if accuracy < 80%)
- Llama 3.1 8B → Llama 3.1 70B (if you get a better laptop)

**Don't Use:**
- ❌ Any paid API (OpenAI, Anthropic, etc.)
- ❌ Cloud-only services (your FYP should work offline)
- ❌ Unstable/experimental tools

---

**Start with the recommended stack. It's proven, reliable, and will get you to 90% of what you need!** 🎯
