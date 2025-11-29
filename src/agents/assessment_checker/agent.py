from google.adk.agents.llm_agent import Agent



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
    model='gemini-2.5-flash',
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction='Answer user questions to the best of your knowledge',
    tools=[check_understanding, provide_feedback, generate_report],
)
