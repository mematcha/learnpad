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
You are a content generator for programming education. Create clear,
structured explanations, examples, and exercises tailored to the
student's topic and level.
"""


def generate_content(topic: str, category: str) -> str:
    """Generate content for a given topic and category."""
    return f"The content for {topic} in {category} is {topic}."


def create_examples(topic: str) -> str:
    """Create examples for a given topic."""
    return f"The examples for {topic} are {topic}."


def create_exercises(topic: str) -> str:
    """Create exercises for a given topic."""
    return f"The exercises for {topic} are {topic}."


root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    name='root_agent',
    description="A helpful assistant for user questions.",
    instruction=INSTRUCTION_TEXT,
    tools=[generate_content, create_examples, create_exercises],
)
