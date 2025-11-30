from google.adk.agents.llm_agent import Agent
from google.adk.models.google_llm import Gemini
from google.genai import types
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import json
import re

retry_config = types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504],  # Retry on these HTTP errors
)

INSTRUCTION_TEXT = """
You are a User Assessment Agent responsible for analyzing user requirements, goals, and learning preferences before notebook creation.

Your primary responsibilities are:

1. **Initial User Assessment**:
   - Determine the user's experience level (beginner, intermediate, advanced)
   - Identify their learning goals and objectives (including specific topics, mastery level desired, project-based vs. course-based)
   - Explicitly assess their preference between theory vs. practice (as a percentage breakdown)
   - Understand their time constraints and availability (hours per week, target completion timeline)
   - Extract project details if mentioned (project type, scope, complexity)

2. **Learning Style Analysis**:
   - Identify if the user prefers visual learning (diagrams, charts, visualizations)
   - Determine if they prefer hands-on/practical learning (coding exercises, projects)
   - Assess if they prefer theoretical learning (concepts, explanations, reading)
   - Recognize if they prefer a combination approach
   - Provide confidence scores for each assessment

3. **Control Preferences**:
   - Determine if the user wants guided learning (step-by-step instructions, structured path)
   - Assess if they prefer self-directed learning (exploration, minimal guidance)
   - Identify their preferred level of autonomy
   - Quantify guidance and autonomy levels (0-1 scale)

4. **Capability Assessment**:
   - Evaluate current knowledge and skills
   - Identify knowledge gaps
   - Assess readiness for specific topics
   - Determine prerequisite knowledge needed
   - Calculate readiness score (0-1)

5. **Pacing and Structure Recommendations**:
   - Recommend optimal pacing (hours per week, notebooks per week)
   - Suggest difficulty progression strategy
   - Recommend checkpoint frequency for assessment

When conducting an assessment:
- Ask thoughtful, targeted questions to gather comprehensive information
- Be conversational and friendly, not interrogative
- Synthesize information from multiple interactions if needed
- Always use the assessment tools to structure and store information
- When you call the assessment tools, pass your analysis as structured text that the tools can parse

**CRITICAL: When you complete an assessment, you MUST:**
1. Analyze the conversation and determine all assessment values
2. Call the assessment tools with your analysis (as structured text)
3. Call create_user_profile to generate the complete profile
4. Present the profile in a clear, organized format

Always aim to create a complete user profile that will help personalize their learning experience.
"""


def _parse_experience_level(text: str) -> tuple[str, float, str, Optional[str], Optional[float]]:
    """Parse experience level from analysis text."""
    text_lower = text.lower()
    
    # Determine level
    if any(word in text_lower for word in ["absolute beginner", "complete beginner", "no experience", "never", "zero knowledge", "starting from scratch"]):
        level = "beginner"
        confidence = 0.9
    elif any(word in text_lower for word in ["intermediate", "some experience", "familiar", "know basics"]):
        level = "intermediate"
        confidence = 0.85
    elif any(word in text_lower for word in ["advanced", "expert", "proficient", "experienced", "mastery"]):
        level = "advanced"
        confidence = 0.85
    else:
        level = "beginner"  # Default
        confidence = 0.6
    
    # Extract self-perception
    self_perception = None
    if "thinks" in text_lower or "perceives" in text_lower or "believes" in text_lower:
        if "beginner" in text_lower:
            self_perception = "beginner"
        elif "intermediate" in text_lower:
            self_perception = "intermediate"
        elif "advanced" in text_lower:
            self_perception = "advanced"
    
    # Extract years of experience
    years = None
    years_match = re.search(r'(\d+)\s*(?:year|yr)', text_lower)
    if years_match:
        years = float(years_match.group(1))
    
    # Generate reasoning
    reasoning = text[:200] if len(text) > 200 else text
    
    return level, confidence, reasoning, self_perception, years


