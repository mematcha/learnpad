import os
import uuid
from vertexai.agent_engines import AdkApp
import vertexai.agent_engines as agent_engines
from dotenv import load_dotenv
import vertexai
from google.adk.sessions import VertexAiSessionService
from content_generator.agent import root_agent as content_generator_agent
from google.adk.runners import Runner
from google.genai import types
import asyncio
print("🔍 Imports successful")

load_dotenv()
print("🔍 Environment variables loaded")

def initialize_vertex_client():
    client = vertexai.Client(
        project=os.getenv("GOOGLE_CLOUD_PROJECT"),
        location=os.getenv("GOOGLE_CLOUD_LOCATION"),
    )
    print("🔍 Vertex client initialized")
    return client

def create_agent_engine(client: vertexai.Client):
    agent_engine = client.agent_engines.create()
    agent_engine_id = agent_engine.api_resource.name.split("/")[-1]
    print("Agent ID: ", agent_engine_id)
    return agent_engine, agent_engine_id


def deploy_agent(agent_app: AdkApp, agent_engine_id: str):
    session_service = VertexAiSessionService(
        project=os.getenv("GOOGLE_CLOUD_PROJECT"),
        location=os.getenv("GOOGLE_CLOUD_LOCATION"),
        agent_engine_id=agent_engine_id,
    )
    runner = Runner(
        agent=content_generator_agent,
        app_name="content_generator_agent",
        session_service=session_service
    )
    return session_service, runner

async def create_session(app_name: str, session_service: VertexAiSessionService, user_id: str):
    """Create a new session for the user."""
    session = await session_service.create_session(
        app_name=app_name,
        user_id=user_id
    )
    print(f"✅ Created session: {session.id}")
    return session

def call_agent(runner: Runner, query: str, session_id: str, user_id: str):
  content = types.Content(role='user', parts=[types.Part(text=query)])
  events = runner.run(
      user_id=user_id, 
      session_id=session_id, 
      new_message=content
  )

  for event in events:
      if event.is_final_response():
          final_response = event.content.parts[0].text
          print("Agent Response: ", final_response)

async def main():
    client = initialize_vertex_client()
    agent_engine, agent_engine_id = create_agent_engine(client)
    session_service, runner = deploy_agent(content_generator_agent, agent_engine_id)
    # Test the agent
    user_id = str(uuid.uuid4())
    session = await create_session("content_generator_agent", session_service, user_id)
    call_agent(runner, "Hello, how are you?", session.id, user_id)
if __name__ == "__main__":
    asyncio.run(main())