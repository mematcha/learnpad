from typing import Dict, List, Any, Optional
import json

# Import standard Google Generative AI SDK for content generation
_content_model = None
_use_genai_sdk = False
_genai_error = None

try:
    import google.generativeai as genai
    import os

    # Configure with API key from environment
    # The google-generativeai SDK requires an explicit API key
    api_key = os.getenv("GOOGLE_API_KEY")

    if api_key:
        genai.configure(api_key=api_key)
        _content_model = genai.GenerativeModel("gemini-2.5-flash")
        _use_genai_sdk = True
    else:
        # No API key available - the SDK requires it
        _genai_error = "GOOGLE_API_KEY environment variable not set. Get your API key from https://makersuite.google.com/app/apikey"
        _use_genai_sdk = False

except ImportError as e:
    _genai_error = f"google-generativeai package not installed: {str(e)}"
    _use_genai_sdk = False
except Exception as e:
    _genai_error = f"Error configuring Google Generative AI: {str(e)}"
    _use_genai_sdk = False

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
- generate_topic_content: Generate comprehensive content for a specific topic
- validate_content_quality: Review and validate generated content
- create_cross_references: Establish links between related topics
- enhance_with_examples: Add practical examples to content
- add_exercises: Create practice exercises for the topic

Always provide detailed, educational content that promotes deep understanding and practical application.
"""

# Create a simple agent class that doesn't use google.adk to avoid client issues
class SimpleNotebookAgent:
    """Simple agent that uses google.generativeai directly."""

    def __init__(self):
        self.model = _content_model if _use_genai_sdk else None
        self.instruction = INSTRUCTION_TEXT

    async def generate_content(self, prompt: str) -> str:
        """Generate content using the model."""
        if not self.model:
            return f"Error: {_genai_error or 'Model not available'}"

        try:
            full_prompt = f"{self.instruction}\n\n{prompt}"
            response = await self.model.generate_content_async(full_prompt)
            return response.text
        except Exception as e:
            return f"Error generating content: {str(e)}"

# Create the agent instance
root_agent = SimpleNotebookAgent()
