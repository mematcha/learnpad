# LearnPad

LearnPad is an L4-level adaptive learning system that delivers fully personalized, notebook-based educational content. It blends notebooks, interactive sandboxes and agentic teaching loops that evolve as the user learns.

## Kaggle AI Agents Course - Capstone Project

This project demonstrates key concepts from the Kaggle AI Agents course:

1. **Agent Architecture** ✓
   - Multi-agent system with specialized agents (curriculum planner, content generator, notebook orchestrator)
   - Loop agent pattern for iterative notebook generation
   - Sub-agent coordination for complex workflows

2. **Tools** ✓
   - Custom tools for curriculum generation, content creation, and GCS storage
   - Integration with Google Cloud Storage for file persistence
   - Built-in tools (Gemini models for content generation)

3. **Sessions & Memory** ✓
   - Session management for user assessment and conversation tracking
   - State management for notebook generation progress
   - Context compaction for efficient agent interactions

**Track:** Agents for Good (Education)

**Problem:** Creating high-quality, personalized learning materials is time-intensive and often fails to adapt to individual learning styles.

**Solution:** LearnPad uses AI agents to automatically generate complete, structured study notebooks tailored to each user's experience level, learning goals, and preferences.

## Architecture

LearnPad uses a microservices architecture with AI agents deployed to Vertex AI Agent Engine:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────────────────┐
│   Next.js App   │  HTTP   │  FastAPI Server │  ADK    │  Vertex AI Agent Engine     │
│   (Port 3000)   │────────▶│   (Port 8001)   │  SDK   │  (learnpad-notebook-engine) │
│                 │         │                 │────────▶│                             │
│                 │         │  ✅ No direct   │         │  Primary:                   │
│                 │         │     agent       │         │  • notebook_loop_agent      │
│                 │         │     imports     │         │                             │
│                 │         │                 │         │  Sub-agents:                │
│                 │         │                 │         │  • curriculum_planner       │
│                 │         │                 │         │  • content_generator        │
└─────────────────┘         └─────────────────┘         └─────────────────────────────┘
                                                                      │
                                                                      ▼
                                                         ┌──────────────────────────┐
                                                         │  GCS Bucket              │
                                                         │  Notebook Storage        │
                                                         │  users/{user_id}/        │
                                                         │    notebooks/{nb_id}/    │
                                                         └──────────────────────────┘
```

### Components

- **Next.js Frontend** (Port 3000): React-based user interface with real-time collaboration
- **FastAPI Server** (Port 8001): REST API handling auth, storage, and business logic
- **Vertex AI Agent Engine**: Single managed engine hosting three specialized agents:
  - `notebook_loop_agent` (primary): Orchestrates notebook creation
  - `curriculum_planner`: Designs learning paths and curricula
  - `content_generator`: Generates educational content
- **GCS Storage**: Persistent storage for generated notebooks

### Key Design Decisions

1. **Single Agent Engine**: All three agents run in one Vertex AI Agent Engine for:
   - Unified session management
   - Shared context between agents
   - Simpler operations and lower overhead
   - Cost efficiency

2. **ADK SDK Integration**: API uses Google ADK SDK (not HTTP endpoints) for:
   - Automatic authentication via Application Default Credentials
   - Built-in session management and retries
   - Type-safe agent interactions
   - Native event streaming

3. **GCS-First Storage**: Notebooks are generated directly to GCS by agents, avoiding:
   - Large data transfers through the API
   - Temporary file management
   - Multi-step upload flows

## Quick Start

**Two deployment options:**

### Option A: Local Development (Recommended for Testing)

Complete local setup without agent deployment. Perfect for testing the full flow: frontend → backend → GCS.

**Prerequisites:**
- Python 3.9+
- Node.js 18+
- Google Cloud SDK (`gcloud`)
- GCS bucket created

**Setup Instructions:** See **[LOCAL_TEST_WORKFLOW.md](LOCAL_TEST_WORKFLOW.md)** for complete step-by-step guide.

**Quick summary:**
```bash
# 1. Authenticate with GCS
gcloud auth application-default login

