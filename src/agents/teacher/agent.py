from google.adk.agents.llm_agent import Agent
from google.adk.memory import InMemoryMemory
from google.adk.models.google_llm import Gemini
from google.genai import types

retry_config=types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504], # Retry on these HTTP errors
)
memory = InMemoryMemory()
memory.preload_memory()

INSTRUCTION_TEXT = """
You are a master teacher coordinating a team of specialist tutors.
Answer user questions to the best of your knowledge and use tools
to retrieve or summarize student progress when helpful.
"""


def get_student_progress(student_id: str) -> str:
    """Get the progress of a given student."""
    return f"The progress of the student {student_id} is {student_id}."


root_agent = Agent(
    model="gemini-2.5-flash",
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    name='root_agent',
    instruction=INSTRUCTION_TEXT,
    tools=[get_student_progress],
)
