# Learnpad Agent Deployment Guide

This guide covers deploying the Learnpad Notebook Engine to Vertex AI and integrating it with the API.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Agent Architecture](#agent-architecture)
4. [Deployment Steps](#deployment-steps)
5. [API Integration](#api-integration)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)

## Overview

Learnpad uses a **single Vertex AI Agent Engine** called `learnpad-notebook-engine` that hosts three specialized agents:

- **`curriculum_planner`**: Designs learning curricula and notebook structures
- **`content_generator`**: Generates educational content (explanations, examples, exercises)
- **`notebook_loop_agent`**: Orchestrates notebook creation and uploads files to GCS

### Why One Engine?

Using a single Agent Engine for all three agents provides:
- **Unified session management**: One session tracks the entire notebook generation flow
- **Shared context**: Agents can access each other's outputs within the same session
- **Simpler ops**: One deployment, one engine ID, one set of credentials
- **Cost efficiency**: Fewer overhead costs vs. three separate engines

You can split into multiple engines later if needed (e.g., for independent scaling).

## Prerequisites

### 1. Google Cloud Setup

```bash
# Set your GCP project
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"  # or your preferred region

# Authenticate
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Enable required APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
```

### 2. Service Account (Production)

For production deployments, create a service account:

```bash
# Create service account
gcloud iam service-accounts create learnpad-api \
    --display-name="Learnpad API Service Account"

# Grant required roles
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:learnpad-api@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:learnpad-api@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# Download key (store securely!)
gcloud iam service-accounts keys create application_default_credentials.json \
    --iam-account=learnpad-api@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com
```

### 3. Python Environment

```bash
# Install dependencies
pip install -r requirements.txt

# Required packages for agents:
# - google-cloud-aiplatform
# - google-adk
# - google-generativeai
# - vertexai
```

### 4. GCS Bucket

Create a bucket for notebook storage:

```bash
# Create bucket
gsutil mb -p $GOOGLE_CLOUD_PROJECT -l $GOOGLE_CLOUD_LOCATION gs://your-learnpad-notebooks

# Set bucket permissions (for service account)
gsutil iam ch serviceAccount:learnpad-api@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com:roles/storage.objectAdmin \
    gs://your-learnpad-notebooks

# Set environment variable
export GCS_BUCKET_NAME="your-learnpad-notebooks"
```

## Agent Architecture

### Single Engine Design

```
┌──────────────────────────────────────────────────┐
│  Vertex AI Agent Engine: learnpad-notebook-engine│
│  ID: abc123xyz789                                │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  PRIMARY AGENT: notebook_loop_agent        │ │
│  │                                            │ │
│  │  Tools:                                    │ │
│  │  • generate_notebook() ─────────┐         │ │
│  │  • curriculum_planner (sub-agent)│         │ │
│  │  • content_generator (sub-agent) │         │ │
│  └────────────────────────────────────────────┘ │
│                        │                         │
│  ┌─────────────────────┼────────────────────┐   │
│  │  SUB-AGENT: curriculum_planner            │   │
│  │                     │                     │   │
│  │  Tools:             │                     │   │
│  │  • create_learning_path()                 │   │
│  │  • design_notebook_structure()            │   │
│  │  • determine_content_depth()              │   │
│  │  • plan_assessment_points()               │   │
│  │  • design_practice_progression()          │   │
│  │  • generate_complete_curriculum() ◀───────┘   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌───────────────────────────────────────────┐   │
│  │  SUB-AGENT: content_generator             │   │
│  │                                           │   │
│  │  Tools:                                   │   │
│  │  • generate_content() ◀────────────────────── │
│  │  • create_examples()                      │   │
│  │  • create_exercises()                     │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │  GCS Bucket                 │
        │  users/{user_id}/notebooks/ │
        │       {notebook_id}/        │
        │         sections/           │
        │           01_intro.md       │
        │           02_basics.md      │
        │           ...               │
        └─────────────────────────────┘
```

### Workflow

1. **API receives notebook generation request** → creates session with `notebook_loop_agent`
2. **notebook_loop_agent** calls `curriculum_planner` to design curriculum
3. **notebook_loop_agent** iterates through topics, calling `content_generator` for each
4. **notebook_loop_agent** uploads each generated section to GCS
5. **API receives** completion status with file metadata and curriculum details

## Deployment Steps

### Step 1: Configure Environment

Create or update `.env` file:

```bash
# Required
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GCS_BUCKET_NAME=your-learnpad-notebooks

# Optional (if using service account instead of ADC)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/application_default_credentials.json
```

### Step 2: Deploy Agents

```bash
cd /path/to/learnpad

# Deploy agents to Vertex AI
python -m src.agents.deploy_agents

# Or deploy with a test query
python -m src.agents.deploy_agents --test

# Or reuse an existing engine
python -m src.agents.deploy_agents --engine-id YOUR_EXISTING_ENGINE_ID
```

**Expected Output:**

```
✅ Successfully imported all agents
✅ Environment variables loaded
✅ Vertex client initialized (project=your-project, location=us-central1)
✅ Created new Agent Engine: abc123xyz789
✅ Session service created for engine: abc123xyz789
✅ Runner created for app: notebook_orchestrator
✅ Deployment metadata saved to: .../src/agents/deployment_metadata.json

============================================================
✅ DEPLOYMENT COMPLETE
============================================================

Agent Engine ID: abc123xyz789
App Name: notebook_orchestrator
Primary Agent: notebook_loop_agent
Sub-agents: curriculum_planner, content_generator

============================================================

To use this engine in your API, set:
  AGENT_ENGINE_ID=abc123xyz789
  AGENT_APP_NAME=notebook_orchestrator
```

### Step 3: Save Configuration

The deployment script automatically creates `src/agents/deployment_metadata.json`:

```json
{
  "agent_engine_id": "abc123xyz789",
  "engine_name": "learnpad-notebook-engine",
  "app_name": "notebook_orchestrator",
  "project": "your-project-id",
  "location": "us-central1",
  "agents": {
    "primary": "notebook_loop_agent",
    "sub_agents": [
      "curriculum_planner_agent",
      "content_generator_agent"
    ]
  }
}
```

Add the Agent Engine ID to your `.env`:

```bash
echo "NOTEBOOK_ENGINE_ID=abc123xyz789" >> .env
```

### Step 4: Verify Deployment

```bash
# Check that the engine exists
gcloud ai agent-engines list --region=$GOOGLE_CLOUD_LOCATION

# Run test query
python -m src.agents.deploy_agents --test --engine-id abc123xyz789
```

## API Integration

### Option 1: Using NotebookEngineClient (Recommended)

See [`src/api/AGENT_INTEGRATION.md`](src/api/AGENT_INTEGRATION.md) for detailed examples.

Quick example:

```python
from api.vertex_agent_client import create_notebook_engine_client_from_metadata
from agents.notebook_loop_agent.agent import root_agent as notebook_loop_agent
from google.adk.runners import Runner

# Initialize (reads deployment_metadata.json)
client = create_notebook_engine_client_from_metadata()

# Create runner
runner = Runner(
    agent=notebook_loop_agent,
    app_name="notebook_orchestrator",
    session_service=client.session_service
)

# Generate notebook
result = await client.generate_notebook(
    user_id="user123",
    notebook_id="nb456",
    subject="Python Basics",
    user_profile={"experience_level": "beginner"},
    learning_goals="Learn Python for data analysis",
    user_experience_level="beginner",
    bucket_name=os.getenv("GCS_BUCKET_NAME"),
    runner=runner
)
```

### Option 2: Direct Integration

```python
import os
from google.adk.sessions import VertexAiSessionService
from google.adk.runners import Runner
from agents.notebook_loop_agent.agent import root_agent as notebook_loop_agent

# Setup
session_service = VertexAiSessionService(
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION"),
    agent_engine_id=os.getenv("NOTEBOOK_ENGINE_ID"),
)

runner = Runner(
    agent=notebook_loop_agent,
    app_name="notebook_orchestrator",
    session_service=session_service
)

# Use in endpoints
# ... (see AGENT_INTEGRATION.md for full example)
```

## Verification & Testing

### Manual Test via Python

```python
import asyncio
import os
from src.agents.deploy_agents import deploy_notebook_engine

async def test():
    result = await deploy_notebook_engine(
        test_agent=True,
        existing_engine_id=os.getenv("NOTEBOOK_ENGINE_ID")
    )
    print("✅ Test passed!")

asyncio.run(test())
```

### Test API Endpoint

```bash
# Start FastAPI server
cd src/api
uvicorn server:app --host 0.0.0.0 --port 8001

# In another terminal, test notebook generation
curl -X POST http://localhost:8001/api/notebooks/generate-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_id": "test-user",
    "notebook_id": "test-notebook-001",
    "subject": "Python Basics",
    "user_profile": {
      "experience_level": "beginner",
      "learning_style": "hands_on"
    },
    "learning_goals": "Learn Python programming fundamentals",
    "user_experience_level": "beginner"
  }'
```

### Verify GCS Upload

```bash
# Check that files were uploaded
gsutil ls gs://your-learnpad-notebooks/users/test-user/notebooks/test-notebook-001/

# Expected output:
# gs://your-learnpad-notebooks/users/test-user/notebooks/test-notebook-001/sections/01_intro.md
# gs://your-learnpad-notebooks/users/test-user/notebooks/test-notebook-001/sections/02_basics.md
# ...
```

## Troubleshooting

### "Agent Engine ID not found"

**Problem:** `deployment_metadata.json` doesn't exist or NOTEBOOK_ENGINE_ID not set.

**Solution:**
```bash
# Redeploy agents
python -m src.agents.deploy_agents

# Set environment variable
export NOTEBOOK_ENGINE_ID=$(jq -r '.agent_engine_id' src/agents/deployment_metadata.json)
```

### "Authentication failed"

**Problem:** No valid credentials for Vertex AI.

**Solution:**
```bash
# For local development
gcloud auth application-default login

# For production, set service account
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### "Permission denied" on GCS

**Problem:** Service account lacks storage permissions.

**Solution:**
```bash
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member="serviceAccount:YOUR-SERVICE-ACCOUNT@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```

### "Module not found: agents.notebook_loop_agent"

**Problem:** Import path issues.

**Solution:**
```python
# Add src to path at top of your file
import sys
from pathlib import Path
src_path = Path(__file__).parent.parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))
```

### Agent calls timing out

**Problem:** Long-running notebook generation hitting timeout.

**Solution:**
```python
# Increase timeout in client
async with httpx.AsyncClient(timeout=300) as client:  # 5 minutes
    ...

# Or make generation async and poll for completion
asyncio.create_task(generate_notebook_async(...))
```

### High costs

**Problem:** Each notebook generation is expensive.

**Solution:**
- **Cache curricula**: Don't regenerate curriculum for similar requests
- **Batch requests**: Generate multiple sections in parallel
- **Use cheaper models**: Switch from `gemini-2.5-flash` to `gemini-1.5-flash` if acceptable
- **Limit retries**: Reduce retry attempts in `retry_config`

## Monitoring

### View Agent Logs

```bash
# In GCP Console
# Navigate to: Vertex AI → Agent Engines → [your-engine] → Logs

# Or via gcloud
gcloud logging read "resource.type=aiplatform.googleapis.com/AgentEngine" \
    --limit=50 \
    --format=json
```

### Track Costs

Set up budget alerts in GCP Console:
1. Go to Billing → Budgets & alerts
2. Create budget for Vertex AI
3. Set threshold alerts (e.g., 50%, 80%, 100%)

### Performance Metrics

Monitor in GCP Console → Vertex AI → Agent Engines → [engine] → Metrics:
- Request latency (p50, p95, p99)
- Request volume
- Error rate
- Token usage

## Production Checklist

- [ ] Service account created with minimal required permissions
- [ ] Credentials stored securely (not in code/git)
- [ ] Environment variables configured in deployment system
- [ ] GCS bucket has appropriate lifecycle policies
- [ ] Cost alerts configured
- [ ] Logging and monitoring set up
- [ ] Error handling and retries configured
- [ ] Rate limiting implemented in API
- [ ] Deployment metadata backed up
- [ ] Disaster recovery plan documented

## Next Steps

1. **Implement caching** for curriculum plans to reduce repeated LLM calls
2. **Add async processing** for long-running notebook generations
3. **Create monitoring dashboard** in GCP for agent usage
4. **Optimize prompts** to reduce token usage
5. **Consider multi-region deployment** for better latency/availability

## Additional Resources

- [Vertex AI Agent Engine Documentation](https://cloud.google.com/vertex-ai/docs/agent-engine)
- [ADK Python SDK Reference](https://github.com/google/genai-sdk-python)
- [API Integration Guide](src/api/AGENT_INTEGRATION.md)
- [Agent Development Docs](internal_docs/AGENT_SETUP.md)

