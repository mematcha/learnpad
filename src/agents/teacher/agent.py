# src/agents/teacher/agent.py
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.tools import AgentTool
from google.genai import types
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import json

# Import your specialist agents
from agents.concept_explainer.agent import root_agent as concept_explainer_agent
from agents.code_reviewer.agent import root_agent as code_reviewer_agent
from agents.assessment_checker.agent import root_agent as assessment_checker_agent
from agents.content_generator.agent import root_agent as content_generator_agent
from agents.curriculum_planner.agent import root_agent as curriculum_planner_agent
from agents.user_assessment.agent import root_agent as user_assessment_agent

retry_config = types.HttpRetryOptions(
    attempts=5,
    exp_base=7,
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504],
)

# In-memory storage for user data (in production, this would be a database)
_user_memory: Dict[str, Dict[str, Any]] = {}
_user_progress: Dict[str, Dict[str, Any]] = {}
_learning_patterns: Dict[str, List[Dict[str, Any]]] = {}

INSTRUCTION_TEXT = """
You are a master teacher and central orchestrator with persistent memory that manages the entire learning experience.

Your core responsibilities:

1. **Long-term Memory Management**:
   - Maintain comprehensive memory of each student's progress, preferences, and learning patterns
   - Track what topics they've mastered, struggled with, or are currently learning
   - Remember their preferred learning style, pace, and interaction patterns
   - Store and recall past conversations, assessments, and feedback

2. **Agent Coordination**:
   - Coordinate with all specialist agents to provide comprehensive learning support
   - Delegate appropriately based on the student's needs:
     * concept_explainer_agent: For learning new concepts, explanations, Q&A
     * code_reviewer_agent: For code review, debugging, and code improvement
     * assessment_checker_agent: For practice exercises, assessments, and understanding checks
     * content_generator_agent: For creating additional content, examples, exercises
     * curriculum_planner_agent: For learning path planning and curriculum structure
     * user_assessment_agent: For initial assessments and preference analysis
   - Synthesize responses from multiple agents when needed
   - Ensure consistent, personalized experience across all interactions

3. **Real-time Teaching & Q&A**:
   - Conduct real-time teaching within notebooks and learning sessions
   - Answer questions immediately with personalized context
   - Provide explanations tailored to the student's level and learning style
   - Adapt explanations based on their current understanding and progress

4. **Dynamic Note Creation**:
   - Create additional notes during learning sessions when students need clarification
   - Generate supplementary content when gaps are identified
   - Create quick reference materials on-the-fly
   - Use content_generator_agent when structured content creation is needed

5. **Progress Monitoring & Adaptation**:
   - Continuously monitor student progress across all topics
   - Track completion rates, mastery levels, and time spent
   - Identify learning patterns (what works, what doesn't)
   - Adapt teaching strategies based on observed patterns
   - Adjust difficulty and pacing dynamically

6. **Assessment & Feedback**:
   - Coordinate assessments at appropriate checkpoints
   - Provide constructive, personalized feedback
   - Track assessment results over time
   - Identify areas needing reinforcement
   - Celebrate progress and achievements

7. **Intervention Decision-Making**:
   - Decide when to actively intervene vs. let students explore independently
   - Consider student's autonomy preferences and current confidence level
   - Intervene when: stuck for extended time, making repeated errors, requesting help
   - Step back when: making good progress, exploring successfully, prefers independence
   - Balance guidance with exploration based on learning style

**Decision Framework for Interventions**:
- High autonomy preference + making progress → Minimal intervention, provide resources
- High autonomy preference + stuck → Offer hints, wait for request
- Low autonomy preference + making progress → Gentle check-ins, encouragement
- Low autonomy preference + stuck → Proactive help, step-by-step guidance
- Repeated errors → Intervene with targeted explanation
- Request for help → Immediate, comprehensive support

**Personalization Principles**:
- Always reference past interactions and progress when relevant
- Use the student's preferred learning style (visual, hands-on, theoretical)
- Match communication style to their experience level
- Respect their autonomy preferences
- Build on what they already know
- Connect new concepts to previously mastered topics

**Memory Usage**:
- Before responding, check user memory for context, preferences, and progress
- After interactions, update memory with new information
- Use learning patterns to predict needs and adapt proactively

Remember: You are not just coordinating agents—you are the persistent, personalized teacher who knows each student deeply and guides their entire learning journey.
"""


