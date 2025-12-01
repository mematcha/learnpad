# Learnpad MCP Server

A minimal FastAPI server meant to act as a companion process (e.g., MCP/sidecar) for Learnpad.

## Setup

```bash
cd src/mcp
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Development

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --port 9000
```

This exposes `/health` and `/` endpoints. Extend `app/routers` to add MCP-specific functionality.

