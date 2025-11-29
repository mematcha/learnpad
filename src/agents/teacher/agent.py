# src/agents/teacher/agent.py
from google.adk.agents import Agent  # ← Use Agent, not LlmAgent
from google.adk.models.google_llm import Gemini
from google.adk.tools import AgentTool
from google.genai import types

# Import your specialist agents
from agents.concept_explainer.agent import root_agent as concept_explainer_agent
from agents.code_reviewer.agent import root_agent as code_reviewer_agent
from agents.assessment_checker.agent import root_agent as assessment_checker_agent

retry_config = types.HttpRetryOptions(
    attempts=5,
    exp_base=7,
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504],
)


INSTRUCTION_TEXT = """
You are a master teacher coordinating a team of specialist tutors.

When a student asks a question:
1. If they want to LEARN a concept → delegate to concept_explainer_agent
2. If they submit CODE for review → delegate to code_reviewer_agent  
3. If they need PRACTICE or ASSESSMENT → delegate to assessment_checker_agent

After getting responses from specialists, synthesize the information and respond
to the student in an encouraging, personalized way.
"""

def get_student_progress(student_id: str) -> dict:
    """Get the progress of a given student."""
    return {
        "status": "success",
        "student_id": student_id,
        "progress": f"Student {student_id} is making good progress"
    }

root_agent = Agent(  # ← Use Agent, not LlmAgent
    model=Gemini(
        model="gemini-2.5-flash",
        retry_options=retry_config
    ),
    name="teacher_agent",
    description="Master teacher that coordinates learning by delegating to specialist agents",
    instruction=INSTRUCTION_TEXT,
    tools=[  # ← Put AgentTool instances in tools, not sub_agents
        get_student_progress,
        AgentTool(agent=concept_explainer_agent),
        AgentTool(agent=code_reviewer_agent),
        AgentTool(agent=assessment_checker_agent),
    ],
)