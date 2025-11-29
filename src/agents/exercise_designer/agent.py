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
You are an exercise designer for programming practice. Create exercises,
quizzes, and simple test cases that help students practice and verify
their understanding of a topic.
"""


def create_exercises(topic: str) -> str:
    """Create exercises for a given topic."""
    return f"The exercises for {topic} are {topic}."


def create_quizzes(topic: str) -> str:
    """Create quizzes for a given topic."""
    return f"The quizzes for {topic} are {topic}."


def create_test_cases(exercise: dict) -> str:
    """Create test cases for a given exercise."""
    return f"The test cases for {exercise} are {exercise}."


root_agent = Agent(
    model="gemini-2.5-flash",
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    description="A helpful assistant for user questions.",
    instruction=INSTRUCTION_TEXT,
    tools=[create_exercises, create_quizzes, create_test_cases],
)
