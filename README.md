# learnpad

Learnpad is an L4-level adaptive learning system that delivers fully personalized, notebook-based educational content. It blends notebooks, interactive sandboxes and agentic teaching loops that evolve as the user learns.

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

### Prerequisites

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

- **[AGENT_DEPLOYMENT.md](AGENT_DEPLOYMENT.md)** - Complete agent deployment guide
- **[src/api/AGENT_INTEGRATION.md](src/api/AGENT_INTEGRATION.md)** - API integration patterns
- **[internal_docs/](internal_docs/)** - Architecture and development docs
  - [AGENT_SETUP.md](internal_docs/AGENT_SETUP.md) - Agent development guide
  - [NOTEBOOK_API_DESIGN.md](internal_docs/NOTEBOOK_API_DESIGN.md) - API design
  - [notebooks/](internal_docs/notebooks/) - Tutorial notebooks on agent architectures

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

## Development

### Running Tests

```bash
# Agent tests
python -m pytest tests/agents/

# API tests
cd src/api
python -m pytest tests/

# Frontend tests
cd src/app
npm test
```

### Local Agent Development

For local agent development without Vertex AI:

```python
# Agents can run locally using google.generativeai SDK
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