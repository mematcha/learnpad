# Learnpad FastAPI Backend

Barebones FastAPI project used as the backend skeleton for Learnpad.

## Setup

```bash
cd src/fastapi
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Development server

```bash
source .venv/bin/activate
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`. Visit `/docs` for the automatically generated Swagger UI.