# 2. Configure backend (.env)
cd src/api
cp env.template .env
# Edit .env with your GCS bucket and project ID

# 3. Configure frontend (.env.local)
cd src/app
cp env.template .env.local
# Edit .env.local with your Google OAuth Client ID

# 4. Start services
# Terminal 1: Backend
cd src/api && uvicorn server:app --port 8001 --reload

# Terminal 2: Frontend
cd src/app && npm run dev
```

Visit `http://localhost:3000` and generate a notebook!

### Option B: Production Deployment with Vertex AI Agents

Deploy agents to Vertex AI Agent Engine for production-grade AI content generation.

**Prerequisites:**
- Python 3.11+
- Node.js 18+
- Google Cloud Project with Vertex AI enabled
- GCS bucket for notebook storage

### 1. Deploy Agents to Vertex AI

```bash
# Set up environment
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GCS_BUCKET_NAME="your-learnpad-notebooks"

# Authenticate
gcloud auth application-default login

# Deploy agents
python -m src.agents.deploy_agents

# Save the Agent Engine ID from output
export NOTEBOOK_ENGINE_ID="<agent-engine-id-from-output>"
```

See **[AGENT_DEPLOYMENT.md](AGENT_DEPLOYMENT.md)** for detailed deployment instructions.

### 2. Start API Server

```bash
cd src/api

# Install dependencies
pip install -r requirements.txt

# Configure environment
cat > .env << EOF
GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT
GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION
NOTEBOOK_ENGINE_ID=$NOTEBOOK_ENGINE_ID
GCS_BUCKET_NAME=$GCS_BUCKET_NAME
EOF

# Run server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Start Frontend

```bash
cd src/app

# Install dependencies
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local

# Run dev server
npm run dev
```

Visit `http://localhost:3000` to use Learnpad.

## Documentation

### Getting Started
- **[LOCAL_TEST_WORKFLOW.md](LOCAL_TEST_WORKFLOW.md)** - Complete local setup and testing guide ⭐
- **[LOCAL_SETUP.md](LOCAL_SETUP.md)** - Architecture and endpoint documentation
- **[GCS_AUTH_SETUP.md](GCS_AUTH_SETUP.md)** - GCS authentication and configuration

### Deployment & Integration
- **[AGENT_DEPLOYMENT.md](AGENT_DEPLOYMENT.md)** - Vertex AI agent deployment guide
- **[src/api/AGENT_INTEGRATION.md](src/api/AGENT_INTEGRATION.md)** - API integration patterns
- **[src/api/QUICK_START.md](src/api/QUICK_START.md)** - API quick start

### Development
- **[internal_docs/](internal_docs/)** - Architecture and development docs
  - [AGENT_SETUP.md](internal_docs/AGENT_SETUP.md) - Agent development guide
  - [NOTEBOOK_API_DESIGN.md](internal_docs/NOTEBOOK_API_DESIGN.md) - API design
  - [notebooks/](internal_docs/notebooks/) - Tutorial notebooks on agent architectures
  - [capstone_guidelines.md](internal_docs/capstone_guidelines.md) - Capstone rubric and requirements

## Project Structure

```
learnpad/
├── src/
│   ├── agents/                      # AI agents (deployed to Vertex AI)
│   │   ├── curriculum_planner/     # Designs learning curricula
│   │   ├── content_generator/      # Generates educational content
│   │   ├── notebook_loop_agent/    # Orchestrates notebook creation
│   │   ├── deploy_agents.py        # Deployment script
│   │   └── deployment_metadata.json # Generated after deployment
│   ├── api/                         # FastAPI server
│   │   ├── server.py               # Main API server
│   │   ├── vertex_agent_client.py  # Vertex AI client wrapper
│   │   └── AGENT_INTEGRATION.md    # Integration guide
│   ├── app/                         # Next.js frontend
│   │   ├── app/                    # App router pages
│   │   ├── components/             # React components
│   │   └── lib/                    # Frontend utilities
│   └── storage/                     # GCS storage utilities
│       ├── gcs_storage.py          # GCS client
│       └── file_tree.py            # File tree helpers
├── internal_docs/                   # Internal documentation
│   ├── notebooks/                  # Tutorial notebooks
│   └── whitepapers/                # Reference materials
├── AGENT_DEPLOYMENT.md             # Deployment guide
└── README.md                       # This file
```

