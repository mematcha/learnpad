import os
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import requests


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # JWT Settings
    jwt_secret_key: str = Field(default="your-secret-key-change-in-production", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiration_hours: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    
    # Google OAuth Settings
    google_client_id: str = Field(default="", env="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", env="GOOGLE_CLIENT_SECRET")
    
    # CORS Settings
    cors_origins: list[str] = Field(default=["http://localhost:3000", "http://localhost:8000"], env="CORS_ORIGINS")
    
    class Config:
        env_file = ".env"


# Initialize settings
settings = Settings()

# Initialize FastAPI app
app = FastAPI(
    title="LearnPad API",
    description="Authentication-enabled API for LearnPad application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


# Pydantic models
class GoogleTokenRequest(BaseModel):
    """Request model for Google token verification."""
    token: str = Field(..., description="Google ID token")


class LoginResponse(BaseModel):
    """Response model for successful login."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user_info: Dict[str, Any] = Field(..., description="User information")


class UserInfo(BaseModel):
    """User information model."""
    sub: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    name: str = Field(..., description="User full name")
    picture: Optional[str] = Field(None, description="User profile picture URL")
    email_verified: bool = Field(default=False, description="Email verification status")


class TokenData(BaseModel):
    """Token payload data."""
    sub: str
    email: str
    name: str
    exp: datetime
    iat: datetime


# JWT Token utilities
class JWTHandler:
    """Handles JWT token creation and validation."""
    
    @staticmethod
    def create_access_token(user_data: Dict[str, Any]) -> str:
        """Create a JWT access token."""
        now = datetime.now(timezone.utc)
        expire = now + timedelta(hours=settings.jwt_expiration_hours)
        
        payload = {
            "sub": user_data["sub"],
            "email": user_data["email"],
            "name": user_data["name"],
            "iat": now,
            "exp": expire,
            "type": "access_token"
        }
        
        return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    
    @staticmethod
    def verify_token(token: str) -> TokenData:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(
                token, 
                settings.jwt_secret_key, 
                algorithms=[settings.jwt_algorithm]
            )
            
            # Check if token is expired
            exp_timestamp = payload.get("exp")
            if exp_timestamp:
                exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
                if datetime.now(timezone.utc) > exp_datetime:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired"
                    )
            
            return TokenData(
                sub=payload.get("sub"),
                email=payload.get("email"),
                name=payload.get("name"),
                exp=datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc),
                iat=datetime.fromtimestamp(payload.get("iat"), tz=timezone.utc)
            )
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )


# Google OAuth utilities
class GoogleAuthHandler:
    """Handles Google OAuth authentication."""
    
    @staticmethod
    def verify_google_token(token: str) -> Dict[str, Any]:
        """Verify Google ID token and extract user information."""
        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                settings.google_client_id
            )
            
            # Verify the issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            return {
                "sub": idinfo["sub"],
                "email": idinfo["email"],
                "name": idinfo["name"],
                "picture": idinfo.get("picture"),
                "email_verified": idinfo.get("email_verified", False)
            }
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}"
            )


# Authentication dependencies
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Dependency to get current authenticated user from JWT token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    token = credentials.credentials
    return JWTHandler.verify_token(token)


async def get_optional_user(request: Request) -> Optional[TokenData]:
    """Optional authentication dependency that doesn't raise errors."""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        return JWTHandler.verify_token(token)
    except:
        return None


# Authentication routes
@app.post("/auth/google", response_model=LoginResponse)
async def google_login(request: GoogleTokenRequest):
    """Authenticate user with Google ID token."""
    # Verify Google token and get user info
    user_info = GoogleAuthHandler.verify_google_token(request.token)
    
    # Create JWT access token
    access_token = JWTHandler.create_access_token(user_info)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.jwt_expiration_hours * 3600,  # Convert hours to seconds
        user_info=user_info
    )


@app.post("/auth/verify")
async def verify_token(current_user: TokenData = Depends(get_current_user)):
    """Verify if the current JWT token is valid."""
    return {
        "valid": True,
        "user": {
            "sub": current_user.sub,
            "email": current_user.email,
            "name": current_user.name,
            "exp": current_user.exp.isoformat(),
            "iat": current_user.iat.isoformat()
        }
    }


@app.post("/auth/refresh")
async def refresh_token(current_user: TokenData = Depends(get_current_user)):
    """Refresh the JWT token."""
    user_data = {
        "sub": current_user.sub,
        "email": current_user.email,
        "name": current_user.name
    }
    
    new_token = JWTHandler.create_access_token(user_data)
    
    return LoginResponse(
        access_token=new_token,
        token_type="bearer",
        expires_in=settings.jwt_expiration_hours * 3600,
        user_info=user_data
    )


# Public routes
@app.get("/")
async def root():
    """Public root endpoint."""
    return {
        "message": "LearnPad API",
        "version": "1.0.0",
        "status": "running",
        "authentication": "Google OAuth + JWT"
    }


@app.get("/health")
async def health_check():
    """Public health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "google_client_configured": bool(settings.google_client_id)
    }


# Protected routes examples
@app.get("/protected")
async def protected_route(current_user: TokenData = Depends(get_current_user)):
    """Example protected route that requires authentication."""
    return {
        "message": "This is a protected route",
        "user": {
            "sub": current_user.sub,
            "email": current_user.email,
            "name": current_user.name
        }
    }


@app.get("/profile")
async def get_profile(current_user: TokenData = Depends(get_current_user)):
    """Get current user profile."""
    return {
        "sub": current_user.sub,
        "email": current_user.email,
        "name": current_user.name,
        "token_issued_at": current_user.iat.isoformat(),
        "token_expires_at": current_user.exp.isoformat()
    }


@app.get("/optional-auth")
async def optional_auth_route(current_user: Optional[TokenData] = Depends(get_optional_user)):
    """Example route with optional authentication."""
    if current_user:
        return {
            "message": "Hello authenticated user!",
            "user": current_user.email
        }
    else:
        return {
            "message": "Hello anonymous user!",
            "note": "You can access this route without authentication"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
