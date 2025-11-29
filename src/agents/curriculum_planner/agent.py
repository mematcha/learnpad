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
Answer user questions to the best of your knowledge. You are a curriculum planner. You are responsible for planning the curriculum for a given topic and category.
"""

def analyze_category(category: str) -> str:
    """Analyze a category and return a description of the category."""
    return f"The category is {category}."

def structure_learning_path(topic: str, category: str) -> str:
    """Structure a learning path for a given topic and category."""
    return f"The learning path for {topic} in {category} is {topic}."

root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction=INSTRUCTION_TEXT,
    tools=[analyze_category, structure_learning_path],
)

