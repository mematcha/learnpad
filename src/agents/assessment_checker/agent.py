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
Answer user questions to the best of your knowledge. You are an assessment checker. You are responsible for checking the understanding of a given topic and returning a score and feedback.
"""

def check_understanding(student_answer: str, topic: str, expected_answer: str) -> str:
    """Check the understanding of a given topic and return a score."""
    return f"The score for the student answer is {student_answer}."

def provide_feedback(student_answer: str, topic: str, expected_answer: str) -> str:
    """Provide feedback for a given topic and return a feedback."""
    return f"The feedback for the student answer is {student_answer}."

def generate_report(student_answer: str, topic: str, expected_answer: str) -> str:
    """Generate a report for a given topic and return a report."""
    return f"The report for the student answer is {student_answer}."

def get_exercise(topic: str) -> str:
    """Get an exercise for a given topic and return an exercise."""
    return f"The exercise for the topic is {topic}."

root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash-lite",
        retry_options=retry_config
    ),
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction=INSTRUCTION_TEXT,
    tools=[check_understanding, provide_feedback, generate_report],
)
