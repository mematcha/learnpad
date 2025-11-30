import os
import jwt
import uuid
import json
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, status, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import requests

# Add src to path for agent imports
import sys
from pathlib import Path

src_path = Path(__file__).parent.parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

# Import storage after path is configured
from storage import gcs_storage

# Import ADK components
try:
    from google.adk.runners import InMemoryRunner
except ImportError as e:
    print(f"Warning: Could not import InMemoryRunner: {e}")
    InMemoryRunner = None

# Import agents
user_assessment_agent = None
curriculum_planner_agent = None
content_generator_agent = None

try:
    from agents.user_assessment.agent import root_agent as user_assessment_agent
except ImportError as e:
    print(f"Warning: Could not import user_assessment_agent: {e}")

try:
    from agents.curriculum_planner.agent import root_agent as curriculum_planner_agent
except ImportError as e:
    print(f"Warning: Could not import curriculum_planner_agent: {e}")

try:
    from agents.content_generator.agent import root_agent as content_generator_agent
except ImportError as e:
    print(f"Warning: Could not import content_generator_agent: {e}")

# Import notebook generator
NotebookGenerator = None
try:
    from agents.study_notes_generator.notebook_generator import NotebookGenerator
except ImportError as e:
    print(f"Warning: Could not import NotebookGenerator: {e}")


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # JWT Settings
    jwt_secret_key: str = Field(default="your-secret-key-change-in-production", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiration_hours: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    
    # Google OAuth Settings
    google_client_id: str = Field(default="", env="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", env="GOOGLE_CLIENT_SECRET")
    

    # GCS Settings
    gcs_project_id: str = Field(default="learnpad-gcp", env="GCS_PROJECT_ID")
    gcs_bucket_name: str = Field(default="learnpad-gcp-dev", env="GCS_BUCKET_NAME")
    gcs_credentials_path: str = Field(default="learnpad-backend-key.json", env="GCS_CREDENTIALS_PATH")
    gcs_base_path: str = Field(default="users", env="GCS_BASE_PATH")
    # CORS Settings
    cors_origins: list[str] = Field(default=["http://localhost:3000", "http://localhost:8001"], env="CORS_ORIGINS")
    
    # Notebook Settings
    notebooks_base_path: str = Field(default="./notebooks", env="NOTEBOOKS_BASE_PATH")
    assessment_session_ttl_hours: int = Field(default=24, env="ASSESSMENT_SESSION_TTL_HOURS")
    
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
    picture: Optional[str] = None
    exp: datetime
    iat: datetime


# Notebook API Pydantic Models

# User Assessment Models
class AssessmentStartRequest(BaseModel):
    """Request to start assessment session."""
    subject: Optional[str] = Field(None, description="Subject/topic of interest")
    initial_goals: Optional[str] = Field(None, description="Initial learning goals")
    user_id: str = Field(..., description="User ID")


class AssessmentMessageRequest(BaseModel):
    """Request to send message in assessment session."""
    message: str = Field(..., description="User message")
    user_id: str = Field(..., description="User ID")


class AssessmentStartResponse(BaseModel):
    """Response for starting assessment session."""
    session_id: str = Field(..., description="Assessment session ID")
    status: str = Field(..., description="Session status")
    initial_message: str = Field(..., description="Initial agent message")
    created_at: str = Field(..., description="ISO datetime")


class AssessmentMessageResponse(BaseModel):
    """Response for assessment message."""
    session_id: str = Field(..., description="Assessment session ID")
    response: str = Field(..., description="Agent response")
    assessment_status: str = Field(..., description="in_progress or complete")
    profile_complete: bool = Field(..., description="Whether profile is complete")


class AssessmentProfileResponse(BaseModel):
    """Response for assessment profile."""
    session_id: str = Field(..., description="Assessment session ID")
    profile: Dict[str, Any] = Field(..., description="User profile")
    status: str = Field(..., description="Session status")
    created_at: str = Field(..., description="ISO datetime")


# Curriculum Planning Models
class CurriculumPlanRequest(BaseModel):
    """Request to create curriculum plan."""
    user_profile: Dict[str, Any] = Field(..., description="User profile from assessment")
    subject: str = Field(..., description="Subject to create curriculum for")
    learning_goals: Optional[str] = Field(None, description="Learning goals")
    time_constraints: Optional[str] = Field(None, description="Time constraints")


class CurriculumPlanResponse(BaseModel):
    """Response for curriculum plan."""
    plan_id: str = Field(..., description="Curriculum plan ID")
    curriculum: Dict[str, Any] = Field(..., description="Curriculum plan")
    status: str = Field(..., description="Plan status")
    created_at: str = Field(..., description="ISO datetime")


# Notebook Generation Models
class NotebookGenerateRequest(BaseModel):
    """Request to generate notebook."""
    plan_id: Optional[str] = Field(None, description="Curriculum plan ID (Option 1)")
    config: Optional[Dict[str, Any]] = Field(None, description="Direct notebook config (Option 2)")
    user_id: str = Field(..., description="User ID")
    options: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {
            "include_progress_tracking": True,
            "include_cross_references": True,
            "output_format": "markdown"
        },
        description="Generation options"
    )


