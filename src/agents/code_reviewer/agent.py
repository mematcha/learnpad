from google.adk.agents.llm_agent import Agent

def review_code(code: str) -> str:
    """Review code and return a review of the code."""
    return f"The review of the code is {code}."

def fix_code(code: str) -> str:
    """Fix code and return a fixed code."""
    return f"The fixed code is {code}."

def execute_code(code: str) -> str:
    """Execute code and return the output of the code."""
    return f"The output of the code is {code}."

root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description='A helpful assistant for user questions.',
    instruction='Answer user questions to the best of your knowledge',
    tools=[review_code, fix_code, execute_code],
)
