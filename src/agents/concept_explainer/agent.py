from google.adk.agents.llm_agent import Agent
from google.adk.models.google_llm import Gemini
from google.genai import types
from typing import Optional, Dict, Any, List
import os
import re
from pathlib import Path

retry_config = types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504],  # Retry on these HTTP errors
)

# Create a shared model instance for content analysis
_content_model = Gemini(
    model="gemini-2.5-flash",
    retry_options=retry_config
)

INSTRUCTION_TEXT = """
You are a Concept Explainer Agent, a specialist for real-time, interactive concept explanations and Q&A during learning sessions.

Your primary role is to provide clear, adaptive, and personalized explanations that help students understand concepts deeply.

**Core Responsibilities**:

1. **Retrieve and Ground in Actual Content**:
   - Always use get_lesson_content to fetch actual lesson materials before explaining (if available)
   - Ground your explanations in the specific content the student is learning
   - Reference specific sections, examples, and concepts from the lesson
   - If lesson content is not available, provide clear explanations based on your knowledge

2. **Provide Adaptive Explanations**:
   - Adapt your explanation style to the student's experience level (beginner, intermediate, advanced)
   - Consider their learning style (visual, hands-on, theoretical, mixed)
   - Adjust complexity and depth based on their current understanding
   - The teacher agent will provide student context when delegating to you - use that information to personalize your explanations
   - If context is not provided, use get_student_context as a fallback (though it may return default values)

3. **Use Effective Teaching Techniques**:
   - **Analogies**: Use relatable analogies that connect new concepts to familiar ideas
   - **Step-by-step reasoning**: Break down complex concepts into clear, logical steps
   - **Progressive disclosure**: Start simple, then add complexity as understanding builds
   - **Examples**: Always use get_examples to find relevant examples from the curriculum (if available)
   - **Visual descriptions**: For visual learners, describe concepts in visual terms
   - **Hands-on connections**: For hands-on learners, connect to practical applications

4. **Personalization**:
   - Reference what the student already knows (from their progress)
   - Connect new concepts to previously mastered topics
   - Adjust terminology to match their experience level
   - Match communication style to their preferences
   - Build on their existing knowledge foundation

5. **Interactive Q&A**:
   - Answer questions clearly and directly
   - If a question reveals a misunderstanding, gently correct it
   - Ask clarifying questions when needed to understand what they're asking
   - Provide multiple perspectives when helpful
   - Encourage deeper thinking with follow-up questions

6. **Content Integration**:
   - Always retrieve lesson content before explaining (if file paths are provided)
   - Use actual examples from the curriculum when available
   - Reference specific sections, code snippets, or concepts from materials
   - Help students navigate and understand the structured learning materials
   - If no lesson files are available, provide comprehensive explanations from your knowledge

**Explanation Strategy**:
1. First, retrieve the relevant lesson content using get_lesson_content (if a path is provided)
2. Use the student context provided by the teacher agent (or get_student_context if needed)
3. Find relevant examples using get_examples from the actual lesson content (if available)
4. Structure your explanation:
   - Start with a simple, clear overview
   - Use an analogy if helpful (especially for beginners)
   - Break down into logical steps
   - Provide concrete examples from the lesson or generate relevant examples
   - Connect to what they already know (from their progress)
   - Summarize key points
5. Always ground your explanation in the actual lesson content you retrieved, or provide comprehensive explanations if content is not available

**Adaptation Guidelines**:
- **Beginner**: Use simple language, many analogies, step-by-step breakdowns, avoid jargon
- **Intermediate**: Balance simplicity with depth, introduce terminology gradually, connect to broader concepts
- **Advanced**: Use precise terminology, explore nuances, connect to related advanced topics

**Learning Style Adaptations**:
- **Visual**: Describe spatial relationships, use visual metaphors, suggest diagrams
- **Hands-on**: Emphasize practical applications, connect to real-world use cases
- **Theoretical**: Focus on principles, underlying concepts, and relationships
- **Mixed**: Combine approaches as appropriate

Remember: Your goal is to help students understand concepts deeply, not just memorize them. Be patient, encouraging, and adapt your approach to each student's needs.
"""


