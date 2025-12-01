from typing import Dict, List, Any, Optional
import json
import re
import os
from google.genai import types

retry_config = types.HttpRetryOptions(
    attempts=5,
    exp_base=7,
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504],
)

# Import other agents and storage tooling
from agents.curriculum_planner.agent import generate_complete_curriculum
from agents.content_generator.agent import generate_content as generate_section_content
from storage.gcs_storage import GCSStorageService


INSTRUCTION_TEXT = """
You are a Notebook Loop Agent specialized in creating comprehensive study notebooks through iterative content generation.

Your primary responsibilities are:

1. **Iterative Content Generation**:
   - Generate notebook content for each topic/subtopic sequentially
   - Use previous generation results to improve subsequent content
   - Maintain consistency across all generated content
   - Ensure progressive learning difficulty

2. **Quality Assurance**:
   - Review and validate each generated piece of content
   - Ensure cross-references between topics are accurate
   - Verify that prerequisites are properly established
   - Check for completeness and educational value

3. **Progress Tracking**:
   - Track generation progress through the notebook creation process
   - Provide detailed status updates during generation
   - Report any issues or improvements needed

4. **Content Enhancement**:
   - Add practical examples and exercises
   - Include real-world applications
   - Provide learning objectives and success criteria
   - Suggest additional resources and further reading

You have access to these tools:
- curriculum_planner: Design curriculum and notebook structure
- content_generator: Generate high-quality educational content for each topic
- gcs_storage: Persist generated notebook files to GCS

Always provide detailed, educational content that promotes deep understanding and practical application.
"""


def _slugify_title(title: str) -> str:
    """Convert a section title into a filesystem-friendly slug."""
    slug = title.strip().lower()
    # Replace non-alphanumeric characters with underscores
    slug = re.sub(r"[^a-z0-9]+", "_", slug)
    # Remove leading/trailing underscores
    slug = slug.strip("_")
    return slug or "section"


def generate_notebook(
    subject: str,
    user_profile: str,
    learning_goals: str,
    user_experience_level: str,
    user_id: str,
    notebook_id: str,
    bucket_name: str,
    learning_style: Optional[str] = None,
    time_constraints: Optional[str] = None,
) -> str:
    """
    High-level orchestration tool for generating a complete notebook.
    
    This tool:
    1. Uses curriculum_planner to design a curriculum and notebook structure
    2. Derives an ordered list of topics/sections from the curriculum
    3. Uses content_generator to create markdown content for each section
    4. Uploads each section as a markdown file to GCS in:
       users/{user_id}/notebooks/{notebook_id}/sections/{index}_{slug}.md
    
    Args:
        subject: The main subject or topic for the notebook
        user_profile: JSON string of complete user profile from user assessment
        learning_goals: User's learning goals and objectives
        user_experience_level: User's experience level (beginner, intermediate, advanced)
        user_id: Unique identifier for the user
        notebook_id: Unique identifier for the notebook
        bucket_name: GCS bucket name for storing the notebook files
        learning_style: Optional learning style preference (visual, hands_on, theoretical, mixed)
        time_constraints: Optional time constraints (e.g., "10 hours per week", "2 months")
    
    Returns:
        JSON string containing status, generated files metadata, and curriculum details
    """
    try:
        # Step 1: generate curriculum plan
        curriculum_result = generate_complete_curriculum(
            subject=subject,
            user_profile=user_profile,
            learning_goals=learning_goals,
            time_constraints=time_constraints,
        )

        if curriculum_result.get("status") != "success":
            return json.dumps({
                "status": "error",
                "stage": "curriculum_planning",
                "details": curriculum_result,
            })

        curriculum = curriculum_result.get("curriculum", {})

        # Try to extract topics from the curriculum; fall back to a simple single-topic plan.
        learning_path = curriculum.get("learning_path") or {}
        topics = learning_path.get("topics") or []

        if not topics:
            # Fallback: treat the overall subject as a single topic.
            topics = [{"title": subject}]

        # Step 2: initialise storage service
        storage = GCSStorageService(bucket_name=bucket_name)

        generated_files: List[Dict[str, Any]] = []

        # Step 3: iterate through topics and generate/upload content
        for idx, topic in enumerate(topics, start=1):
            if isinstance(topic, str):
                title = topic
            else:
                title = topic.get("title") or topic.get("name") or f"Section {idx}"

            slug = _slugify_title(title)
            relative_path = f"sections/{idx:02d}_{slug}.md"

            # Build context string for content generator
            context_parts = [
                f"Notebook ID: {notebook_id}",
                f"User ID: {user_id}",
                f"Section index: {idx}",
            ]
            if time_constraints:
                context_parts.append(f"Time constraints: {time_constraints}")
            extra_context = " | ".join(context_parts)

            section_content = generate_section_content(
                topic=title,
                category="notebook_section",
                difficulty_level=user_experience_level,
                learning_style=learning_style,
                context=extra_context,
            )

            # Upload generated section as markdown
            gcs_path = storage.upload_file(
                user_id=user_id,
                notebook_id=notebook_id,
                file_path=relative_path,
                content=section_content,
                content_type="text/markdown",
            )

            generated_files.append(
                {
                    "index": idx,
                    "title": title,
                    "relative_path": relative_path,
                    "gcs_path": gcs_path,
                }
            )

        result = {
            "status": "success",
            "user_id": user_id,
            "notebook_id": notebook_id,
            "bucket_name": bucket_name,
            "files": generated_files,
            "curriculum": curriculum,
        }
        
        return json.dumps(result)
        
    except Exception as e:
        return json.dumps({
            "status": "error",
            "stage": "notebook_generation",
            "error": str(e),
        })


# Create ADK Agent with notebook generation as a tool
try:
    from google.adk.agents.llm_agent import Agent
    from google.adk.models.google_llm import Gemini
    from google.adk.tools import AgentTool
    
    # Import sub-agents to expose as tools
    curriculum_planner_agent = None
    content_generator_agent = None
    
    try:
        from ..curriculum_planner.agent import root_agent as curriculum_planner_agent
    except ImportError:
        pass
    
    try:
        from ..content_generator.agent import root_agent as content_generator_agent
    except ImportError:
        pass
    
    # Build tools list
    notebook_tools = [generate_notebook]
    
    # Add sub-agents as tools if available
    if curriculum_planner_agent is not None:
        notebook_tools.append(AgentTool(agent=curriculum_planner_agent))
    if content_generator_agent is not None:
        notebook_tools.append(AgentTool(agent=content_generator_agent))
    
    import os
    
    root_agent = Agent(
        model=Gemini(
            model="gemini-2.5-flash",
            retry_options=retry_config,
            # Configure to use Vertex AI (not API key)
            vertexai=True,
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION")
        ),
        name="notebook_loop_agent",
        description="Orchestrator agent that creates comprehensive study notebooks by coordinating curriculum planning, content generation, and GCS storage",
        instruction=INSTRUCTION_TEXT,
        tools=notebook_tools,
    )
    
except ImportError as e:
    # Fallback: Keep the generate_notebook function available for direct use
    print(f"Warning: Could not create ADK agent for notebook_loop_agent: {e}")
    print("The generate_notebook function is still available for direct use.")
    
    class SimpleNotebookAgent:
        """Fallback simple agent wrapper."""
        def __init__(self):
            self.generate_notebook = generate_notebook
    
root_agent = SimpleNotebookAgent()
