"""
Deployment script for the Learnpad Agent Engine.

This script deploys four specialized agents into a single Vertex AI Agent Engine:
- user_assessment: Assesses user knowledge, learning style, and creates learner profiles
- curriculum_planner: Designs learning curricula and notebook structures
- content_generator: Generates educational content (explanations, examples, exercises)
- notebook_loop_agent: Orchestrates notebook creation and uploads to GCS

Architecture:
- Single Agent Engine named "learnpad-agent-engine"
- notebook_loop_agent is the primary entry point for notebook generation
- All agents are available as sub-agents/tools within the same engine
"""

import os
import sys
import uuid
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
import vertexai
from google.adk.sessions import VertexAiSessionService
from google.adk.runners import Runner
from google.genai import types

# Add src to path for agent imports
src_path = Path(__file__).parent.parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

# Import the four agents
from agents.user_assessment.agent import root_agent as user_assessment_agent
from agents.curriculum_planner.agent import root_agent as curriculum_planner_agent
from agents.content_generator.agent import root_agent as content_generator_agent
from agents.notebook_loop_agent.agent import root_agent as notebook_loop_agent

print("✅ Successfully imported all agents")

load_dotenv()
print("✅ Environment variables loaded")

# Configuration
ENGINE_NAME = "learnpad-agent-engine"
APP_NAME = "learnpad_orchestrator"


def initialize_vertex_client():
    """Initialize Vertex AI client with project and location from environment."""
    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    location = os.getenv("GOOGLE_CLOUD_LOCATION")
    
    if not project or not location:
        raise ValueError(
            "GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be set in environment"
        )
    
    client = vertexai.Client(project=project, location=location)
    print(f"✅ Vertex client initialized (project={project}, location={location})")
    return client


def create_or_get_agent_engine(client: vertexai.Client, engine_id: str = None):
    """
    Create a new Agent Engine or return existing one if engine_id is provided.
    
    Args:
        client: Initialized Vertex AI client
        engine_id: Optional existing engine ID to reuse
        
    Returns:
        Tuple of (agent_engine, agent_engine_id)
    """
    if engine_id:
        print(f"📌 Using existing Agent Engine ID: {engine_id}")
        # Note: In production, you'd want to validate the engine exists
        return None, engine_id
    
    agent_engine = client.agent_engines.create()
    agent_engine_id = agent_engine.api_resource.name.split("/")[-1]
    print(f"✅ Created new Agent Engine: {agent_engine_id}")
    return agent_engine, agent_engine_id


def create_session_service(agent_engine_id: str):
    """Create VertexAiSessionService for the agent engine."""
    session_service = VertexAiSessionService(
        project=os.getenv("GOOGLE_CLOUD_PROJECT"),
        location=os.getenv("GOOGLE_CLOUD_LOCATION"),
        agent_engine_id=agent_engine_id,
    )
    print(f"✅ Session service created for engine: {agent_engine_id}")
    return session_service


def create_runner(agent, app_name: str, session_service: VertexAiSessionService):
    """Create a Runner for the agent."""
    runner = Runner(
        agent=agent,
        app_name=app_name,
        session_service=session_service
    )
    print(f"✅ Runner created for app: {app_name}")
    return runner


async def create_session(app_name: str, session_service: VertexAiSessionService, user_id: str):
    """Create a new session for the user."""
    session = await session_service.create_session(
        app_name=app_name,
        user_id=user_id
    )
    print(f"✅ Created session: {session.id}")
    return session


def call_agent(runner: Runner, query: str, session_id: str, user_id: str):
    """Send a message to the agent and print the response."""
  content = types.Content(role='user', parts=[types.Part(text=query)])
  events = runner.run(
      user_id=user_id, 
      session_id=session_id, 
      new_message=content
  )

  for event in events:
      if event.is_final_response():
          final_response = event.content.parts[0].text
            print(f"\n📝 Agent Response:\n{final_response}\n")
            return final_response
    
    return None


def save_deployment_metadata(agent_engine_id: str, output_file: str = "deployment_metadata.json"):
    """Save deployment metadata to a JSON file for API configuration."""
    metadata = {
        "agent_engine_id": agent_engine_id,
        "engine_name": ENGINE_NAME,
        "app_name": APP_NAME,
        "project": os.getenv("GOOGLE_CLOUD_PROJECT"),
        "location": os.getenv("GOOGLE_CLOUD_LOCATION"),
        "agents": {
            "primary": "notebook_loop_agent",
            "available_agents": [
                "user_assessment_agent",
                "curriculum_planner_agent",
                "content_generator_agent",
                "notebook_loop_agent"
            ]
        }
    }
    
    output_path = Path(__file__).parent / output_file
    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Deployment metadata saved to: {output_path}")
    return metadata


async def deploy_agent_engine(test_agent: bool = False, existing_engine_id: str = None):
    """
    Deploy the Learnpad Agent Engine with all four agents.
    
    Args:
        test_agent: If True, run a simple test query after deployment
        existing_engine_id: If provided, reuse existing engine instead of creating new
        
    Returns:
        Dictionary with deployment details
    """
    print("\n" + "="*60)
    print("🚀 DEPLOYING LEARNPAD AGENT ENGINE")
    print("="*60 + "\n")
    
    # Step 1: Initialize Vertex client
    client = initialize_vertex_client()
    
    # Step 2: Create or get agent engine
    agent_engine, agent_engine_id = create_or_get_agent_engine(client, existing_engine_id)
    
    # Step 3: Create session service
    session_service = create_session_service(agent_engine_id)
    
    # Step 4: Create runner for the primary agent (notebook_loop_agent)
    runner = create_runner(notebook_loop_agent, APP_NAME, session_service)
    
    # Step 5: Save deployment metadata
    metadata = save_deployment_metadata(agent_engine_id)
    
    print("\n" + "="*60)
    print("✅ DEPLOYMENT COMPLETE")
    print("="*60)
    print(f"\nAgent Engine ID: {agent_engine_id}")
    print(f"App Name: {APP_NAME}")
    print(f"Primary Agent: notebook_loop_agent")
    print(f"Available Agents:")
    print(f"  - user_assessment")
    print(f"  - curriculum_planner")
    print(f"  - content_generator")
    print(f"  - notebook_loop_agent")
    print("\n" + "="*60 + "\n")
    
    # Step 6: Optional test
    if test_agent:
        print("\n🧪 Running test query...\n")
    user_id = str(uuid.uuid4())
        session = await create_session(APP_NAME, session_service, user_id)
        
        test_query = "What can you help me with?"
        print(f"Test Query: {test_query}")
        call_agent(runner, test_query, session.id, user_id)
    
    return {
        "agent_engine_id": agent_engine_id,
        "app_name": APP_NAME,
        "session_service": session_service,
        "runner": runner,
        "metadata": metadata
    }


async def main():
    """Main entry point for deployment script."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Deploy Learnpad Notebook Engine to Vertex AI")
    parser.add_argument(
        "--test", 
        action="store_true", 
        help="Run a test query after deployment"
    )
    parser.add_argument(
        "--engine-id",
        type=str,
        help="Reuse existing Agent Engine ID instead of creating a new one"
    )
    
    args = parser.parse_args()
    
    try:
        deployment_info = await deploy_agent_engine(
            test_agent=args.test,
            existing_engine_id=args.engine_id
        )
        
        print("\n✅ Deployment successful!")
        print(f"\nTo use this engine in your API, set:")
        print(f"  AGENT_ENGINE_ID={deployment_info['agent_engine_id']}")
        print(f"  AGENT_APP_NAME={deployment_info['app_name']}")
        
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())