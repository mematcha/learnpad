from google.adk.agents.llm_agent import Agent

def get_lesson_content(lesson_id: str) -> str:
    """Get the content of a given lesson."""
    return f"The content of the lesson {lesson_id} is {lesson_id}."

def get_examples(topic: str) -> str:
    """Get examples for a given topic."""
    return f"The examples for {topic} are {topic}."

root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction='Answer user questions to the best of your knowledge',
    tools=[get_lesson_content, get_examples],
)