class ProgressInfo(BaseModel):
    """Progress information for notebook generation."""
    current_step: str = Field(..., description="Current step")
    total_steps: int = Field(..., description="Total steps")
    percentage: int = Field(..., description="Completion percentage (0-100)")


class NotebookGenerateResponse(BaseModel):
    """Response for notebook generation."""
    notebook_id: str = Field(..., description="Notebook ID")
    status: str = Field(..., description="generating, complete, or error")
    progress: Optional[ProgressInfo] = Field(None, description="Generation progress")
    notebook_path: Optional[str] = Field(None, description="Path to generated notebook")
    created_at: str = Field(..., description="ISO datetime")


class NotebookDetailResponse(BaseModel):
    """Response for notebook details."""
    notebook_id: str = Field(..., description="Notebook ID")
    subject: str = Field(..., description="Subject")
    status: str = Field(..., description="Notebook status")
    progress: Optional[ProgressInfo] = Field(None, description="Generation progress")
    notebook_path: str = Field(..., description="Path to notebook")
    metadata: Dict[str, Any] = Field(..., description="Notebook metadata")
    structure: Dict[str, Any] = Field(..., description="Notebook structure")


class NotebookConfigResponse(BaseModel):
    """Response for notebook config."""
    notebook_id: str = Field(..., description="Notebook ID")
    config: Dict[str, Any] = Field(..., description="Notebook configuration")


class NotebookListItem(BaseModel):
    """Notebook list item."""
    notebook_id: str = Field(..., description="Notebook ID")
    subject: str = Field(..., description="Subject")
    status: str = Field(..., description="Status")
    created_at: str = Field(..., description="ISO datetime")
    updated_at: str = Field(..., description="ISO datetime")


class NotebookListResponse(BaseModel):
    """Response for notebook list."""
    notebooks: List[NotebookListItem] = Field(..., description="List of notebooks")
    total: int = Field(..., description="Total count")
    limit: int = Field(..., description="Limit")
    offset: int = Field(..., description="Offset")


class NotebookDeleteResponse(BaseModel):
    """Response for notebook deletion."""
    notebook_id: str = Field(..., description="Notebook ID")
    status: str = Field(..., description="deleted")
    deleted_at: str = Field(..., description="ISO datetime")


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
            "picture": user_data.get("picture"),  # Include picture in token
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
                picture=payload.get("picture"),  # Extract picture from token
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
            "picture": current_user.picture,  # Include picture in response
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
        "name": current_user.name,
        "picture": current_user.picture  # Include picture in refresh
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


# ============================================================================
# Notebook API Implementation
# ============================================================================

# In-memory storage (in production, use Redis or database)
_assessment_sessions: Dict[str, Dict[str, Any]] = {}
_curriculum_plans: Dict[str, Dict[str, Any]] = {}
_notebooks: Dict[str, Dict[str, Any]] = {}


def _cleanup_expired_sessions():
    """Clean up expired assessment sessions."""
    now = datetime.now(timezone.utc)
    expired = []
    for session_id, session in _assessment_sessions.items():
        expires_at = session.get("expires_at")
        if expires_at and now > expires_at:
            expired.append(session_id)
    for session_id in expired:
        del _assessment_sessions[session_id]


