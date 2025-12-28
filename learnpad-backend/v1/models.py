from pydantic import BaseModel

class AuthRequest(BaseModel):
    token: str  # Changed from 'code' to 'token'

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_info: dict  # Add user_info field