def _find_file_by_path_or_name(file_path_or_name: str) -> Optional[Path]:
    """
    Find a file by absolute path, relative path, or by searching for matching filenames.
    No base directory required - works with any path structure.
    """
    # Try as absolute path first
    potential_path = Path(file_path_or_name)
    if potential_path.exists() and potential_path.is_file():
        return potential_path
    
    # Try with .md extension
    potential_path = Path(f"{file_path_or_name}.md")
    if potential_path.exists() and potential_path.is_file():
        return potential_path
    
    # Try as relative path from current working directory
    potential_path = Path.cwd() / file_path_or_name
    if potential_path.exists() and potential_path.is_file():
        return potential_path
    
    potential_path = Path.cwd() / f"{file_path_or_name}.md"
    if potential_path.exists() and potential_path.is_file():
        return potential_path
    
    # Search in current directory and subdirectories for matching filenames
    search_name = file_path_or_name.lower().replace(" ", "_")
    if not search_name.endswith(".md"):
        search_name = f"{search_name}.md"
    
    # Search current directory and common subdirectories
    search_dirs = [
        Path.cwd(),
        Path.cwd() / "music_theory",
        Path.cwd() / "learning_materials",
        Path.cwd() / "materials",
        Path.cwd() / "content",
        Path.cwd() / "lessons",
    ]
    
    for search_dir in search_dirs:
        if search_dir.exists() and search_dir.is_dir():
            # Try exact filename match
            for md_file in search_dir.rglob("*.md"):
                if md_file.name.lower() == search_name:
                    return md_file
                if md_file.stem.lower() == search_name.replace(".md", ""):
                    return md_file
            
            # Try partial match
            for md_file in search_dir.rglob("*.md"):
                if search_name.replace(".md", "") in md_file.stem.lower() or md_file.stem.lower() in search_name.replace(".md", ""):
                    return md_file
    
    return None


def get_lesson_content(
    file_path_or_topic: str,
    include_related: Optional[bool] = False
) -> str:
    """
    Get the actual content of a lesson from a file path or by searching for the topic.
    
    This function accepts:
    - Absolute file paths (e.g., "/path/to/lesson.md")
    - Relative paths (e.g., "music_theory/triads/triads.md")
    - Topic names (e.g., "triads") - will search for matching files
    
    Args:
        file_path_or_topic: File path (absolute or relative) or topic name to search for
        include_related: If True, also include content from related README files in the same directory
    
    Returns:
        String containing the lesson content, or error message if not found
    """
    try:
        lesson_file = _find_file_by_path_or_name(file_path_or_topic)
        
        if not lesson_file or not lesson_file.exists():
            return (
                f"Lesson file '{file_path_or_topic}' not found. "
                f"Please provide an absolute path, relative path, or ensure the file exists in the current directory structure."
            )
        
        # Read the lesson content
        content = lesson_file.read_text(encoding='utf-8')
        
        # Optionally include related README content
        if include_related:
            # Try to find README in the same directory
            readme_path = lesson_file.parent / "README.md"
            if readme_path.exists() and readme_path != lesson_file:
                readme_content = readme_path.read_text(encoding='utf-8')
                content = f"{readme_content}\n\n---\n\n{content}"
        
        return content
        
    except Exception as e:
        return f"Error retrieving lesson content: {str(e)}. Please check the file path or topic name."


def get_examples(
    topic_or_path: str,
    num_examples: Optional[int] = 3,
    difficulty_level: Optional[str] = None
) -> str:
    """
    Get examples for a given topic from lesson content or generate contextual examples.
    
    Args:
        topic_or_path: The topic name or file path to get examples for
        num_examples: Number of examples to retrieve (default: 3)
        difficulty_level: Optional difficulty filter (beginner, intermediate, advanced)
    
    Returns:
        String containing examples from the lesson content or generated examples
    """
    try:
        # First, try to get the lesson content
        lesson_content = get_lesson_content(topic_or_path, include_related=True)
        
        # If we found actual content, extract examples from it
        if "not found" not in lesson_content.lower() and "error" not in lesson_content.lower():
            examples = []
            
            # Look for "Examples" or "💡 Examples" section
            example_patterns = [
                r'##\s+💡\s+Examples\s*\n(.*?)(?=\n##|\Z)',
                r'##\s+Examples\s*\n(.*?)(?=\n##|\Z)',
                r'###\s+Examples\s*\n(.*?)(?=\n##|\n###|\Z)',
                r'💡\s+Examples\s*\n(.*?)(?=\n##|\n###|\Z)',
            ]
            
            for pattern in example_patterns:
                matches = re.findall(pattern, lesson_content, re.DOTALL | re.IGNORECASE)
                if matches:
                    examples_text = matches[0].strip()
                    # Split into individual examples
                    example_items = re.split(r'\n(?=\d+\.|\*|\-|```)', examples_text)
                    examples.extend([ex.strip() for ex in example_items if ex.strip()])
                    break
            
            # If no examples section found, look for code blocks or example-like content
            if not examples:
                # Look for code blocks
                code_blocks = re.findall(r'```[\w]*\n(.*?)```', lesson_content, re.DOTALL)
                if code_blocks:
                    examples.extend([f"Code example:\n```\n{block.strip()}\n```" for block in code_blocks[:num_examples]])
                
                # Look for bullet points that might be examples
                bullet_examples = re.findall(r'^[\*\-\+]\s+(.*?)$', lesson_content, re.MULTILINE)
                if bullet_examples:
                    examples.extend([ex.strip() for ex in bullet_examples[:num_examples]])
            
            # If we found examples in the content, return them
            if examples:
                formatted_examples = "\n\n".join(examples[:num_examples])
                if difficulty_level:
                    return f"Examples for {topic_or_path} (filtered for {difficulty_level} level):\n\n{formatted_examples}"
                return f"Examples for {topic_or_path}:\n\n{formatted_examples}"
        
        # If no lesson content found or no examples extracted, generate contextual examples
        prompt = f"""Based on the topic '{topic_or_path}', provide {num_examples} clear, practical examples that illustrate the key concepts.

Provide examples that are:
- Clear and easy to understand
- Directly related to the topic
- Practical and applicable
- Appropriate for the topic

Format each example clearly with explanations."""
        
        if difficulty_level:
            prompt += f"\n\nDifficulty level: {difficulty_level}"
        
        try:
            response = _content_model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Could not generate examples: {str(e)}. Please try again or provide a file path to lesson content."
        
    except Exception as e:
        return f"Error retrieving examples: {str(e)}. Please try again or specify the topic more clearly."