# User Assessment APIs
@app.post("/api/notebooks/assess/start", response_model=AssessmentStartResponse)
async def start_assessment(request: AssessmentStartRequest, current_user: TokenData = Depends(get_current_user)):
    """Start a new user assessment session."""
    if not user_assessment_agent or not InMemoryRunner:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Assessment agent not available"
        )
    
    _cleanup_expired_sessions()
    
    session_id = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.assessment_session_ttl_hours)
    
    # Initialize assessment conversation
    initial_prompt = "Hello! I'm here to help you create a personalized learning experience. "
    if request.subject:
        initial_prompt += f"I see you're interested in {request.subject}. "
    if request.initial_goals:
        initial_prompt += f"Your initial goals are: {request.initial_goals}. "
    initial_prompt += "Let's start by understanding your learning preferences and experience level. What's your current experience level with this subject?"
    
    try:
        runner = InMemoryRunner(agent=user_assessment_agent)
        response = await runner.run_debug(initial_prompt)
        
        # Extract response text
        response_text = _extract_agent_response(response)
        
        _assessment_sessions[session_id] = {
            "session_id": session_id,
            "user_id": request.user_id,
            "conversation_history": [
                {"role": "assistant", "content": response_text}
            ],
            "status": "in_progress",
            "profile": None,
            "created_at": datetime.now(timezone.utc),
            "expires_at": expires_at
        }
        
        return AssessmentStartResponse(
            session_id=session_id,
            status="started",
            initial_message=response_text,
            created_at=datetime.now(timezone.utc).isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting assessment: {str(e)}"
        )


@app.post("/api/notebooks/assess/{session_id}/message", response_model=AssessmentMessageResponse)
async def send_assessment_message(
    session_id: str,
    request: AssessmentMessageRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Continue assessment conversation."""
    if not user_assessment_agent or not InMemoryRunner:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Assessment agent not available"
        )
    
    _cleanup_expired_sessions()
    
    if session_id not in _assessment_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found"
        )
    
    session = _assessment_sessions[session_id]
    
    # Check if session expired
    if session.get("expires_at") and datetime.now(timezone.utc) > session["expires_at"]:
        del _assessment_sessions[session_id]
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Assessment session has expired"
        )
    
    # Check user ownership
    if session["user_id"] != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Build conversation context
    conversation_context = "\n".join([
        f"{msg['role']}: {msg['content']}"
        for msg in session["conversation_history"]
    ])
    conversation_context += f"\nuser: {request.message}"
    
    try:
        runner = InMemoryRunner(agent=user_assessment_agent)
        response = await runner.run_debug(conversation_context)
        
        response_text = _extract_agent_response(response)
        
        # Update conversation history
        session["conversation_history"].append({"role": "user", "content": request.message})
        session["conversation_history"].append({"role": "assistant", "content": response_text})
        
        # Check if profile is complete (agent should call create_user_profile)
        # For now, we'll check if the response indicates completion
        profile_complete = "profile" in response_text.lower() or session.get("profile") is not None
        
        if profile_complete and session.get("profile") is None:
            # Try to extract profile from response
            # In a real implementation, the agent would call the tool and we'd capture it
            # For now, we'll mark it as complete if the agent mentions it
            pass
        
        return AssessmentMessageResponse(
            session_id=session_id,
            response=response_text,
            assessment_status="complete" if profile_complete else "in_progress",
            profile_complete=profile_complete
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@app.get("/api/notebooks/assess/{session_id}/profile", response_model=AssessmentProfileResponse)
async def get_assessment_profile(
    session_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get the final user profile after assessment."""
    _cleanup_expired_sessions()
    
    if session_id not in _assessment_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found"
        )
    
    session = _assessment_sessions[session_id]
    
    if session.get("expires_at") and datetime.now(timezone.utc) > session["expires_at"]:
        del _assessment_sessions[session_id]
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Assessment session has expired"
        )
    
    # If profile not yet extracted, try to generate it from conversation
    if session.get("profile") is None:
        # In a real implementation, we'd call the agent to generate the profile
        # For now, return a placeholder structure
        session["profile"] = {
            "experience_level": "intermediate",
            "learning_goals": "Learn the subject",
            "learning_style": {
                "visual": 0.5,
                "hands_on": 0.5,
                "theoretical": 0.5,
                "combination": True
            },
            "control_preferences": {
                "guidance_level": 0.5,
                "autonomy_level": 0.5,
                "preferred_approach": "mixed"
            },
            "time_constraints": {
                "hours_per_week": 10,
                "target_completion": "2 months",
                "pacing_preference": "moderate"
            },
            "theory_vs_practice_ratio": {
                "theory_percentage": 50,
                "practice_percentage": 50
            },
            "knowledge_gaps": [],
            "readiness_score": 0.5,
            "prerequisites_needed": []
        }
    
    return AssessmentProfileResponse(
        session_id=session_id,
        profile=session["profile"],
        status="complete",
        created_at=session["created_at"].isoformat()
    )


