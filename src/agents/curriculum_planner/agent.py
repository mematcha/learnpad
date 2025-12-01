from typing import Dict, Any, List, Optional
import json
from google.genai import types

retry_config = types.HttpRetryOptions(
    attempts=5,
    exp_base=7,
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504],
)

# Note: When using ADK Agents, the SDK is initialized by the ADK framework
# No need to manually initialize google.generativeai here

INSTRUCTION_TEXT = """
You are a Curriculum Designer Agent responsible for designing comprehensive learning curricula and notebook structures based on user assessment data.

Your primary responsibilities are:

1. **Create Learning Paths and Topic Sequences**:
   - Analyze user goals, experience level, and learning preferences
   - Design logical topic sequences that build upon each other
   - Identify prerequisite relationships between topics
   - Create learning paths that respect user's time constraints and pacing preferences
   - Ensure topics flow naturally from foundational to advanced concepts

2. **Design Notebook Structure (Sections, Progression)**:
   - Design the overall notebook structure with clear sections and subsections
   - Plan the progression of content within each notebook
   - Determine how many notebooks are needed and how content should be distributed
   - Create a hierarchical structure (topics → subtopics → sections → lessons)
   - Ensure each notebook has a clear learning objective and scope

3. **Determine Content Depth and Complexity**:
   - Assess appropriate content depth based on user's experience level
   - Balance theory vs. practice based on user preferences
   - Adjust complexity to match user's readiness and goals
   - Determine the level of detail needed for each topic
   - Consider user's learning style (visual, hands-on, theoretical, combination)

4. **Plan Assessment Integration Points**:
   - Identify strategic points for checkpoints and assessments
   - Design formative assessments (quizzes, exercises) throughout the curriculum
   - Plan summative assessments (major checkpoints, projects) at key milestones
   - Determine assessment frequency based on user's pacing preferences
   - Design assessments that align with learning objectives

5. **Design Practice Progression (Beginner → Intermediate → Advanced)**:
   - Create a scaffolded progression of practice exercises
   - Start with foundational exercises and gradually increase complexity
   - Design exercises that build skills incrementally
   - Include varied practice types (coding, problem-solving, projects, analysis)
   - Ensure practice aligns with user's preferred learning style

When designing a curriculum:
- Always consider the user's assessment profile (experience level, learning style, goals, time constraints)
- Create structured, actionable curriculum plans that can be implemented
- Use the curriculum design tools to generate comprehensive plans
- Ensure the curriculum is personalized to the user's needs
- Balance comprehensiveness with feasibility given time constraints
- Design for progressive skill building and knowledge acquisition

Always aim to create a curriculum that is:
- Well-structured and logically sequenced
- Appropriately challenging for the user's level
- Aligned with their learning goals and preferences
- Feasible within their time constraints
- Rich in practice opportunities and assessment checkpoints
"""


