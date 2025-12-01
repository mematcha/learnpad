"""Client for local ADK API server using simple HTTP calls.

This client calls the local ADK API server (running on port 8000) which hosts
the actual agent applications (content_generator, curriculum_planner, etc.).

Based on the ADK API patterns from your curl examples:
- Create session: POST /apps/{app_name}/users/{user_id}/sessions/{session_id}
- Run agent: POST /run with appName, userId, sessionId, newMessage

The ADK server must be running: `adk api_server --port 8000`
"""
import requests
import json
import random
from typing import Dict, Any, List, Optional


class ADKClient:
    """Simple HTTP client for ADK API server."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Initialize ADK client.
        
        Args:
            base_url: Base URL of ADK API server (default: http://localhost:8000)
        """
        self.base_url = base_url.rstrip('/')
    
    def is_available(self) -> bool:
        """
        Check if ADK server is available.
        
        Returns:
            True if server is reachable, False otherwise
        """
        try:
            response = requests.get(f"{self.base_url}/", timeout=1)
            # Accept both 200 (root exists) and 404 (server exists but no root route)
            # as signs that the server is running
            return response.status_code in [200, 404]
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            return False
    
    @staticmethod
    def generate_session_id(user_id: str) -> str:
        """
        Generate a random session ID for a user.
        
        Args:
            user_id: User identifier (from JWT auth)
        
        Returns:
            Random session ID like "s_12345"
        """
        random_num = random.randint(10000, 99999)
        return f"s_{random_num}"
        
    def create_session(
        self, 
        app_name: str, 
        user_id: str, 
        session_id: str,
        initial_state: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new session for an app.
        
        Simple HTTP call matching: 
        curl -X POST "http://localhost:8000/apps/{app}/users/{user}/sessions/{session}"
        
        Args:
            app_name: Name of the app (e.g., "content_generator")
            user_id: User identifier (from JWT auth)
            session_id: Session identifier (use generate_session_id())
            initial_state: Optional initial state dictionary
        
        Returns:
            Session data: {"id": session_id, "appName": app_name, "userId": user_id, "state": {...}}
        """
        url = f"{self.base_url}/apps/{app_name}/users/{user_id}/sessions/{session_id}"
        payload = initial_state or {}
        
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=10)
        response.raise_for_status()
        
        return response.json()
    
    def run_agent(
        self,
        app_name: str,
        user_id: str,
        session_id: str,
        message: str
    ) -> List[Dict[str, Any]]:
        """
        Run an agent with a message.
        
        Simple HTTP call matching:
        curl -X POST "http://localhost:8000/run" -H "Content-Type: application/json"
          -d '{"appName": "...", "userId": "...", "sessionId": "...", 
               "newMessage": {"role": "user", "parts": [{"text": "..."}]}}'
        
        Args:
            app_name: Name of the app (e.g., "content_generator")
            user_id: User identifier (from JWT auth)
            session_id: Session identifier (from create_session)
            message: User message to send to agent
        
        Returns:
            List of event dictionaries with agent responses
        """
        url = f"{self.base_url}/run"
        
        payload = {
            "appName": app_name,
            "userId": user_id,
            "sessionId": session_id,
            "newMessage": {
                "role": "user",
                "parts": [{"text": message}]
            }
        }
        
        try:
            response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=120)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            # Try to get more details from the error response
            error_detail = "No additional details"
            try:
                error_data = response.json()
                error_detail = error_data.get("detail", str(error_data))
            except:
                error_detail = response.text if response.text else "Empty response"
            
            print(f"❌ ADK server error: {e}")
            print(f"   Status: {response.status_code}")
            print(f"   Detail: {error_detail}")
            print(f"   App: {app_name}, User: {user_id}, Session: {session_id}")
            raise Exception(f"ADK server error ({response.status_code}): {error_detail}") from e
    
    def extract_text_response(self, events: List[Dict[str, Any]]) -> str:
        """
        Extract text response from agent events.
        
        The response from /run is a list of events like:
        [{"content": {"parts": [{"text": "..."}], "role": "model"}, ...}]
        
        Args:
            events: List of event dictionaries from run_agent
        
        Returns:
            Concatenated text response from all events
        """
        text_parts = []
        
        for event in events:
            if "content" in event and "parts" in event["content"]:
                for part in event["content"]["parts"]:
                    if "text" in part:
                        text_parts.append(part["text"])
        
        return "\n".join(text_parts) if text_parts else ""
    
    def generate_content_simple(
        self,
        app_name: str,
        user_id: str,
        message: str,
        initial_state: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Simple helper: create session + run agent + extract response in one call.
        
        Args:
            app_name: Agent app name (e.g., "content_generator")
            user_id: User identifier (from JWT auth)
            message: Prompt to send to agent
            initial_state: Optional initial state for the session
        
        Returns:
            Extracted text response
        """
        # Generate random session ID
        session_id = self.generate_session_id(user_id)
        
        # Create session
        self.create_session(app_name, user_id, session_id, initial_state=initial_state or {})
        
        # Run agent
        events = self.run_agent(app_name, user_id, session_id, message)
        
        # Extract and return text
        return self.extract_text_response(events)


# Test function
if __name__ == "__main__":
    """Test the ADK client with simple HTTP calls."""
    print("Testing ADK Client (Simple HTTP)...")
    print("=" * 60)
    
    try:
        client = ADKClient()
        
        # Check if server is available
        print("\n0. Checking ADK server availability...")
        if not client.is_available():
            print("❌ ADK server is not available at http://localhost:8000")
            print("\n   Start it with: adk api_server --port 8000")
            print("   (in your src/agents directory)")
            exit(1)
        print("✓ ADK server is available!")
        
        test_user = "u_test123"
        
        # Test 1: Generate session ID
        print("\n1. Generating random session ID...")
        session_id = client.generate_session_id(test_user)
        print(f"✓ Generated session ID: {session_id}")
        
        # Test 2: Create session
        print("\n2. Creating session...")
        print(f"   POST {client.base_url}/apps/content_generator/users/{test_user}/sessions/{session_id}")
        session = client.create_session(
            app_name="content_generator",
            user_id=test_user,
            session_id=session_id,
            initial_state={"test": "value"}
        )
        print(f"✓ Session created: {session.get('id')}")
        print(f"  State: {session.get('state')}")
        
        # Test 3: Run agent
        print("\n3. Running agent...")
        print(f"   POST {client.base_url}/run")
        events = client.run_agent(
            app_name="content_generator",
            user_id=test_user,
            session_id=session_id,
            message="Explain Python variables in 2 sentences"
        )
        print(f"✓ Received {len(events)} events")
        
        # Test 4: Extract response
        print("\n4. Extracting text from response...")
        response = client.extract_text_response(events)
        print(f"✓ Response ({len(response)} chars):")
        print("-" * 60)
        print(response[:300] + ("..." if len(response) > 300 else ""))
        print("-" * 60)
        
        # Test 5: Simple helper method
        print("\n5. Testing simple helper (one call)...")
        content = client.generate_content_simple(
            app_name="content_generator",
            user_id=test_user,
            message="What is a Python function?"
        )
        print(f"✓ Content generated ({len(content)} chars)")
        print(content[:200] + ("..." if len(content) > 200 else ""))
        
        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to ADK API server at http://localhost:8000")
        print("\n   Start it with: adk api_server --port 8000")
        print("   (in your src/agents directory)")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