# Curriculum Planning APIs
@app.post("/api/notebooks/plan", response_model=CurriculumPlanResponse)
async def create_curriculum_plan(
    request: CurriculumPlanRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Create a curriculum plan from user profile and subject."""
    if not curriculum_planner_agent or not InMemoryRunner:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Curriculum planner agent not available"
        )
    
    plan_id = str(uuid.uuid4())
    
    try:
        # Prepare prompt for curriculum planner
        user_profile_str = json.dumps(request.user_profile)
        prompt = f"""
        Create a comprehensive curriculum plan for the following:
        
        Subject: {request.subject}
        Learning Goals: {request.learning_goals or 'Not specified'}
        Time Constraints: {request.time_constraints or 'Not specified'}
        
        User Profile:
        {user_profile_str}
        
        Please use the generate_complete_curriculum tool to create a full curriculum plan that includes:
        - Learning path with topic sequences
        - Notebook structure
        - Content depth plan
        - Assessment plan
        - Practice progression
        """
        
        runner = InMemoryRunner(agent=curriculum_planner_agent)
        response = await runner.run_debug(prompt)
        
        # Extract curriculum from response
        # In a real implementation, the agent would call generate_complete_curriculum
        # and we'd capture the structured output
        response_text = _extract_agent_response(response)
        
        # Parse curriculum (simplified - in production, extract from tool call)
        curriculum = {
            "subject": request.subject,
            "curriculum_metadata": {
                "created_for": request.user_profile.get("experience_level", "intermediate"),
                "estimated_completion_time": request.time_constraints or "TBD",
                "total_notebooks": 1,
                "total_topics": 5
            },
            "learning_path": {
                "topics": [],
                "prerequisite_map": {},
                "learning_path_summary": response_text[:500]
            },
            "notebook_structure": {},
            "content_depth_plan": {},
            "assessment_plan": {},
            "practice_progression": {}
        }
        
        _curriculum_plans[plan_id] = {
            "plan_id": plan_id,
            "curriculum": curriculum,
            "status": "complete",
            "created_at": datetime.now(timezone.utc),
            "user_id": current_user.sub
        }
        
        return CurriculumPlanResponse(
            plan_id=plan_id,
            curriculum=curriculum,
            status="complete",
            created_at=datetime.now(timezone.utc).isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating curriculum plan: {str(e)}"
        )


@app.get("/api/notebooks/plan/{plan_id}", response_model=CurriculumPlanResponse)
async def get_curriculum_plan(
    plan_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get curriculum plan details."""
    if plan_id not in _curriculum_plans:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum plan not found"
        )
    
    plan = _curriculum_plans[plan_id]
    
    # Check ownership
    if plan.get("user_id") != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return CurriculumPlanResponse(
        plan_id=plan["plan_id"],
        curriculum=plan["curriculum"],
        status=plan["status"],
        created_at=plan["created_at"].isoformat()
    )