def create_learning_path(
    subject: str,
    user_experience_level: str,
    learning_goals: str,
    time_constraints: Optional[str] = None,
    user_profile: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a comprehensive learning path with topic sequences for a given subject.
    
    Args:
        subject: The main subject or topic to create a learning path for
        user_experience_level: User's experience level (beginner, intermediate, advanced)
        learning_goals: User's learning goals and objectives
        time_constraints: Optional time constraints (e.g., "10 hours per week", "2 months")
        user_profile: Optional JSON string of complete user profile for context
    
    Returns:
        Dictionary containing the learning path with topic sequences, prerequisites, and progression
    """
    try:
        # Parse user profile if provided
        profile_data = {}
        if user_profile:
            try:
                profile_data = json.loads(user_profile)
            except:
                pass
        
        # This would typically use the LLM to generate the learning path
        # For now, return a structured response that the agent can populate
        learning_path = {
            "subject": subject,
            "user_experience_level": user_experience_level,
            "learning_goals": learning_goals,
            "time_constraints": time_constraints,
            "topics": [],
            "prerequisite_map": {},
            "estimated_total_time": None,
            "learning_path_summary": ""
        }
        
        return {
            "status": "success",
            "learning_path": learning_path,
            "message": f"Learning path structure created for {subject}. Use design_notebook_structure to design the notebook layout."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": f"Error creating learning path: {str(e)}"
        }


def design_notebook_structure(
    learning_path: str,
    user_pacing_preference: Optional[str] = None,
    notebook_count_preference: Optional[int] = None
) -> Dict[str, Any]:
    """
    Design the notebook structure with sections, progression, and content distribution.
    
    Args:
        learning_path: JSON string or description of the learning path from create_learning_path
        user_pacing_preference: User's preferred pacing (e.g., "1 notebook per week", "2 hours per session")
        notebook_count_preference: Optional preferred number of notebooks
    
    Returns:
        Dictionary containing notebook structure with sections, progression, and content distribution
    """
    try:
        # Parse learning path if provided as JSON
        path_data = {}
        if learning_path:
            try:
                path_data = json.loads(learning_path)
            except:
                pass
        
        notebook_structure = {
            "notebooks": [],
            "overall_structure": {
                "total_notebooks": None,
                "progression_strategy": "",
                "section_organization": ""
            },
            "content_distribution": {},
            "section_hierarchy": {}
        }
        
        return {
            "status": "success",
            "notebook_structure": notebook_structure,
            "message": "Notebook structure designed. Use determine_content_depth to set appropriate complexity levels."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": f"Error designing notebook structure: {str(e)}"
        }


def determine_content_depth(
    topic: str,
    user_experience_level: str,
    learning_style: Optional[str] = None,
    theory_vs_practice_ratio: Optional[str] = None,
    user_readiness_score: Optional[float] = None
) -> Dict[str, Any]:
    """
    Determine appropriate content depth and complexity for a topic based on user profile.
    
    Args:
        topic: The topic to analyze
        user_experience_level: User's experience level (beginner, intermediate, advanced)
        learning_style: Optional learning style preference (visual, hands-on, theoretical, combination)
        theory_vs_practice_ratio: Optional ratio preference (e.g., "70% practice, 30% theory")
        user_readiness_score: Optional readiness score (0-1) for this topic
    
    Returns:
        Dictionary containing content depth recommendations, complexity level, and theory/practice balance
    """
    try:
        content_depth_plan = {
            "topic": topic,
            "recommended_depth": None,  # basic, intermediate, comprehensive, expert
            "complexity_level": None,  # beginner, intermediate, advanced, expert
            "theory_practice_balance": {
                "theory_percentage": None,
                "practice_percentage": None,
                "rationale": ""
            },
            "content_scope": {
                "key_concepts_to_cover": [],
                "optional_advanced_topics": [],
                "depth_justification": ""
            },
            "learning_style_adaptations": {}
        }
        
        return {
            "status": "success",
            "content_depth": content_depth_plan,
            "message": f"Content depth determined for {topic}. Use plan_assessment_points to integrate assessments."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": f"Error determining content depth: {str(e)}"
        }


def plan_assessment_points(
    curriculum_structure: str,
    checkpoint_frequency_preference: Optional[str] = None,
    assessment_types_preference: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Plan assessment integration points throughout the curriculum.
    
    Args:
        curriculum_structure: JSON string or description of the curriculum/notebook structure
        checkpoint_frequency_preference: Optional preference (e.g., "after each topic", "weekly", "every 3 lessons")
        assessment_types_preference: Optional list of preferred assessment types (quiz, exercise, project, checkpoint)
    
    Returns:
        Dictionary containing assessment plan with checkpoints, formative assessments, and summative assessments
    """
    try:
        # Parse curriculum structure if provided as JSON
        structure_data = {}
        if curriculum_structure:
            try:
                structure_data = json.loads(curriculum_structure)
            except:
                pass
        
        assessment_plan = {
            "formative_assessments": [],  # Ongoing quizzes, exercises, mini-checks
            "summative_assessments": [],  # Major checkpoints, projects, comprehensive tests
            "checkpoint_schedule": [],
            "assessment_strategy": {
                "frequency": None,
                "types": assessment_types_preference or ["exercise", "quiz", "checkpoint"],
                "integration_points": []
            },
            "learning_objective_alignment": {}
        }
        
        return {
            "status": "success",
            "assessment_plan": assessment_plan,
            "message": "Assessment points planned. Use design_practice_progression to create exercise sequences."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": f"Error planning assessment points: {str(e)}"
        }


def design_practice_progression(
    topic: str,
    user_experience_level: str,
    learning_style: Optional[str] = None,
    practice_types_preference: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Design a scaffolded practice progression from beginner to advanced for a topic.
    
    Args:
        topic: The topic to design practice progression for
        user_experience_level: User's experience level (beginner, intermediate, advanced)
        learning_style: Optional learning style preference (visual, hands-on, theoretical, combination)
        practice_types_preference: Optional list of preferred practice types (coding, problem-solving, project, analysis)
    
    Returns:
        Dictionary containing practice progression with exercises organized by difficulty level
    """
    try:
        practice_progression = {
            "topic": topic,
            "progression_stages": {
                "beginner": {
                    "exercises": [],
                    "objectives": [],
                    "estimated_time": None
                },
                "intermediate": {
                    "exercises": [],
                    "objectives": [],
                    "estimated_time": None
                },
                "advanced": {
                    "exercises": [],
                    "objectives": [],
                    "estimated_time": None
                }
            },
            "scaffolding_strategy": "",
            "skill_building_path": [],
            "practice_types": practice_types_preference or ["exercise", "problem-solving", "project"]
        }
        
        return {
            "status": "success",
            "practice_progression": practice_progression,
            "message": f"Practice progression designed for {topic} with beginner → intermediate → advanced stages."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": f"Error designing practice progression: {str(e)}"
        }


def generate_complete_curriculum(
    subject: str,
    user_profile: str,
    learning_goals: str,
    time_constraints: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a complete curriculum plan integrating all design elements.
    
    This is a comprehensive tool that combines learning paths, notebook structure,
    content depth, assessments, and practice progression into a unified curriculum plan.
    
    Args:
        subject: The main subject or topic
        user_profile: JSON string of complete user profile from user assessment
        learning_goals: User's learning goals and objectives
        time_constraints: Optional time constraints
    
    Returns:
        Dictionary containing the complete curriculum plan with all design elements integrated
    """
    try:
        # Parse user profile
        profile_data = {}
        if user_profile:
            try:
                profile_data = json.loads(user_profile)
            except:
                pass
        
        complete_curriculum = {
            "subject": subject,
            "curriculum_metadata": {
                "created_for": profile_data.get("experience_level", "unknown"),
                "estimated_completion_time": None,
                "total_notebooks": None,
                "total_topics": None
            },
            "learning_path": {},
            "notebook_structure": {},
            "content_depth_plan": {},
            "assessment_plan": {},
            "practice_progression": {},
            "implementation_notes": ""
        }
        
        return {
            "status": "success",
            "curriculum": complete_curriculum,
            "message": "Complete curriculum plan generated. Review and refine individual components as needed."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": f"Error generating complete curriculum: {str(e)}"
        }


# Create ADK Agent with all curriculum planning tools
try:
    from google.adk.agents.llm_agent import Agent
    from google.adk.models.google_llm import Gemini
    
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
        name="curriculum_planner_agent",
        description="Specialist agent for designing comprehensive learning curricula, notebook structures, and learning paths based on user assessment data",
        instruction=INSTRUCTION_TEXT,
        tools=[
            create_learning_path,
            design_notebook_structure,
            determine_content_depth,
            plan_assessment_points,
            design_practice_progression,
            generate_complete_curriculum,
        ],
    )
except ImportError as e:
    # Fallback: Create a simple agent class if ADK is not available
    # If ADK is not available, the agent cannot function
    print(f"ERROR: Google ADK is required for curriculum_planner agent: {e}")
    print("Install with: pip install google-adk google-cloud-aiplatform google-genai")
    root_agent = None
