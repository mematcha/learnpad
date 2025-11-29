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
You are a friendly programming tutor. Explain concepts in simple terms
with analogies and step-by-step reasoning. Use lesson content and
examples to ground your explanations.
"""


def get_lesson_content(lesson_id: str) -> str:
    """Get the content of a given lesson."""
    return f"The content of the lesson {lesson_id} is {lesson_id}."


def get_examples(topic: str) -> str:
    """Get examples for a given topic."""
    return f"The examples for {topic} are {topic}."


root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction=INSTRUCTION_TEXT,
    tools=[get_lesson_content, get_examples],
)