# Notebook Generation APIs
@app.post("/api/notebooks/generate", response_model=NotebookGenerateResponse)
async def generate_notebook(
    request: NotebookGenerateRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Generate notebook from curriculum plan or config."""
    if not NotebookGenerator:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Notebook generator not available"
        )
    
    notebook_id = str(uuid.uuid4())
    
    # Determine config source
    config = None
    if request.config:
        config = request.config
    elif request.plan_id:
        if request.plan_id not in _curriculum_plans:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curriculum plan not found"
            )
        plan = _curriculum_plans[request.plan_id]
        # Convert curriculum plan to notebook config
        config = _convert_curriculum_to_config(plan["curriculum"])
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either plan_id or config must be provided"
        )
    
    # Create notebook record
    notebook_path = Path(settings.notebooks_base_path) / current_user.sub / notebook_id
    notebook_path.mkdir(parents=True, exist_ok=True)
    
    _notebooks[notebook_id] = {
        "notebook_id": notebook_id,
        "user_id": current_user.sub,
        "subject": config.get("subject", "Unknown"),
        "status": "generating",
        "config": config,
        "notebook_path": str(notebook_path),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "progress": {
            "current_step": "Initializing",
            "total_steps": 5,
            "percentage": 0
        }
    }
    
    # Start async generation
    asyncio.create_task(_generate_notebook_async(notebook_id, config, notebook_path, request.options))
    
    return NotebookGenerateResponse(
        notebook_id=notebook_id,
        status="generating",
        progress=ProgressInfo(
            current_step="Initializing",
            total_steps=5,
            percentage=0
        ),
        notebook_path=None,
        created_at=datetime.now(timezone.utc).isoformat()
    )


async def _generate_notebook_async(notebook_id: str, config: Dict[str, Any], output_path: Path, options: Dict[str, Any]):
    """Async notebook generation task."""
    try:
        # Save config to temp file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config, f, indent=2)
            config_file = f.name
        
        # Update progress
        _notebooks[notebook_id]["progress"] = {
            "current_step": "Creating generator",
            "total_steps": 5,
            "percentage": 20
        }
        
        # Create generator and generate
        generator = NotebookGenerator(config_file, str(output_path))
        
        _notebooks[notebook_id]["progress"] = {
            "current_step": "Generating content",
            "total_steps": 5,
            "percentage": 40
        }
        
        await generator.generate_notebook()
        
        # Update status
        _notebooks[notebook_id]["status"] = "complete"
        _notebooks[notebook_id]["progress"] = {
            "current_step": "Complete",
            "total_steps": 5,
            "percentage": 100
        }
        _notebooks[notebook_id]["updated_at"] = datetime.now(timezone.utc)
        
        # Clean up temp file
        os.unlink(config_file)
        
    except Exception as e:
        _notebooks[notebook_id]["status"] = "error"
        _notebooks[notebook_id]["error"] = str(e)
        _notebooks[notebook_id]["updated_at"] = datetime.now(timezone.utc)


@app.get("/api/notebooks/{notebook_id}", response_model=NotebookDetailResponse)
async def get_notebook(
    notebook_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get notebook details and status."""
    if notebook_id not in _notebooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notebook not found"
        )
    
    notebook = _notebooks[notebook_id]
    
    # Check ownership
    if notebook["user_id"] != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Calculate structure info
    structure = {
        "total_topics": len(notebook["config"].get("topics", [])),
        "total_files": 0,  # Would need to scan directory
        "estimated_time": "TBD"
    }
    
    return NotebookDetailResponse(
        notebook_id=notebook_id,
        subject=notebook["subject"],
        status=notebook["status"],
        progress=ProgressInfo(**notebook["progress"]) if notebook.get("progress") else None,
        notebook_path=notebook["notebook_path"],
        metadata={
            "created_at": notebook["created_at"].isoformat(),
            "updated_at": notebook["updated_at"].isoformat(),
            "user_id": notebook["user_id"]
        },
        structure=structure
    )


@app.get("/api/notebooks/{notebook_id}/config", response_model=NotebookConfigResponse)
async def get_notebook_config(
    notebook_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get the notebook configuration used for generation."""
    if notebook_id not in _notebooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notebook not found"
        )
    
    notebook = _notebooks[notebook_id]
    
    # Check ownership
    if notebook["user_id"] != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return NotebookConfigResponse(
        notebook_id=notebook_id,
        config=notebook["config"]
    )


# Notebook Management APIs
@app.get("/api/notebooks", response_model=NotebookListResponse)
async def list_notebooks(
    status_filter: Optional[str] = Query(None, alias="status"),
    subject_filter: Optional[str] = Query(None, alias="subject"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: TokenData = Depends(get_current_user)
):
    """List all notebooks for the authenticated user."""
    # Filter by user
    user_notebooks = [
        nb for nb in _notebooks.values()
        if nb["user_id"] == current_user.sub
    ]
    
    # Apply filters
    if status_filter:
        user_notebooks = [nb for nb in user_notebooks if nb["status"] == status_filter]
    if subject_filter:
        user_notebooks = [nb for nb in user_notebooks if subject_filter.lower() in nb["subject"].lower()]
    
    # Sort by created_at (newest first)
    user_notebooks.sort(key=lambda x: x["created_at"], reverse=True)
    
    # Paginate
    total = len(user_notebooks)
    paginated = user_notebooks[offset:offset + limit]
    
    return NotebookListResponse(
        notebooks=[
            NotebookListItem(
                notebook_id=nb["notebook_id"],
                subject=nb["subject"],
                status=nb["status"],
                created_at=nb["created_at"].isoformat(),
                updated_at=nb["updated_at"].isoformat()
            )
            for nb in paginated
        ],
        total=total,
        limit=limit,
        offset=offset
    )


@app.delete("/api/notebooks/{notebook_id}", response_model=NotebookDeleteResponse)
async def delete_notebook(
    notebook_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Delete a notebook."""
    if notebook_id not in _notebooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notebook not found"
        )
    
    notebook = _notebooks[notebook_id]
    
    # Check ownership
    if notebook["user_id"] != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete notebook files
    import shutil
    notebook_path = Path(notebook["notebook_path"])
    if notebook_path.exists():
        shutil.rmtree(notebook_path)
    
    # Remove from storage
    del _notebooks[notebook_id]
    
    return NotebookDeleteResponse(
        notebook_id=notebook_id,
        status="deleted",
        deleted_at=datetime.now(timezone.utc).isoformat()
    )


