"""Content generator using local ADK API server.

This uses the actual ADK agents running on localhost:8000 instead of calling
Gemini API directly. This gives you the full multi-agent experience locally!

Requires: adk api_server --port 8000 (running in another terminal)
"""
import os
import re
import uuid
from typing import Dict, Any, List, Optional
from adk_client import ADKClient


def generate_topic_content_adk(
    subject: str,
    topic_name: str,
    topic_description: str,
    difficulty: str = "intermediate",
    key_concepts: List[str] = None,
    is_subtopic: bool = False,
    parent_topic: str = None,
    user_id: str = "anonymous"
) -> Dict[str, Any]:
    """
    Generate educational content for a topic using local ADK agents.
    
    Uses simple HTTP calls to ADK API server:
    1. POST /apps/content_generator/users/{user_id}/sessions/{random_session}
    2. POST /run with message
    
    Args:
        subject: The main subject (e.g., "Python Basics")
        topic_name: The topic name (e.g., "Variables and Data Types")
        topic_description: Description of what to cover
        difficulty: Difficulty level (beginner, intermediate, advanced)
        key_concepts: List of key concepts to cover
        is_subtopic: Whether this is a subtopic (affects depth)
        parent_topic: Parent topic name if this is a subtopic
        user_id: User ID from JWT auth (defaults to "anonymous")
    
    Returns:
        Dict with section content (learning_objectives, key_concepts, detailed_content, etc.)
    """
    
    client = ADKClient(base_url="http://localhost:8000")
    
    key_concepts_str = ", ".join(key_concepts) if key_concepts else "general concepts"
    
    # Adjust scope for subtopics
    scope = "focused, specific" if is_subtopic else "comprehensive"
    context_note = f"\nThis is a subtopic under '{parent_topic}'. Focus on specific aspects without repeating parent topic content." if is_subtopic else ""
    
    # Build prompt for content_generator agent
    prompt = f"""Generate {scope} study notes for the following {"subtopic" if is_subtopic else "topic"}.

Subject: {subject}
{"Parent Topic: " + parent_topic if parent_topic else ""}
Topic: {topic_name}
Description: {topic_description}
Difficulty Level: {difficulty}
Key Concepts to Cover: {key_concepts_str}{context_note}

Please provide educational content in the following EXACT structure.
Use markdown headings (##) for each section:

## Learning Objectives
[Provide 3-5 specific, measurable learning objectives]

## Key Concepts
[List and briefly explain 4-6 key concepts with bullet points]

## Detailed Explanation
[Provide comprehensive explanation with:
- Clear introduction
- Step-by-step breakdown
- Important definitions
- How concepts relate to each other
- 300-500 words]

## Core Principles
[Explain 2-3 fundamental principles or rules]

## Common Patterns
[Describe 2-3 common patterns, best practices, or typical approaches]

## Important Notes
[List 3-5 critical points, gotchas, or things to remember]

## Examples
[Provide 2-3 practical examples with:
- Example code if relevant (use markdown code blocks)
- Clear explanation of what the example demonstrates
- Expected output or result]

## Practical Applications
[Describe 2-3 real-world use cases or applications]

## Practice Exercises

### Beginner Exercises
[2-3 simple exercises for beginners]

### Intermediate Exercises
[2-3 moderate difficulty exercises]

### Advanced Challenges
[1-2 challenging exercises for advanced learners]

## Related Topics
[List 3-5 related topics with brief explanation of connection]

## Prerequisites
[List prerequisite knowledge needed]

## Next Steps
[Suggest what to learn next]

## Resources
[Suggest 3-5 additional learning resources]

Make the content:
- Educational and clear
- Appropriate for {difficulty} level
- Practical and actionable
- Well-structured with examples
- {scope} in coverage
"""
    
    try:
        print(f"  📝 Calling ADK content_generator agent for '{topic_name}'...")
        
        # Generate random session ID for this topic (based on user_id)
        session_id = client.generate_session_id(user_id)
        print(f"  📌 Session: {session_id} for user: {user_id}")
        
        # Create session (simple HTTP: POST /apps/content_generator/users/{user_id}/sessions/{session_id})
        client.create_session(
            app_name="content_generator",
            user_id=user_id,
            session_id=session_id,
            initial_state={
                "topic": topic_name,
                "subject": subject,
                "difficulty": difficulty
            }
        )
        
        # Run agent (simple HTTP: POST /run)
        events = client.run_agent(
            app_name="content_generator",
            user_id=user_id,
            session_id=session_id,
            message=prompt
        )
        
        # Extract text response from events
        content_text = client.extract_text_response(events)
        
        print(f"  ✅ Received {len(content_text)} characters of content from ADK agent")
        
        # Parse sections from markdown
        sections = {
            "learning_objectives": _extract_section(content_text, "Learning Objectives"),
            "key_concepts": _extract_section(content_text, "Key Concepts"),
            "detailed_content": _extract_section(content_text, "Detailed Explanation"),
            "core_principles": _extract_section(content_text, "Core Principles"),
            "common_patterns": _extract_section(content_text, "Common Patterns"),
            "important_notes": _extract_section(content_text, "Important Notes"),
            "examples": _extract_section(content_text, "Examples"),
            "practical_applications": _extract_section(content_text, "Practical Applications"),
            "exercises": _extract_section(content_text, "Practice Exercises"),
            "beginner_exercises": _extract_section(content_text, "Beginner Exercises"),
            "intermediate_exercises": _extract_section(content_text, "Intermediate Exercises"),
            "advanced_challenges": _extract_section(content_text, "Advanced Challenges"),
            "related_topics": _extract_section(content_text, "Related Topics"),
            "prerequisites": _extract_section(content_text, "Prerequisites"),
            "next_steps": _extract_section(content_text, "Next Steps"),
            "resources": _extract_section(content_text, "Resources"),
            # Additional sections for template compatibility
            "cross_references": "",
            "recommended_reading": "",
            "online_resources": "",
            "tools": "",
            "study_notes": "",
            "code_examples": _extract_section(content_text, "Examples"),  # Reuse examples
        }
        
        return sections
        
    except Exception as e:
        print(f"  ❌ Error generating content with ADK agent: {e}")
        # Return error content that will still render
        return {
            "learning_objectives": f"Error: Could not generate learning objectives",
            "key_concepts": f"ADK Agent Error: {str(e)}",
            "detailed_content": f"Content generation failed for '{topic_name}'. Make sure ADK API server is running on port 8000.",
            "core_principles": "",
            "common_patterns": "",
            "important_notes": "Make sure to run: adk api_server --port 8000",
            "examples": "",
            "practical_applications": "",
            "exercises": "",
            "beginner_exercises": "",
            "intermediate_exercises": "",
            "advanced_challenges": "",
            "related_topics": "",
            "prerequisites": "",
            "next_steps": "",
            "cross_references": "",
            "resources": "",
            "recommended_reading": "",
            "online_resources": "",
            "tools": "",
            "study_notes": "",
            "code_examples": "",
        }