def get_user_memory(user_id: str) -> Dict[str, Any]:
    """
    Retrieve comprehensive user memory including progress, preferences, and learning patterns.
    
    Args:
        user_id: Unique identifier for the user
    
    Returns:
        Dictionary with user memory data
    """
    memory = _user_memory.get(user_id, {})
    progress = _user_progress.get(user_id, {})
    patterns = _learning_patterns.get(user_id, [])
    
    return {
        "status": "success",
        "user_id": user_id,
        "memory": memory,
        "progress": progress,
        "learning_patterns": patterns,
        "last_updated": memory.get("last_updated") if memory else None
    }


def update_user_memory(
    user_id: str,
    preferences: Optional[Dict[str, Any]] = None,
    progress_update: Optional[Dict[str, Any]] = None,
    interaction_summary: Optional[str] = None
) -> Dict[str, Any]:
    """
    Update user memory with new information about preferences, progress, or interactions.
    
    Args:
        user_id: Unique identifier for the user
        preferences: Optional dictionary with preference updates
        progress_update: Optional dictionary with progress updates
        interaction_summary: Optional summary of the current interaction
    
    Returns:
        Dictionary with update status
    """
    if user_id not in _user_memory:
        _user_memory[user_id] = {
            "preferences": {},
            "created_at": datetime.now(timezone.utc).isoformat(),
            "interaction_count": 0
        }
    
    if user_id not in _user_progress:
        _user_progress[user_id] = {
            "topics_mastered": [],
            "topics_in_progress": [],
            "topics_struggling": [],
            "completion_rate": 0.0,
            "last_activity": None
        }
    
    # Update preferences
    if preferences:
        _user_memory[user_id]["preferences"].update(preferences)
    
    # Update progress
    if progress_update:
        _user_progress[user_id].update(progress_update)
        _user_progress[user_id]["last_activity"] = datetime.now(timezone.utc).isoformat()
    
    # Record interaction
    if interaction_summary:
        if user_id not in _learning_patterns:
            _learning_patterns[user_id] = []
        
        _learning_patterns[user_id].append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": interaction_summary
        })
        
        # Keep only last 50 interactions
        if len(_learning_patterns[user_id]) > 50:
            _learning_patterns[user_id] = _learning_patterns[user_id][-50:]
    
    _user_memory[user_id]["last_updated"] = datetime.now(timezone.utc).isoformat()
    _user_memory[user_id]["interaction_count"] = _user_memory[user_id].get("interaction_count", 0) + 1
    
    return {
        "status": "success",
        "user_id": user_id,
        "message": "Memory updated successfully",
        "interaction_count": _user_memory[user_id]["interaction_count"]
    }


