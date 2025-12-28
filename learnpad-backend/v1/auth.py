from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from v1.models import AuthRequest, TokenResponse
import os
import logging
import secrets
from dotenv import load_dotenv
from pathlib import Path
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# In-memory token store (TODO: Replace with database in production)
# Maps token -> user_info
token_store: dict[str, dict] = {}

# Ensure .env is loaded (in case this module is imported before server.py)
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)

router = APIRouter()
logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")

if not GOOGLE_CLIENT_ID:
    logger.warning("GOOGLE_CLIENT_ID not set in environment variables")
    logger.warning(f"Looking for .env at: {env_path}")
    logger.warning(f".env exists: {env_path.exists()}")
else:
    logger.info(f"GOOGLE_CLIENT_ID loaded: {GOOGLE_CLIENT_ID[:20]}...")



@router.post("/auth/google")
async def google_auth(auth_req: AuthRequest):
    if not GOOGLE_CLIENT_ID:
        logger.error("GOOGLE_CLIENT_ID not configured")
        raise HTTPException(status_code=500, detail="Google OAuth2 credentials not configured")

    try:
        logger.info(f"Verifying Google ID token for client: {GOOGLE_CLIENT_ID}")
        
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(
            auth_req.token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        
        logger.info(f"Token verified successfully for user: {idinfo.get('email')}")
        
        # Extract user info matching frontend User type
        user_info = {
            "user_id": idinfo.get("sub"),
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
        }
        
        # TODO: Create/update user in database
        # TODO: Generate proper JWT token
        # For now, generate a simple session token
        session_token = secrets.token_urlsafe(32)
        
        # Store token -> user_info mapping (TODO: Use database)
        token_store[session_token] = user_info
        
        # Create response with user info
        response_data = {
            "access_token": session_token,
            "token_type": "bearer",
            "expires_in": 3600,
            "user_info": user_info
        }
        
        # Set httpOnly cookie with the access token
        response = JSONResponse(content=response_data)
        response.set_cookie(
            key="access_token",
            value=session_token,
            max_age=3600,  # 1 hour
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            path="/"
        )
        
        logger.info(f"Authentication successful, cookie set for user: {user_info.get('email')}")
        return response
    except ValueError as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during authentication: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")


@router.post("/auth/verify")
async def verify_auth(request: Request):
    """Verify the authentication token from cookie"""
    # Get token from cookie (try multiple methods for compatibility)
    token = request.cookies.get("access_token")
    
    # Also check Cookie header directly (for server-side requests from Next.js)
    if not token:
        cookie_header = request.headers.get("Cookie", "")
        for cookie in cookie_header.split(";"):
            cookie = cookie.strip()
            if cookie.startswith("access_token="):
                token = cookie.split("access_token=")[1].strip()
                break
    
    if not token:
        logger.debug("No access_token found in cookies")
        return {
            "valid": False,
            "user_info": None
        }
    
    # Check if token exists in store (TODO: Verify JWT signature in production)
    user_info = token_store.get(token)
    
    if not user_info:
        logger.debug(f"Token not found in store: {token[:10] if token else 'None'}...")
        return {
            "valid": False,
            "user_info": None
        }
    
    logger.info(f"Token verified for user: {user_info.get('email')}")
    return {
        "valid": True,
        "user_info": user_info
    }