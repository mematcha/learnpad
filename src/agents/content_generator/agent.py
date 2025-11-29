from google.adk.agents.llm_agent import Agent

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
    model='gemini-2.5-flash',
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction='Answer user questions to the best of your knowledge',
    tools=[generate_content, create_examples, create_exercises],
)
