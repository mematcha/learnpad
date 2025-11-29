from google.adk.agents.llm_agent import Agent
from google.adk.memory import InMemoryMemory

memory = InMemoryMemory()
memory.preload_memory()

def get_student_progress(student_id: str) -> str:
    """Get the progress of a given student."""
    return f"The progress of the student {student_id} is {student_id}."
    
root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction='Answer user questions to the best of your knowledge',
    tools=[get_student_progress],
)
