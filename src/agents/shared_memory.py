"""
Shared memory storage for agent-to-agent communication.
Stores user profiles and other data that agents need to share.
"""
from typing import Dict, Any, Optional
from datetime import datetime, timezone

# In-memory storage for user profiles (in production, use a database)
_user_profiles: Dict[str, Dict[str, Any]] = {}


def store_user_profile(user_profile: Dict[str, Any], user_id: Optional[str] = None, notebook_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Store a user profile in memory for later retrieval by other agents.
    
    Args:
        user_profile: Complete user profile dictionary from create_user_profile (must contain user_id and notebook_id)
        user_id: Optional unique identifier for the user (will be extracted from user_profile if not provided)
        notebook_id: Optional unique identifier for the notebook (will be extracted from user_profile if not provided)
    
    Returns:
        Dictionary with storage confirmation
    """
    # Extract user_id and notebook_id from profile if not provided as parameters
    if not user_id and isinstance(user_profile, dict):
        user_id = user_profile.get("user_id", "")
    if not notebook_id and isinstance(user_profile, dict):
        notebook_id = user_profile.get("notebook_id", "")
    
    # Validate that we have both IDs
    if not user_id or not notebook_id:
        return {
            "status": "error",
            "message": "Both user_id and notebook_id are required. They must be in the user_profile dictionary or provided as separate parameters.",
            "user_id_provided": bool(user_id),
            "notebook_id_provided": bool(notebook_id),
            "user_profile_keys": list(user_profile.keys()) if isinstance(user_profile, dict) else []
        }
    
    key = f"{user_id}:{notebook_id}"
    _user_profiles[key] = {
        "user_id": user_id,
        "notebook_id": notebook_id,
        "profile": user_profile,
        "stored_at": datetime.now(timezone.utc).isoformat()
    }
    
    return {
        "status": "success",
        "message": f"User profile stored for user {user_id}, notebook {notebook_id}",
        "stored_at": _user_profiles[key]["stored_at"],
        "user_id": user_id,
        "notebook_id": notebook_id
    }


def get_user_profile(user_id: str, notebook_id: str) -> Dict[str, Any]:
    """
    Retrieve a stored user profile from memory.
    
    Args:
        user_id: Unique identifier for the user
        notebook_id: Unique identifier for the notebook
    
    Returns:
        Dictionary with user profile or error if not found
    """
    key = f"{user_id}:{notebook_id}"
    
    if key not in _user_profiles:
        return {
            "status": "error",
            "message": f"No user profile found for user {user_id}, notebook {notebook_id}",
            "profile": None
        }
    
    stored_data = _user_profiles[key]
    return {
        "status": "success",
        "user_id": user_id,
        "notebook_id": notebook_id,
        "profile": stored_data["profile"],
        "stored_at": stored_data["stored_at"]
    }


def get_user_profile_json(user_id: str, notebook_id: str) -> str:
    """
    Retrieve a stored user profile as a JSON string.
    
    Args:
        user_id: Unique identifier for the user
        notebook_id: Unique identifier for the notebook
    
    Returns:
        JSON string of the user profile, or error message if not found
    """
    import json
    result = get_user_profile(user_id, notebook_id)
    
    if result["status"] == "error":
        return json.dumps(result, indent=2)
    
    return json.dumps(result["profile"], indent=2, ensure_ascii=False)