## Key Features

### Adaptive Learning Path
- AI-powered user assessment to identify experience level and learning preferences
- Dynamic curriculum generation based on user profile
- Iterative content generation that builds progressively on previous topics

### Notebook Generation
- Complete study notebooks with structured markdown files
- Topic-based organization with subtopics and cross-references
- Progress tracking and learning objectives
- Automatic upload to Google Cloud Storage

### Multi-Agent Architecture
- **Curriculum Planner**: Designs learning paths and content structure
- **Content Generator**: Creates educational content for each topic
- **Notebook Loop Agent**: Orchestrates the entire generation process
- **User Assessment Agent**: Conducts conversational assessment of user needs

### Storage & Retrieval
- GCS-first architecture: files uploaded directly during generation
- RESTful API for file tree navigation and content retrieval
- Signed URLs for efficient frontend access
- Hierarchical folder structure: `users/{user_id}/notebooks/{notebook_id}/`

## Development

### Local Testing Without Agents

The backend is designed to work **without deployed agents** for local testing. It will generate notebook structure with placeholder content, allowing you to test:
- Complete API flow (auth → generation → file storage)
- GCS upload integration
- Frontend UI for notebook display and navigation
- File tree rendering

See **[LOCAL_TEST_WORKFLOW.md](LOCAL_TEST_WORKFLOW.md)** for detailed testing instructions.

### Running Tests

```bash
# Backend API tests
cd src/api
python -m pytest tests/ # (if tests exist)

# Frontend tests
cd src/app
npm test

# Manual end-to-end test
# Follow LOCAL_TEST_WORKFLOW.md
```

### Local Agent Development

For local agent development without Vertex AI:

```python
# Agents can run locally using google-genai SDK
# Set GOOGLE_API_KEY in .env

from agents.content_generator.agent import generate_content

content = generate_content(
    topic="Python Functions",
    category="explanation",
    difficulty_level="beginner"
)
```

### Deploying Updates

When you update agent code:

```bash
# Redeploy to the same engine
python -m src.agents.deploy_agents --engine-id $NOTEBOOK_ENGINE_ID

# Or create a new engine for blue-green deployment
python -m src.agents.deploy_agents  # Gets new ID
# Update NOTEBOOK_ENGINE_ID after testing
```

## Monitoring & Observability

### View Agent Logs

```bash
# Via gcloud
gcloud logging read "resource.type=aiplatform.googleapis.com/AgentEngine" \
    --limit=50 --format=json

# Or in GCP Console:
# Vertex AI → Agent Engines → [your-engine] → Logs
```

### Track Costs

Set up budget alerts in GCP Console → Billing → Budgets & alerts

### Performance Metrics

Monitor in GCP Console → Vertex AI → Agent Engines → Metrics:
- Request latency
- Token usage
- Error rates

## Troubleshooting

### "Agent Engine ID not found"

```bash
# Redeploy agents
python -m src.agents.deploy_agents

# Or check existing engines
gcloud ai agent-engines list --region=$GOOGLE_CLOUD_LOCATION
```

### "Authentication failed"

```bash
# Ensure you're authenticated
gcloud auth application-default login

# Or set service account
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### "Permission denied" on GCS

Grant storage permissions to your service account:

```bash
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:YOUR-SA@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```

See [AGENT_DEPLOYMENT.md](AGENT_DEPLOYMENT.md#troubleshooting) for more troubleshooting tips.

## License

[Your License Here]