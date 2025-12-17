from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from v1 import auth as auth_v1
from dotenv import load_dotenv
import os
from pathlib import Path

# Get the directory where this file is located
backend_dir = Path(__file__).parent

# Load environment variables from .env file in the backend directory
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)

# Verify critical environment variables are loaded
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
if not GOOGLE_CLIENT_ID:
    print("WARNING: GOOGLE_CLIENT_ID not found in environment variables!")
    print(f"Looking for .env file at: {env_path}")
    print(f".env file exists: {env_path.exists()}")
    if env_path.exists():
        print(f".env file contents:")
        with open(env_path, 'r') as f:
            print(f.read())
    print("Please ensure .env file exists in the learnpad-backend directory with:")
    print("GOOGLE_CLIENT_ID=your-client-id-here")
else:
    print(f"✓ GOOGLE_CLIENT_ID loaded: {GOOGLE_CLIENT_ID[:20]}...")
app = FastAPI(
    title="LearnPad Backend",
    description="Backend Applicationfor LearnPad",
    version="0.1.0",
    docs_url="/docs"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

app.include_router(auth_v1.router)

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)