def _extract_section(text: str, section_name: str) -> str:
    """
    Extract a section from markdown text based on heading.
    
    Args:
        text: Full markdown text
        section_name: Name of the section to extract (without ## prefix)
    
    Returns:
        Content of the section, or placeholder if not found
    """
    # Try to find section with ## or ### heading
    patterns = [
        rf"###\s+{re.escape(section_name)}\s*\n(.*?)(?=\n###|\n##|\Z)",
        rf"##\s+{re.escape(section_name)}\s*\n(.*?)(?=\n##|\Z)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            content = match.group(1).strip()
            if content:
                return content
    
    # Return placeholder if section not found
    return f"[{section_name} content will be detailed here]"


# Test function
if __name__ == "__main__":
    """Test the ADK content generator."""
    print("Testing ADK content generator...")
    
    try:
        # Test with a simple topic
        result = generate_topic_content_adk(
            subject="Python Basics",
            topic_name="Variables and Data Types",
            topic_description="Understanding how to store and manipulate data in Python",
            difficulty="beginner",
            key_concepts=["variables", "integers", "strings", "type conversion"]
        )
        
        print("\n" + "="*60)
        print("GENERATED CONTENT PREVIEW")
        print("="*60)
        print(f"\nLearning Objectives:\n{result['learning_objectives'][:200]}...")
        print(f"\nKey Concepts:\n{result['key_concepts'][:200]}...")
        print(f"\nDetailed Content (first 300 chars):\n{result['detailed_content'][:300]}...")
        print("\n✅ Content generation successful!")
        print(f"Total sections populated: {sum(1 for v in result.values() if v and not v.startswith('['))}")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        print("\nMake sure ADK API server is running:")
        print("  cd /path/to/agents")
        print("  adk api_server --port 8000")
        import traceback
        traceback.print_exc()