def track_progress(
    user_id: str,
    topic: str,
    mastery_level: str,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Track progress on a specific topic.
    
    Args:
        user_id: Unique identifier for the user
        topic: The topic being tracked
        mastery_level: One of "mastered", "in_progress", "struggling", "not_started"
        notes: Optional notes about the progress
    
    Returns:
        Dictionary with tracking status
    """
    if user_id not in _user_progress:
        _user_progress[user_id] = {
            "topics_mastered": [],
            "topics_in_progress": [],
            "topics_struggling": [],
            "completion_rate": 0.0,
            "last_activity": None
        }
    
    # Remove from all lists first
    for topic_list in [
        _user_progress[user_id]["topics_mastered"],
        _user_progress[user_id]["topics_in_progress"],
        _user_progress[user_id]["topics_struggling"]
    ]:
        if topic in topic_list:
            topic_list.remove(topic)
    
    # Add to appropriate list
    if mastery_level == "mastered":
        _user_progress[user_id]["topics_mastered"].append(topic)
    elif mastery_level == "in_progress":
        _user_progress[user_id]["topics_in_progress"].append(topic)
    elif mastery_level == "struggling":
        _user_progress[user_id]["topics_struggling"].append(topic)
    
    # Update completion rate
    total_topics = (
        len(_user_progress[user_id]["topics_mastered"]) +
        len(_user_progress[user_id]["topics_in_progress"]) +
        len(_user_progress[user_id]["topics_struggling"])
    )
    if total_topics > 0:
        _user_progress[user_id]["completion_rate"] = (
            len(_user_progress[user_id]["topics_mastered"]) / total_topics
        )
    
    _user_progress[user_id]["last_activity"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "status": "success",
        "user_id": user_id,
        "topic": topic,
        "mastery_level": mastery_level,
        "notes": notes,
        "completion_rate": _user_progress[user_id]["completion_rate"]
    }


def get_student_progress(user_id: str) -> Dict[str, Any]:
    """
    Get comprehensive progress information for a student.
    
    Args:
        user_id: Unique identifier for the user
    
    Returns:
        Dictionary with progress information
    """
    progress = _user_progress.get(user_id, {
        "topics_mastered": [],
        "topics_in_progress": [],
        "topics_struggling": [],
        "completion_rate": 0.0,
        "last_activity": None
    })
    
    memory = _user_memory.get(user_id, {})
    
    return {
        "status": "success",
        "user_id": user_id,
        "progress": progress,
        "preferences": memory.get("preferences", {}),
        "interaction_count": memory.get("interaction_count", 0),
        "summary": f"Student {user_id} has mastered {len(progress['topics_mastered'])} topics, "
                  f"working on {len(progress['topics_in_progress'])} topics, "
                  f"and struggling with {len(progress['topics_struggling'])} topics. "
                  f"Completion rate: {progress['completion_rate']:.1%}"
    }


def create_additional_note(
    user_id: str,
    topic: str,
    content: str,
    note_type: str = "supplementary"
) -> Dict[str, Any]:
    """
    Create an additional note during a learning session.
    
    Args:
        user_id: Unique identifier for the user
        topic: The topic the note relates to
        content: The content of the note
        note_type: Type of note (supplementary, clarification, quick_reference, etc.)
    
    Returns:
        Dictionary with note creation status
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    
    note = {
        "user_id": user_id,
        "topic": topic,
        "content": content,
        "note_type": note_type,
        "created_at": timestamp
    }
    
    # Store note in user memory
    if user_id not in _user_memory:
        _user_memory[user_id] = {"notes": []}
    elif "notes" not in _user_memory[user_id]:
        _user_memory[user_id]["notes"] = []
    
    _user_memory[user_id]["notes"].append(note)
    
    return {
        "status": "success",
        "message": f"Note created successfully for topic: {topic}",
        "note": note
    }


def should_intervene(
    user_id: str,
    current_situation: str,
    time_stuck_minutes: Optional[float] = None,
    error_count: Optional[int] = None
) -> Dict[str, Any]:
    """
    Determine whether to intervene or let the student explore independently.
    
    Args:
        user_id: Unique identifier for the user
        current_situation: Description of current learning situation
        time_stuck_minutes: Optional minutes the student has been stuck
        error_count: Optional count of repeated errors
    
    Returns:
        Dictionary with intervention recommendation
    """
    memory = _user_memory.get(user_id, {})
    preferences = memory.get("preferences", {})
    autonomy_level = preferences.get("autonomy_level", 0.5)  # Default balanced
    
    # Decision logic
    should_intervene_flag = False
    intervention_level = "none"
    reasoning = []
    
    # High priority triggers (always intervene)
    if error_count and error_count >= 3:
        should_intervene_flag = True
        intervention_level = "high"
        reasoning.append("Multiple repeated errors detected")
    
    if time_stuck_minutes and time_stuck_minutes >= 15:
        should_intervene_flag = True
        intervention_level = "high"
        reasoning.append("Student stuck for extended period")
    
    # Medium priority (consider autonomy preference)
    if time_stuck_minutes and 5 <= time_stuck_minutes < 15:
        if autonomy_level < 0.6:  # Prefers more guidance
            should_intervene_flag = True
            intervention_level = "medium"
            reasoning.append("Student stuck and prefers guidance")
        else:
            intervention_level = "hint"
            reasoning.append("Offer hints, respect autonomy preference")
    
    # Low autonomy preference → more proactive
    if autonomy_level < 0.4 and not should_intervene_flag:
        intervention_level = "check_in"
        reasoning.append("Low autonomy preference, suggest check-in")
    
    # High autonomy preference → minimal intervention
    if autonomy_level > 0.7 and not should_intervene_flag:
        intervention_level = "none"
        reasoning.append("High autonomy preference, let explore")
    
    recommendation = {
        "should_intervene": should_intervene_flag,
        "intervention_level": intervention_level,
        "recommended_action": _get_intervention_action(intervention_level),
        "reasoning": " | ".join(reasoning) if reasoning else "No intervention needed",
        "autonomy_respected": autonomy_level > 0.5 if not should_intervene_flag else False
    }
    
    return {
        "status": "success",
        "user_id": user_id,
        "recommendation": recommendation
    }


def _get_intervention_action(level: str) -> str:
    """Get recommended action based on intervention level."""
    actions = {
        "none": "No intervention - let student explore",
        "check_in": "Gentle check-in: 'How's it going? Need any help?'",
        "hint": "Offer hints or resources, wait for request",
        "medium": "Proactive help: provide guidance and step-by-step support",
        "high": "Immediate intervention: comprehensive help and explanation"
    }
    return actions.get(level, "Monitor situation")


def adapt_teaching_strategy(
    user_id: str,
    topic: str,
    performance_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Adapt teaching strategy based on performance data and learning patterns.
    
    Args:
        user_id: Unique identifier for the user
        topic: Current topic
        performance_data: Dictionary with performance metrics (completion_time, errors, attempts, etc.)
    
    Returns:
        Dictionary with adapted strategy recommendations
    """
    memory = _user_memory.get(user_id, {})
    preferences = memory.get("preferences", {})
    progress = _user_progress.get(user_id, {})
    patterns = _learning_patterns.get(user_id, [])
    
    # Analyze performance
    errors = performance_data.get("errors", 0)
    attempts = performance_data.get("attempts", 1)
    completion_time = performance_data.get("completion_time_minutes", 0)
    
    # Determine if struggling
    is_struggling = (
        errors > 3 or
        attempts > 5 or
        (completion_time > 30 and errors > 1)
    )
    
    # Get learning style
    learning_style = preferences.get("primary_style", "mixed")
    
    # Generate strategy recommendations
    recommendations = []
    
    if is_struggling:
        recommendations.append("Break down into smaller steps")
        recommendations.append("Provide more examples")
        recommendations.append("Increase guidance level")
        
        if learning_style == "visual":
            recommendations.append("Add visual aids and diagrams")
        elif learning_style == "hands_on":
            recommendations.append("Add more practice exercises")
        elif learning_style == "theoretical":
            recommendations.append("Provide deeper conceptual explanations")
    else:
        recommendations.append("Maintain current pace")
        recommendations.append("Consider increasing difficulty")
        recommendations.append("Offer optional advanced content")
    
    # Adjust based on patterns
    if len(patterns) > 5:
        recent_patterns = patterns[-5:]
        # Analyze what worked
        recommendations.append("Leverage successful patterns from recent sessions")
    
    strategy = {
        "difficulty_adjustment": "decrease" if is_struggling else "maintain",
        "guidance_level": "increase" if is_struggling else "maintain",
        "pacing": "slow_down" if is_struggling else "maintain",
        "recommendations": recommendations,
        "learning_style_adaptation": learning_style
    }
    
    return {
        "status": "success",
        "user_id": user_id,
        "topic": topic,
        "strategy": strategy,
        "is_struggling": is_struggling
    }


def conduct_assessment(
    user_id: str,
    topic: str,
    assessment_type: str = "checkpoint"
) -> Dict[str, Any]:
    """
    Coordinate an assessment for the student.
    
    Args:
        user_id: Unique identifier for the user
        topic: Topic to assess
        assessment_type: Type of assessment (checkpoint, final, practice, etc.)
    
    Returns:
        Dictionary with assessment coordination status
    """
    memory = _user_memory.get(user_id, {})
    progress = _user_progress.get(user_id, {})
    
    # Record assessment request
    assessment_record = {
        "user_id": user_id,
        "topic": topic,
        "assessment_type": assessment_type,
        "requested_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending"
    }
    
    if "assessments" not in memory:
        memory["assessments"] = []
    memory["assessments"].append(assessment_record)
    
    return {
        "status": "success",
        "message": f"Assessment coordinated for topic: {topic}",
        "assessment": assessment_record,
        "instruction": "Use assessment_checker_agent to conduct the actual assessment"
    }


root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash",
        retry_options=retry_config
    ),
    name="teacher_agent",
    description="Master teacher and central orchestrator with persistent memory that manages the entire learning experience",
    instruction=INSTRUCTION_TEXT,
    tools=[
        # Memory and progress management
        get_user_memory,
        update_user_memory,
        track_progress,
        get_student_progress,
        
        # Note creation
        create_additional_note,
        
        # Decision making
        should_intervene,
        adapt_teaching_strategy,
        
        # Assessment coordination
        conduct_assessment,
        
        # Specialist agents
        AgentTool(agent=concept_explainer_agent),
        AgentTool(agent=code_reviewer_agent),
        AgentTool(agent=assessment_checker_agent),
        AgentTool(agent=content_generator_agent),
        AgentTool(agent=curriculum_planner_agent),
        AgentTool(agent=user_assessment_agent),
    ],
)