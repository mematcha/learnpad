from google.adk.agents.llm_agent import Agent
from google.adk.models.google_llm import Gemini
from google.genai import types
from typing import Optional

retry_config = types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504],  # Retry on these HTTP errors
)

# Create a shared model instance for tools to use
_content_model = Gemini(
    model="gemini-2.5-flash",
    retry_options=retry_config
)

INSTRUCTION_TEXT = """
You are a Content Generator Agent specialized in creating high-quality educational content for programming education.

Your primary responsibilities are:

1. **Generate Structured Explanations**:
   - Create clear, well-organized explanations of programming concepts
   - Break down complex topics into digestible sections
   - Use appropriate terminology for the student's level
   - Include context, background, and practical applications
   - Structure content with clear headings, bullet points, and code blocks

2. **Create Practical Examples**:
   - Generate code examples that illustrate concepts clearly
   - Provide examples at appropriate difficulty levels
   - Include comments and explanations within examples
   - Show real-world use cases and applications
   - Create progressive examples (simple → complex)

3. **Design Educational Exercises**:
   - Create exercises that reinforce learning objectives
   - Design exercises with varying difficulty levels
   - Include both guided practice and independent challenges
   - Provide clear instructions and expected outcomes
   - Design exercises that build on previous knowledge

4. **Content Personalization**:
   - Adapt content to student's experience level (beginner, intermediate, advanced)
   - Consider learning style preferences (visual, hands-on, theoretical)
   - Match content depth to student's goals and needs
   - Use appropriate pacing and complexity

5. **Content Quality Standards**:
   - Ensure accuracy and correctness of all content
   - Use clear, concise language
   - Include relevant code snippets with proper formatting
   - Provide context and connections to related topics
   - Make content engaging and practical

When generating content:
- Always use the appropriate tools (generate_content, create_examples, create_exercises)
- Consider the student's level, learning style, and goals when provided
- Create content that is immediately usable and actionable
- Ensure examples are runnable and exercises are solvable
- Structure content for easy consumption and learning

Remember: You're creating educational content that helps students learn effectively. Quality, clarity, and appropriateness are paramount.
"""


def generate_content(
    topic: str,
    category: str,
    difficulty_level: Optional[str] = "intermediate",
    learning_style: Optional[str] = None,
    context: Optional[str] = None
) -> str:
    """
    Generate comprehensive educational content for a given topic and category.
    
    Args:
        topic: The topic to generate content for (e.g., "Python functions", "React hooks")
        category: The category of content (e.g., "explanation", "tutorial", "reference", "summary")
        difficulty_level: Optional difficulty level (beginner, intermediate, advanced). Defaults to intermediate.
        learning_style: Optional learning style preference (visual, hands_on, theoretical, mixed)
        context: Optional additional context about the student's needs or background
    
    Returns:
        String containing the generated educational content
    """
    try:
        # Build the prompt for content generation
        prompt_parts = [
            f"Generate comprehensive educational content for the topic: {topic}",
            f"Category: {category}",
            f"Difficulty Level: {difficulty_level}",
        ]
        
        if learning_style:
            prompt_parts.append(f"Learning Style: {learning_style}")
            style_guidance = {
                "visual": "Include diagrams, visual examples, and structured layouts.",
                "hands_on": "Focus on practical examples and interactive exercises.",
                "theoretical": "Emphasize concepts, principles, and deep explanations.",
                "mixed": "Balance theory with practice, include various learning approaches."
            }
            prompt_parts.append(style_guidance.get(learning_style, ""))
        
        if context:
            prompt_parts.append(f"Additional Context: {context}")
        
        prompt_parts.extend([
            "",
            "Generate well-structured content that includes:",
            "- Clear introduction and overview",
            "- Key concepts explained in detail",
            "- Practical applications and use cases",
            "- Code examples where relevant (properly formatted)",
            "- Summary and key takeaways",
            "",
            "Format the content with clear headings, bullet points, and code blocks.",
            "Ensure the content is accurate, clear, and appropriate for the specified difficulty level."
        ])
        
        prompt = "\n".join(prompt_parts)
        
        # Generate content using the model
        response = _content_model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        return f"Error generating content: {str(e)}. Please try again or provide more specific requirements."