# Helper functions
def _extract_agent_response(response) -> str:
    """Extract text response from agent response."""
    if isinstance(response, str):
        return response
    
    if isinstance(response, list):
        text_parts = []
        for event in response:
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts'):
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            text_parts.append(part.text.strip())
        if text_parts:
            return "\n".join(text_parts)
    
    if hasattr(response, 'content') and response.content:
        if hasattr(response.content, 'parts'):
            text_parts = []
            for part in response.content.parts:
                if hasattr(part, 'text') and part.text:
                    text_parts.append(part.text.strip())
            if text_parts:
                return "\n".join(text_parts)
    
    return str(response)


def _convert_curriculum_to_config(curriculum: Dict[str, Any]) -> Dict[str, Any]:
    """Convert curriculum plan to notebook config format."""
    learning_path = curriculum.get("learning_path", {})
    topics = learning_path.get("topics", [])
    
    config = {
        "subject": curriculum.get("subject", "Unknown"),
        "description": f"Curriculum for {curriculum.get('subject', 'Unknown')}",
        "difficulty": curriculum.get("curriculum_metadata", {}).get("created_for", "intermediate"),
        "prerequisites": [],
        "content_depth": "intermediate",
        "include_progress_tracking": True,
        "include_cross_references": True,
        "output_format": "markdown",
        "topics": [
            {
                "name": topic.get("name", f"Topic {i+1}"),
                "description": topic.get("description", ""),
                "difficulty": topic.get("difficulty", "intermediate"),
                "estimated_time": topic.get("estimated_time", "2 hours"),
                "key_concepts": topic.get("key_concepts", []),
                "learning_objectives": topic.get("learning_objectives", []),
                "prerequisites": topic.get("prerequisites", []),
                "subtopics": []
            }
            for i, topic in enumerate(topics)
        ],
        "metadata": {
            "version": "1.0.0",
            "created_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "tags": []
        }
    }
    
    return config

@app.get("/api/notebooks/{notebook_id}/tree")
async def get_notebook_tree(
    notebook_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get complete file tree structure for a notebook."""
    # Verify ownership
    # Get tree from GCS
    tree = gcs_storage.get_file_tree(current_user.sub, notebook_id)
    return {"tree": tree}

@app.get("/api/notebooks/{notebook_id}/files")
async def list_notebook_files(
    notebook_id: str,
    prefix: str = Query("", description="Directory prefix"),
    current_user: TokenData = Depends(get_current_user)
):
    """List files in a notebook directory."""
    files = gcs_storage.list_files(current_user.sub, notebook_id, prefix)
    return {"files": files}

@app.get("/api/notebooks/{notebook_id}/file")
async def get_notebook_file(
    notebook_id: str,
    file_path: str = Query(..., description="Relative file path"),
    current_user: TokenData = Depends(get_current_user)
):
    """Get file content."""
    content = gcs_storage.download_file(current_user.sub, notebook_id, file_path)
    return {"content": content, "path": file_path}

@app.get("/api/notebooks/{notebook_id}/file/url")
async def get_file_signed_url(
    notebook_id: str,
    file_path: str = Query(..., description="Relative file path"),
    current_user: TokenData = Depends(get_current_user)
):
    """Get signed URL for direct frontend access."""
    url = gcs_storage.generate_signed_url(
        current_user.sub, 
        notebook_id, 
        file_path
    )
    return {"url": url, "expires_in": 3600}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