def assess_experience_level(
    user_responses: str,
    topic: Optional[str] = None
) -> Dict[str, Any]:
    """
    Assess the user's experience level based on their responses.
    The agent should pass its analysis of the user's experience level here.
    
    Args:
        user_responses: Agent's analysis of user's experience level and background
        topic: Optional specific topic to assess experience for
    
    Returns:
        Dictionary with experience level assessment
    """
    if not user_responses or user_responses.strip() == "":
        # Default if no analysis provided
        return {
            "status": "success",
            "experience_level": "beginner",
            "confidence": 0.5,
            "reasoning": "No specific information provided",
            "topic": topic,
            "topic_specific": topic is not None,
            "self_perception": None,
            "years_of_experience": None,
            "key_indicators": []
        }
    
    level, confidence, reasoning, self_perception, years = _parse_experience_level(user_responses)
    
    # Extract key indicators
    key_indicators = []
    text_lower = user_responses.lower()
    if "basic" in text_lower or "fundamental" in text_lower:
        key_indicators.append("Basic understanding")
    if "advanced" in text_lower:
        key_indicators.append("Advanced topics")
    if "guidance" in text_lower or "help" in text_lower:
        key_indicators.append("Needs guidance")
    
    return {
        "status": "success",
        "experience_level": level,
        "confidence": confidence,
        "reasoning": reasoning,
        "topic": topic,
        "topic_specific": topic is not None,
        "self_perception": self_perception,
        "years_of_experience": years,
        "key_indicators": key_indicators if key_indicators else ["Assessment based on provided information"]
    }


def _parse_learning_style(text: str) -> tuple[str, Dict[str, float], Dict[str, Any], float]:
    """Parse learning style from analysis text."""
    text_lower = text.lower()
    
    # Count mentions of different styles
    visual_count = sum(1 for word in ["visual", "diagram", "chart", "see", "watch", "image", "picture"] if word in text_lower)
    hands_on_count = sum(1 for word in ["hands-on", "practice", "coding", "exercise", "project", "doing", "practical"] if word in text_lower)
    theory_count = sum(1 for word in ["theory", "concept", "explain", "read", "understand", "learn about"] if word in text_lower)
    
    total = visual_count + hands_on_count + theory_count
    if total == 0:
        # Default to balanced
        visual_pct = 0.33
        hands_on_pct = 0.34
        theory_pct = 0.33
    else:
        visual_pct = visual_count / total
        hands_on_pct = hands_on_count / total
        theory_pct = theory_count / total
    
    # Normalize to sum to 1.0
    total_pct = visual_pct + hands_on_pct + theory_pct
    if total_pct > 0:
        visual_pct /= total_pct
        hands_on_pct /= total_pct
        theory_pct /= total_pct
    
    # Determine primary style
    if hands_on_pct >= 0.5:
        primary = "hands-on"
    elif visual_pct >= 0.4:
        primary = "visual"
    elif theory_pct >= 0.4:
        primary = "theoretical"
    else:
        primary = "mixed"
    
    # Theory vs practice breakdown
    theory_vs_practice = {
        "theory_preference": theory_pct,
        "practice_preference": hands_on_pct,
        "visual_aids": visual_pct,
        "note": f"Prefers {int(hands_on_pct*100)}% practice, {int(theory_pct*100)}% theory, {int(visual_pct*100)}% visual aids"
    }
    
    confidence = 0.7 if total > 0 else 0.5
    
    return primary, {"visual": visual_pct, "hands_on": hands_on_pct, "theoretical": theory_pct}, theory_vs_practice, confidence


