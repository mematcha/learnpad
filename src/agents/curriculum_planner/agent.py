from google.adk.agents.llm_agent import Agent

def analyze_category(category: str) -> str:
    """Analyze a category and return a description of the category."""
    return f"The category is {category}."

def structure_learning_path(topic: str, category: str) -> str:
    """Structure a learning path for a given topic and category."""
    return f"The learning path for {topic} in {category} is {topic}."

root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction='Answer user questions to the best of your knowledge',
    tools=[analyze_category, structure_learning_path],
)