def get_student_context(
    user_id: Optional[str] = None,
    topic: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get student context including experience level, learning style, and progress.
    
    This is a simplified version. In a full implementation, this would query
    the teacher agent's memory system or a database.
    
    Args:
        user_id: Optional user identifier
        topic: Optional current topic for context
    
    Returns:
        Dictionary with student context information
    """
    # In a real implementation, this would query the teacher agent's memory
    # For now, return a structure that can be populated
    # The teacher agent should pass this information when calling the concept explainer
    
    context = {
        "experience_level": "intermediate",  # Default, should be overridden
        "learning_style": "mixed",  # Default, should be overridden
        "current_topic": topic,
        "topics_mastered": [],
        "topics_in_progress": [],
        "preferences": {}
    }
    
    # Note: In practice, the teacher agent should pass this context
    # when delegating to the concept explainer. This function provides
    # a structure for that context.
    
    return {
        "status": "success",
        "context": context,
        "note": "This is default context. The teacher agent should provide actual student context when delegating."
    }


def search_related_concepts(
    topic_or_path: str,
    max_results: Optional[int] = 5
) -> str:
    """
    Search for related concepts and topics near the given file or topic.
    
    Args:
        topic_or_path: The topic or file path to find related concepts for
        max_results: Maximum number of related concepts to return
    
    Returns:
        String listing related concepts and their locations
    """
    try:
        current_file = _find_file_by_path_or_name(topic_or_path)
        
        if not current_file:
            return f"Could not find file for '{topic_or_path}'. Please provide a valid file path to search for related concepts."
        
        related = []
        current_dir = current_file.parent
        
        # Look for related files in the same directory and parent directories
        for md_file in current_dir.rglob("*.md"):
            if md_file == current_file or md_file.name in ["README.md", "PROGRESS.md"]:
                continue
            
            # Check if it's related (same directory or nearby)
            if md_file.parent == current_dir or md_file.parent.parent == current_dir:
                related.append(str(md_file.relative_to(current_dir.parent)) if current_dir.parent != current_dir else md_file.name)
        
        # Also check parent directory
        if current_dir.parent.exists():
            for md_file in current_dir.parent.rglob("*.md"):
                if md_file.name not in ["README.md", "PROGRESS.md"] and md_file != current_file:
                    if md_file not in [Path(r) for r in related]:
                        related.append(str(md_file.relative_to(current_dir.parent)))
        
        if related:
            return f"Related concepts for '{topic_or_path}':\n" + "\n".join(f"- {r}" for r in related[:max_results])
        else:
            return f"No related concepts found near '{topic_or_path}'. The file may be isolated or in a unique location."
            
    except Exception as e:
        return f"Error searching for related concepts: {str(e)}"


root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash",  # Upgraded from lite for better explanations
        retry_options=retry_config
    ),
    name="concept_explainer_agent",
    description="Specialist agent for real-time, interactive concept explanations and Q&A during learning sessions. Provides adaptive, personalized explanations grounded in actual lesson content when available.",
    instruction=INSTRUCTION_TEXT,
    tools=[
        get_lesson_content,
        get_examples,
        get_student_context,
        search_related_concepts,
    ],
)
