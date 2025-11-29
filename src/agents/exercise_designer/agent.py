from google.adk.agents.llm_agent import Agent

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
    model='gemini-2.5-flash',
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction='Answer user questions to the best of your knowledge',
    tools=[create_exercises, create_quizzes, create_test_cases],
)