def create_examples(
    topic: str,
    difficulty_level: Optional[str] = "intermediate",
    num_examples: Optional[int] = 3,
    include_explanations: Optional[bool] = True,
    context: Optional[str] = None
) -> str:
    """
    Create practical code examples for a given topic.
    
    Args:
        topic: The topic to create examples for
        difficulty_level: Optional difficulty level (beginner, intermediate, advanced). Defaults to intermediate.
        num_examples: Optional number of examples to generate (default: 3)
        include_explanations: Whether to include explanations with examples (default: True)
        context: Optional additional context about what the examples should demonstrate
    
    Returns:
        String containing the generated examples with code and explanations
    """
    try:
        # Build the prompt for example generation
        prompt_parts = [
            f"Create {num_examples} practical code examples for the topic: {topic}",
            f"Difficulty Level: {difficulty_level}",
        ]
        
        if context:
            prompt_parts.append(f"Context: {context}")
        
        prompt_parts.extend([
            "",
            "For each example, provide:",
            "- Clear, runnable code (properly formatted with syntax highlighting)",
            "- Comments explaining key parts of the code",
            "- Expected output or behavior",
        ])
        
        if include_explanations:
            prompt_parts.append("- Brief explanation of what the example demonstrates and why it's useful")
        
        prompt_parts.extend([
            "",
            "Structure the examples progressively:",
            "- Start with a simple, foundational example",
            "- Progress to more complex or practical examples",
            "- Show different use cases or variations",
            "",
            "Ensure all code is correct, well-commented, and demonstrates the concept clearly."
        ])
        
        prompt = "\n".join(prompt_parts)
        
        # Generate examples using the model
        response = _content_model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        return f"Error creating examples: {str(e)}. Please try again or provide more specific requirements."


def create_exercises(
    topic: str,
    difficulty_level: Optional[str] = "intermediate",
    num_exercises: Optional[int] = 3,
    exercise_type: Optional[str] = "mixed",
    include_solutions: Optional[bool] = True,
    context: Optional[str] = None
) -> str:
    """
    Create educational exercises for a given topic.
    
    Args:
        topic: The topic to create exercises for
        difficulty_level: Optional difficulty level (beginner, intermediate, advanced). Defaults to intermediate.
        num_exercises: Optional number of exercises to generate (default: 3)
        exercise_type: Optional type of exercises (coding, conceptual, problem_solving, mixed). Defaults to mixed.
        include_solutions: Whether to include solutions with exercises (default: True)
        context: Optional additional context about learning objectives or focus areas
    
    Returns:
        String containing the generated exercises with instructions and solutions
    """
    try:
        # Build the prompt for exercise generation
        prompt_parts = [
            f"Create {num_exercises} educational exercises for the topic: {topic}",
            f"Difficulty Level: {difficulty_level}",
            f"Exercise Type: {exercise_type}",
        ]
        
        if context:
            prompt_parts.append(f"Context: {context}")
        
        exercise_type_guidance = {
            "coding": "Focus on hands-on coding exercises that require writing code.",
            "conceptual": "Focus on understanding concepts, explaining ideas, or analyzing code.",
            "problem_solving": "Focus on problem-solving exercises that apply the concept to solve real problems.",
            "mixed": "Include a variety of exercise types: coding, conceptual, and problem-solving."
        }
        prompt_parts.append(exercise_type_guidance.get(exercise_type, ""))
        
        prompt_parts.extend([
            "",
            "For each exercise, provide:",
            "- Clear exercise title and objective",
            "- Detailed instructions explaining what to do",
            "- Expected learning outcomes",
            "- Hints or guidance (if appropriate for the difficulty level)",
        ])
        
        if include_solutions:
            prompt_parts.append("- Complete solution with explanation")
        
        prompt_parts.extend([
            "",
            "Structure exercises to:",
            "- Build progressively in difficulty",
            "- Reinforce key concepts from the topic",
            "- Be solvable at the specified difficulty level",
            "- Provide clear success criteria",
            "",
            "Ensure exercises are practical, relevant, and help students master the topic."
        ])
        
        prompt = "\n".join(prompt_parts)
        
        # Generate exercises using the model
        response = _content_model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        return f"Error creating exercises: {str(e)}. Please try again or provide more specific requirements."


root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash",
        retry_options=retry_config
    ),
    name="content_generator_agent",
    description="Specialist agent for generating educational content including explanations, examples, and exercises for programming education",
    instruction=INSTRUCTION_TEXT,
    tools=[generate_content, create_examples, create_exercises],
)