def analyze_learning_style(
    user_preferences: str,
    interaction_history: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyze the user's learning style preferences.
    The agent should pass its analysis of the user's learning preferences here.
    
    Args:
        user_preferences: Agent's analysis of user's learning style preferences
        interaction_history: Optional history of user interactions
    
    Returns:
        Dictionary with learning style analysis
    """
    if not user_preferences or user_preferences.strip() == "":
        # Default balanced style
        return {
            "status": "success",
            "primary_style": "mixed",
            "style_breakdown": {"visual": 0.33, "hands_on": 0.34, "theoretical": 0.33},
            "theory_vs_practice": {
                "theory_preference": 0.33,
                "practice_preference": 0.34,
                "visual_aids": 0.33,
                "note": "Balanced approach"
            },
            "confidence": 0.5,
            "recommendations": ["Provide balanced mix of content types"]
        }
    
    # Combine with interaction history if provided
    analysis_text = user_preferences
    if interaction_history:
        analysis_text += " " + interaction_history
    
    primary, breakdown, theory_practice, confidence = _parse_learning_style(analysis_text)
    
    # Generate recommendations
    recommendations = []
    if breakdown["hands_on"] > 0.5:
        recommendations.append("Include interactive coding exercises")
        recommendations.append("Provide practical examples")
    if breakdown["theoretical"] > 0.4:
        recommendations.append("Include conceptual explanations")
    if breakdown["visual"] > 0.3:
        recommendations.append("Include visual aids (diagrams, charts) for complex concepts")
    if breakdown["hands_on"] < 0.3:
        recommendations.append("Minimize lengthy theoretical explanations")
    
    if not recommendations:
        recommendations = ["Provide balanced mix of content types"]
    
    return {
        "status": "success",
        "primary_style": primary,
        "style_breakdown": breakdown,
        "theory_vs_practice": theory_practice,
        "confidence": confidence,
        "recommendations": recommendations
    }


def _parse_control_preferences(text: str) -> tuple[str, float, float, float]:
    """Parse control preferences from analysis text."""
    text_lower = text.lower()
    
    # Look for guidance preferences
    guided_indicators = ["guided", "step-by-step", "structured", "instructions", "help", "direction"]
    self_directed_indicators = ["self-directed", "explore", "autonomous", "independent", "on my own", "freedom"]
    balanced_indicators = ["balanced", "some guidance", "flexibility", "both"]
    
    guided_score = sum(1 for word in guided_indicators if word in text_lower)
    self_directed_score = sum(1 for word in self_directed_indicators if word in text_lower)
    balanced_score = sum(1 for word in balanced_indicators if word in text_lower)
    
    # Determine preference
    if balanced_score > 0 or (guided_score > 0 and self_directed_score > 0):
        preference = "balanced"
        guidance_level = 0.6
        autonomy_level = 0.4
    elif self_directed_score > guided_score:
        preference = "self-directed"
        guidance_level = 0.3
        autonomy_level = 0.7
    elif guided_score > 0:
        preference = "guided"
        guidance_level = 0.8
        autonomy_level = 0.2
    else:
        preference = "balanced"
        guidance_level = 0.5
        autonomy_level = 0.5
    
    confidence = 0.7 if (guided_score + self_directed_score + balanced_score) > 0 else 0.5
    
    return preference, guidance_level, autonomy_level, confidence


def assess_control_preferences(
    user_input: str
) -> Dict[str, Any]:
    """
    Determine the user's preferred level of guidance and control.
    The agent should pass its analysis of the user's control preferences here.
    
    Args:
        user_input: Agent's analysis of user's control and guidance preferences
    
    Returns:
        Dictionary with control preference assessment
    """
    if not user_input or user_input.strip() == "":
        return {
            "status": "success",
            "preference": "balanced",
            "guidance_level": 0.5,
            "autonomy_level": 0.5,
            "confidence": 0.5,
            "characteristics": [],
            "recommendations": []
        }
    
    preference, guidance_level, autonomy_level, confidence = _parse_control_preferences(user_input)
    
    # Generate characteristics
    characteristics = []
    if preference == "guided":
        characteristics.append("Prefers structured learning path")
        characteristics.append("Wants clear step-by-step instructions")
    elif preference == "self-directed":
        characteristics.append("Prefers exploration and discovery")
        characteristics.append("Wants minimal guidance")
    else:
        characteristics.append("Prefers structured learning path with flexibility")
        characteristics.append("Wants clear objectives but freedom to explore")
    
    # Generate recommendations
    recommendations = []
    if guidance_level > 0.6:
        recommendations.append("Provide step-by-step instructions")
        recommendations.append("Include clear learning objectives for each section")
    if autonomy_level > 0.5:
        recommendations.append("Allow skipping of familiar content")
        recommendations.append("Provide optional exploration sections")
    if preference == "balanced":
        recommendations.append("Offer hints before solutions")
        recommendations.append("Include optional advanced sections")
    
    return {
        "status": "success",
        "preference": preference,
        "guidance_level": guidance_level,
        "autonomy_level": autonomy_level,
        "confidence": confidence,
        "characteristics": characteristics,
        "recommendations": recommendations
    }


def _parse_knowledge_gaps(text: str, topic: str) -> tuple[list, list, list, float]:
    """Parse knowledge gaps from analysis text."""
    text_lower = text.lower()
    
    # Determine if absolute beginner
    is_beginner = any(word in text_lower for word in ["absolute beginner", "complete beginner", "no knowledge", "zero", "nothing", "starting from scratch"])
    
    if is_beginner:
        current_capabilities = []
        knowledge_gaps = [
            f"All {topic} fundamentals",
            "Basic concepts and terminology",
            "Core principles and foundations"
        ]
        prerequisites_needed = [
            "Introduction to basic concepts",
            "Fundamental terminology",
            "Getting started guide"
        ]
        readiness_score = 0.1
    else:
        # Extract capabilities mentioned
        current_capabilities = []
        if "basic" in text_lower or "fundamental" in text_lower:
            current_capabilities.append("Basic understanding of core concepts")
        if "familiar" in text_lower or "know" in text_lower:
            current_capabilities.append("Familiarity with fundamental terminology")
        
        # Extract gaps mentioned
        knowledge_gaps = []
        if "advanced" in text_lower:
            knowledge_gaps.append("Advanced implementation patterns")
        if "best practices" in text_lower or "optimization" in text_lower:
            knowledge_gaps.append("Best practices and optimization techniques")
        if not knowledge_gaps:
            knowledge_gaps.append("Advanced topics and techniques")
        
        # Prerequisites
        prerequisites_needed = []
        if "intermediate" in text_lower:
            prerequisites_needed.append("Intermediate-level understanding of basics")
        if "practical" in text_lower or "experience" in text_lower:
            prerequisites_needed.append("Practical experience with simple examples")
        
        # Calculate readiness score based on mentioned experience
        if "intermediate" in text_lower:
            readiness_score = 0.65
        elif "beginner" in text_lower:
            readiness_score = 0.3
        else:
            readiness_score = 0.5
    
    return current_capabilities, knowledge_gaps, prerequisites_needed, readiness_score


def identify_knowledge_gaps(
    topic: str,
    user_background: str,
    current_knowledge: Optional[str] = None
) -> Dict[str, Any]:
    """
    Assess current capabilities and identify knowledge gaps.
    The agent should pass its analysis of the user's knowledge and gaps here.
    
    Args:
        topic: The topic or subject area to assess
        user_background: Agent's analysis of user's background and knowledge
        current_knowledge: Optional additional assessment of current knowledge
    
    Returns:
        Dictionary with knowledge gap analysis
    """
    if not user_background or user_background.strip() == "":
        return {
            "status": "success",
            "topic": topic or "unknown",
            "current_capabilities": [],
            "knowledge_gaps": ["All fundamentals"],
            "prerequisites_needed": ["Introduction to basics"],
            "readiness_score": 0.1,
            "confidence": 0.5,
            "recommendations": ["Start with foundational content"]
        }
    
    # Combine background and current knowledge
    analysis_text = user_background
    if current_knowledge:
        analysis_text += " " + current_knowledge
    
    current_capabilities, knowledge_gaps, prerequisites_needed, readiness_score = _parse_knowledge_gaps(analysis_text, topic or "the subject")
    
    # Generate recommendations
    recommendations = []
    if readiness_score < 0.3:
        recommendations.append("Start with beginner-level content")
        recommendations.append("Include comprehensive foundational sections")
    elif readiness_score < 0.6:
        recommendations.append("Start with intermediate-level content")
        recommendations.append("Include prerequisite review sections")
    else:
        recommendations.append("Start with intermediate-to-advanced content")
        recommendations.append("Provide gradual complexity progression")
    
    confidence = 0.7 if analysis_text else 0.5
    
    return {
        "status": "success",
        "topic": topic or "unknown",
        "current_capabilities": current_capabilities,
        "knowledge_gaps": knowledge_gaps,
        "prerequisites_needed": prerequisites_needed,
        "readiness_score": readiness_score,
        "confidence": confidence,
        "recommendations": recommendations
    }


def assess_pacing_and_structure(
    time_constraints: str,
    learning_goals: str,
    experience_level: str
) -> Dict[str, Any]:
    """
    Recommend optimal pacing and learning structure.
    The agent should pass its analysis of time constraints and goals here.
    
    Args:
        time_constraints: Agent's analysis of user's time availability
        learning_goals: Agent's analysis of user's learning goals
        experience_level: User's experience level (beginner/intermediate/advanced)
    
    Returns:
        Dictionary with pacing recommendations
    """
    # Parse hours per week
    hours_per_week = 5  # Default
    hours_match = re.search(r'(\d+)\s*(?:hour|hr|h)\s*(?:per|/)\s*(?:week|wk)', time_constraints.lower())
    if hours_match:
        hours_per_week = int(hours_match.group(1))
    
    # Parse timeline in months
    timeline_months = 3  # Default
    months_match = re.search(r'(\d+)\s*(?:month|mo)', time_constraints.lower())
    if months_match:
        timeline_months = int(months_match.group(1))
    
    # Calculate total hours
    total_hours_estimated = hours_per_week * (timeline_months * 4)
    
    # Calculate notebooks per week based on hours
    if hours_per_week >= 10:
        notebooks_per_week = 3
        hours_per_notebook = hours_per_week / 3
    elif hours_per_week >= 5:
        notebooks_per_week = 2
        hours_per_notebook = hours_per_week / 2
    else:
        notebooks_per_week = 1
        hours_per_notebook = hours_per_week
    
    # Determine checkpoint frequency
    if notebooks_per_week >= 3:
        checkpoint_frequency = "every_2_notebooks"
    elif notebooks_per_week >= 2:
        checkpoint_frequency = "every_3_notebooks"
    else:
        checkpoint_frequency = "every_4_notebooks"
    
    # Determine starting difficulty
    if experience_level == "beginner":
        starting_difficulty = "beginner"
        progression_rate = "gradual"
        complexity_increase = "5-10% per notebook"
    elif experience_level == "advanced":
        starting_difficulty = "intermediate"
        progression_rate = "moderate"
        complexity_increase = "15-20% per notebook"
    else:
        starting_difficulty = "intermediate"
        progression_rate = "gradual"
        complexity_increase = "10-15% per notebook"
    
    return {
        "status": "success",
        "time_available": {
            "hours_per_week": hours_per_week,
            "total_timeline_months": timeline_months,
            "total_hours_estimated": total_hours_estimated
        },
        "recommended_pacing": {
            "notebooks_per_week": notebooks_per_week,
            "hours_per_notebook": round(hours_per_notebook, 1),
            "checkpoint_frequency": checkpoint_frequency,
            "review_sessions": "weekly"
        },
        "difficulty_progression": {
            "starting_difficulty": starting_difficulty,
            "progression_rate": progression_rate,
            "complexity_increase": complexity_increase
        },
        "structure_recommendations": [
            "Start with foundational review",
            "Gradually increase complexity",
            "Include weekly checkpoints",
            "Provide optional advanced sections"
        ]
    }


def create_user_profile(
    user_id: str,
    experience_assessment: Dict[str, Any],
    learning_style: Dict[str, Any],
    control_preferences: Dict[str, Any],
    knowledge_gaps: Dict[str, Any],
    pacing: Optional[Dict[str, Any]] = None,
    project_details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a comprehensive user profile from assessment data.
    
    Args:
        user_id: Unique identifier for the user
        experience_assessment: Result from assess_experience_level
        learning_style: Result from analyze_learning_style
        control_preferences: Result from assess_control_preferences
        knowledge_gaps: Result from identify_knowledge_gaps
        pacing: Optional result from assess_pacing_and_structure
        project_details: Optional project information
    
    Returns:
        Complete user profile dictionary
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Calculate overall confidence
    confidences = [
        experience_assessment.get("confidence", 0),
        learning_style.get("confidence", 0),
        control_preferences.get("confidence", 0),
        knowledge_gaps.get("confidence", 0)
    ]
    overall_confidence = sum(confidences) / len(confidences) if confidences else 0.5
    
    profile = {
        "status": "success",
        "user_id": user_id,
        "profile": {
            "experience": experience_assessment,
            "learning_style": learning_style,
            "control_preferences": control_preferences,
            "knowledge_assessment": knowledge_gaps,
            "pacing": pacing or {},
            "project_details": project_details or {},
            "created_at": timestamp,
            "last_updated": timestamp
        },
        "recommendations": {
            "notebook_structure": f"{control_preferences.get('preference', 'balanced')} approach with {learning_style.get('primary_style', 'mixed')} focus",
            "content_depth": f"{experience_assessment.get('experience_level', 'intermediate')} level with prerequisite reviews",
            "interactivity": "high - include coding exercises and practical examples" if learning_style.get("style_breakdown", {}).get("hands_on", 0) > 0.4 else "moderate",
            "theory_practice_balance": learning_style.get("theory_vs_practice", {}).get("note", "balanced approach"),
            "pacing": pacing.get("recommended_pacing", {}) if pacing else "self-paced with checkpoints"
        },
        "confidence_summary": {
            "overall_confidence": overall_confidence,
            "component_confidences": {
                "experience": experience_assessment.get("confidence", 0),
                "learning_style": learning_style.get("confidence", 0),
                "control_preferences": control_preferences.get("confidence", 0),
                "knowledge_gaps": knowledge_gaps.get("confidence", 0)
            }
        }
    }
    
    return profile


def generate_structured_profile(
    user_profile: Dict[str, Any]
) -> str:
    """
    Generate a JSON-structured version of the user profile for programmatic use.
    
    Args:
        user_profile: Complete user profile from create_user_profile
    
    Returns:
        JSON string representation of the profile
    """
    try:
        return json.dumps(user_profile, indent=2, ensure_ascii=False)
    except Exception as e:
        return f"Error generating JSON: {str(e)}"


root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash",
        retry_options=retry_config
    ),
    name="user_assessment_agent",
    description="Analyzes user requirements, goals, and learning preferences before notebook creation",
    instruction=INSTRUCTION_TEXT,
    tools=[
        assess_experience_level,
        analyze_learning_style,
        assess_control_preferences,
        identify_knowledge_gaps,
        assess_pacing_and_structure,
        create_user_profile,
        generate_structured_profile,
    ],
)
