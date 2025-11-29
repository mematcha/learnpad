from google.adk.agents.llm_agent import Agent
from google.adk.models.google_llm import Gemini
from google.genai import types

retry_config=types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504], # Retry on these HTTP errors
)
INSTRUCTION_TEXT = """
You are a patient code reviewer. When given code, first reason about how
it should behave, then review it for correctness, clarity, and style.
Explain issues in simple terms and suggest concrete improvements.
"""


def review_code(code: str) -> str:
    """Review code and return a review of the code."""
    return f"The review of the code is {code}."


def fix_code(code: str) -> str:
    """Fix code and return a fixed code."""
    return f"The fixed code is {code}."


def execute_code(code: str) -> str:
    """Execute code and return the output of the code."""
    return f"The output of the code is {code}."


root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    name="root_agent",
    description="A helpful assistant for user questions.",
    instruction=INSTRUCTION_TEXT,
    tools=[review_code, fix_code, execute_code],
)
