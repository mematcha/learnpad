import os
import jwt
import uuid
import json
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from pathlib import Path
from fastapi import FastAPI, HTTPException, Depends, status, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import requests

# Add src to path for storage imports
import sys
from pathlib import Path

src_path = Path(__file__).parent.parent
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

# Import storage
from storage import gcs_storage

# Vertex AI Agent Engine Configuration
# Agents are deployed to Vertex AI and accessed via HTTP API
print("🔗 Configuring Vertex AI Agent Engine endpoints...")

# Agent endpoint URLs (set these after deploying to Vertex AI)
VERTEX_AI_USER_ASSESSMENT_ENDPOINT = os.getenv("VERTEX_AI_USER_ASSESSMENT_AGENT_ENDPOINT")
VERTEX_AI_CURRICULUM_PLANNER_ENDPOINT = os.getenv("VERTEX_AI_CURRICULUM_PLANNER_AGENT_ENDPOINT")
VERTEX_AI_CONTENT_GENERATOR_ENDPOINT = os.getenv("VERTEX_AI_CONTENT_GENERATOR_AGENT_ENDPOINT")
VERTEX_AI_NOTEBOOK_LOOP_ENDPOINT = os.getenv("VERTEX_AI_NOTEBOOK_LOOP_AGENT_ENDPOINT")

# Authentication for Vertex AI
import google.auth
import google.auth.transport.requests

def get_vertex_ai_auth_token():
    """Get authentication token for Vertex AI API calls."""
    try:
        credentials, project = google.auth.default()
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        return credentials.token
    except Exception as e:
        print(f"⚠️ Failed to get Vertex AI auth token: {e}")
        return None

# HTTP client for calling Vertex AI agents
async def call_vertex_ai_agent(endpoint: str, payload: Dict[str, Any], timeout: int = 120) -> str:
    """
    Call a deployed Vertex AI agent.
    
    Args:
        endpoint: Full URL of the agent endpoint
        payload: Request payload containing the user input/prompt
        timeout: Request timeout in seconds
        
    Returns:
        Agent response as string
    """
    if not endpoint:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Agent endpoint not configured. Please deploy agents and set endpoint URLs."
        )

try:
        # Get authentication token
        auth_token = get_vertex_ai_auth_token()
        if not auth_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to authenticate with Vertex AI"
            )
        
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        # Make async HTTP request to Vertex AI agent
        import httpx
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            
            # Extract response text from Vertex AI response format
            # Adjust this based on actual Vertex AI Agent Engine response format
            if isinstance(result, dict):
                return result.get("response", result.get("text", str(result)))
            return str(result)
            
    except httpx.HTTPStatusError as e:
        print(f"❌ Vertex AI agent HTTP error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Agent request failed: {e.response.status_code}"
        )
    except Exception as e:
        print(f"❌ Error calling Vertex AI agent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent communication error: {str(e)}"
        )

print("✅ Vertex AI Agent Engine client configured")

# Import notebook generator
NotebookGenerator = None
try:
    from agents.study_notes_generator.notebook_generator import NotebookGenerator
except ImportError as e:
    print(f"Warning: Could not import NotebookGenerator: {e}")

# Custom notebook generator that uploads to GCS
class NotebookGeneratorWithGCS:
    """Extended NotebookGenerator that uploads files to GCS as they are created."""

    def __init__(self, config_file: str, output_dir: str, notebook_id: str):
        # Initialize basic properties
        self.config_file = config_file
        self.output_dir = Path(output_dir)
        self.notebook_id = notebook_id

        # Load config
        with open(config_file, 'r', encoding='utf-8') as f:
            self.config = json.load(f)

        print(f"🔧 Initializing GCS service with bucket: {settings.gcs_bucket_name}, credentials: {settings.gcs_credentials_path}")
        self.gcs_service = gcs_storage.GCSStorageService(
            bucket_name=settings.gcs_bucket_name,
            credentials_path=settings.gcs_credentials_path
        )
        print("✅ GCS service initialized successfully")

        # Load templates
        self.templates = self._load_templates()

        # Note: Agents are now accessed via Vertex AI HTTP API
        print("✅ Using Vertex AI Agent Engine for content generation")

    def _load_templates(self) -> Dict[str, str]:
        """Load markdown templates."""
        templates_dir = Path(__file__).parent.parent / "agents" / "study_notes_generator" / "templates"
        templates = {}

        # Default fallback templates
        templates['note'] = """# {title}

**Subject:** {subject}
**Topic:** {topic}
**Difficulty:** {difficulty}
**Last Updated:** {date}

## Overview

{overview}

## Key Concepts

{key_concepts}

## Detailed Explanation

{detailed_content}

## Examples

{examples}

## Practice Exercises

{exercises}

## Related Topics

{related_topics}

## Resources

{resources}

---

*Generated by Study Notes Generator*
"""

        templates['index'] = """# {title}

**Subject:** {subject}
**Description:** {description}
**Difficulty Level:** {difficulty}

## Learning Path

{learning_path}

## Topics Overview

{topics_overview}

## Progress Tracking

{progress_tracking}

## Navigation

{navigation}

---

*Generated by Study Notes Generator*
"""

        templates['progress'] = """# Learning Progress - {subject}

**Started:** {start_date}
**Last Updated:** {update_date}

## Overall Progress

- [ ] Introduction and Prerequisites
{topic_checkboxes}
- [ ] Final Review and Assessment

## Detailed Topic Progress

{topic_progress}

## Learning Goals

{learning_goals}

## Notes and Reflections

{reflections}

---

*Generated by Study Notes Generator*
"""

        # Try to load custom templates from files if they exist
        template_files = {
            'note': 'note_template.md',
            'index': 'index_template.md',
            'progress': 'progress_template.md'
        }

        for template_name, filename in template_files.items():
            template_file = templates_dir / filename
            if template_file.exists():
                try:
                    with open(template_file, 'r', encoding='utf-8') as f:
                        templates[template_name] = f.read()
                    print(f"✅ Loaded custom {template_name} template")
                except Exception as e:
                    print(f"⚠️  Failed to load {template_name} template: {e}")

        return templates

    async def generate_notebook(self):
        """Override to use loop agent pattern for iterative content generation."""
        print(f"🎯 Generating study notebook for: {self.config.subject}")
        print(f"📁 Output directory: {self.output_dir}")
        print(f"☁️ GCS notebook ID: {self.notebook_id}")

        # Step 1: Analyze content structure
        print("🔍 Analyzing content structure...")
        content_structure = await self._analyze_content()

        # Step 2: Generate research content using loop agent
        print("📚 Generating research content with loop agent...")
        research_content = await self._generate_research_content_with_loop_agent(content_structure)

        # Step 3: Create organization structure
        print("📂 Creating folder organization...")
        folder_structure = await self._create_folder_structure(research_content)

        # Step 4: Generate all files and upload to GCS using loop agent
        print("📝 Generating markdown files and uploading to GCS with loop agent...")
        await self._generate_files_with_loop_agent_and_upload(folder_structure, research_content)

        # Step 5: Create progress tracking
        if self.config.include_progress_tracking:
            print("📊 Creating progress tracking...")
            await self._create_progress_tracking_and_upload(research_content)

        print("✅ Notebook generation complete!")
        print(f"📖 Study materials available in GCS: {self.notebook_id}")

    async def _generate_files_and_upload(self, folder_structure: Dict[str, Any], research_content: Dict[str, Any]):
        """Generate all markdown files and upload to GCS."""
        # Create root directory
        root_dir = Path(self.output_dir)
        root_dir.mkdir(parents=True, exist_ok=True)

        # Generate main index file and upload
        await self._generate_main_index_and_upload(root_dir, research_content)

        # Generate topic files and upload
        for topic in research_content["topics"]:
            topic_folder = root_dir / topic["name"].lower().replace(" ", "_")
            topic_folder.mkdir(exist_ok=True)

            # Generate topic index and upload
            await self._generate_topic_index_and_upload(topic_folder, topic)

            # Generate main topic file and upload
            await self._generate_topic_file_and_upload(topic_folder, topic)

            # Generate subtopic files and upload
            for subtopic in topic.get("subtopics", []):
                subtopic_folder = topic_folder / subtopic["name"].lower().replace(" ", "_")
                subtopic_folder.mkdir(exist_ok=True)

                await self._generate_topic_file_and_upload(subtopic_folder, subtopic, is_subtopic=True, parent_topic=topic["name"])

    async def _generate_main_index_and_upload(self, root_dir: Path, research_content: Dict[str, Any]):
        """Generate the main index file and upload to GCS."""
        index_content = self._generate_main_index_content(root_dir, research_content)

        with open(root_dir / "README.md", 'w', encoding='utf-8') as f:
            f.write(index_content)

        # Upload to GCS
        await self._upload_file_to_gcs("README.md", index_content)

    async def _generate_topic_index_and_upload(self, topic_folder: Path, topic: Dict[str, Any]):
        """Generate topic index file and upload to GCS."""
        index_content = self._generate_topic_index_content(topic_folder, topic)

        with open(topic_folder / "README.md", 'w', encoding='utf-8') as f:
            f.write(index_content)

        # Upload to GCS
        relative_path = topic_folder.relative_to(self.output_dir) / "README.md"
        await self._upload_file_to_gcs(str(relative_path), index_content)

    async def _generate_topic_file_and_upload(self, folder: Path, topic: Dict[str, Any], is_subtopic: bool = False, parent_topic: str = ""):
        """Generate a topic markdown file and upload to GCS."""
        filename = f"{topic['name'].lower().replace(' ', '_')}.md"
        filepath = folder / filename

        file_content = self._generate_topic_file_content(folder, topic, is_subtopic, parent_topic)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(file_content)

        # Upload to GCS
        relative_path = filepath.relative_to(self.output_dir)
        await self._upload_file_to_gcs(str(relative_path), file_content)

    async def _create_progress_tracking_and_upload(self, research_content: Dict[str, Any]):
        """Create progress tracking file and upload to GCS."""
        progress_content = self._generate_progress_content(research_content)

        progress_path = Path(self.output_dir) / "PROGRESS.md"
        with open(progress_path, 'w', encoding='utf-8') as f:
            f.write(progress_content)

        # Upload to GCS
        await self._upload_file_to_gcs("PROGRESS.md", progress_content)

    async def _upload_file_to_gcs(self, file_path: str, content: str):
        """Upload a file to GCS."""
        try:
            print(f"📤 Attempting to upload {file_path} to GCS...")
            user_id = _notebooks[self.notebook_id]["user_id"]
            print(f"👤 User ID: {user_id}, Notebook ID: {self.notebook_id}")
            result = self.gcs_service.upload_file(user_id, self.notebook_id, file_path, content)
            print(f"✅ Successfully uploaded {file_path} to GCS: {result}")
        except Exception as e:
            print(f"❌ Failed to upload {file_path} to GCS: {e}")
            import traceback
            traceback.print_exc()
            # Continue processing - don't fail the entire generation

    def _generate_main_index_content(self, root_dir: Path, research_content: Dict[str, Any]) -> str:
        """Generate main index content (extracted from original method)."""
        topics_overview = ""
        learning_path = ""
        navigation = ""

        for i, topic in enumerate(research_content["topics"], 1):
            topic_folder = topic["name"].lower().replace(" ", "_")
            topics_overview += f"### {i}. {topic['name']}\n\n"
            topics_overview += f"{topic['description']}\n\n"
            topics_overview += f"📁 [Explore Topic]({topic_folder}/)\n\n"

            learning_path += f"{i}. [ ] {topic['name']} ({topic.get('estimated_time', '2 hours')})\n"

            navigation += f"- [{topic['name']}]({topic_folder}/)\n"

        progress_tracking = "## Progress Tracking\n\n" + learning_path

        # Calculate some basic stats
        total_time = "TBD"
        try:
            # Simple calculation based on topic time estimates
            time_parts = []
            for topic in research_content["topics"]:
                time_str = topic.get("estimated_time", "2 hours")
                if "hour" in time_str:
                    hours = int(time_str.split()[0])
                    time_parts.append(hours)
            if time_parts:
                total_hours = sum(time_parts)
                total_time = f"{total_hours} hours"
        except:
            total_time = "TBD"

        # Get first few topics for navigation examples
        first_topic = research_content["topics"][0] if research_content["topics"] else {"name": "topic1"}
        second_topic = research_content["topics"][1] if len(research_content["topics"]) > 1 else {"name": "topic2"}

        index_content = self.templates["index"].format(
            title=f"{self.config.subject} - Study Guide",
            subject=self.config.subject,
            description=self.config.description,
            difficulty=self.config.difficulty,
            date=datetime.now().strftime("%Y-%m-%d"),
            learning_goals="Master all concepts and complete practical exercises",
            estimated_total_time=total_time,
            prerequisites=", ".join(self.config.prerequisites) if self.config.prerequisites else "None required",
            learning_path=learning_path,
            topics_overview=topics_overview,
            progress_tracking=progress_tracking,
            first_topic_folder=first_topic["name"].lower().replace(" ", "_"),
            first_topic=first_topic["name"].lower().replace(" ", "_"),
            second_topic_folder=second_topic["name"].lower().replace(" ", "_"),
            second_topic=second_topic["name"].lower().replace(" ", "_"),
            navigation=navigation,
            support_resources="Additional support resources will be listed here...",
            community_resources="Online communities and forums for discussion...",
            continuous_learning="Advanced topics and further study recommendations...",
            advanced_topics="Advanced topics will be suggested based on your progress..."
        )

        return index_content

    def _generate_topic_index_content(self, topic_folder: Path, topic: Dict[str, Any]) -> str:
        """Generate topic index content (extracted from original method)."""
        subtopics = topic.get("subtopics", [])
        navigation = f"- [← Back to Main](../README.md)\n"

        for subtopic in subtopics:
            subtopic_file = subtopic["name"].lower().replace(" ", "_")
            navigation += f"- [{subtopic['name']}]({subtopic_file}/)\n"

        # Simple topic index
        index_content = f"""# {topic['name']}

**Topic Overview**

{topic['description']}

## Files in this topic

- [{topic['name']}]({topic['name'].lower().replace(' ', '_')}.md) - Main topic content

## Navigation

{navigation}

---

*Generated by Study Notes Generator*
"""
        return index_content

    def _generate_topic_file_content(self, folder: Path, topic: Dict[str, Any], is_subtopic: bool = False, parent_topic: str = "") -> str:
        """Generate topic file content (extracted from original method)."""
        filename = f"{topic['name'].lower().replace(' ', '_')}.md"

        # Get parsed content sections (now a dict instead of string)
        content_sections = topic.get("content", {})
        if isinstance(content_sections, str):
            # Fallback for old format - create a dict with the string as detailed_content
            content_sections = {
                "learning_objectives": "Learning objectives will be detailed here...",
                "key_concepts": "Key concepts will be listed here...",
                "detailed_content": content_sections,
                "core_principles": "Core principles will be explained here...",
                "common_patterns": "Common patterns will be covered here...",
                "important_notes": "Important notes will be added here...",
                "examples": "Examples will be provided here...",
                "practical_applications": "Practical applications will be discussed here...",
                "exercises": "Practice exercises will be added here...",
                "beginner_exercises": "Beginner exercises will be listed here...",
                "intermediate_exercises": "Intermediate exercises will be listed here...",
                "advanced_challenges": "Advanced challenges will be listed here...",
                "related_topics": f"Related: {parent_topic}" if parent_topic else "See main index for related topics",
                "prerequisites": "Prerequisites will be listed here...",
                "next_steps": "Next steps will be suggested here...",
                "cross_references": "Cross-references will be added here...",
                "resources": "Additional resources will be listed here...",
                "recommended_reading": "Recommended reading will be listed here...",
                "online_resources": "Online resources will be listed here...",
                "tools": "Tools and software will be suggested here...",
                "study_notes": "Add your personal notes here..."
            }

        # Create navigation
        if is_subtopic:
            navigation = f"- [← Back to {parent_topic}](../README.md)\n- [← Back to Main](../../../README.md)"
        else:
            navigation = "- [← Back to Main](../README.md)"

        # Generate file content using template with parsed sections
        file_content = self.templates["note"].format(
            title=topic["name"],
            subject=self.config.subject,
            topic=topic["name"],
            difficulty=topic.get("difficulty", "intermediate"),
            date=datetime.now().strftime("%Y-%m-%d"),
            estimated_time=topic.get("estimated_time", "2 hours"),
            overview=topic.get("description", ""),
            learning_objectives=content_sections.get("learning_objectives", "Learning objectives will be detailed here..."),
            key_concepts=content_sections.get("key_concepts", "Key concepts will be listed here..."),
            detailed_content=content_sections.get("detailed_content", "Content generation in progress..."),
            core_principles=content_sections.get("core_principles", "Core principles will be explained here..."),
            common_patterns=content_sections.get("common_patterns", "Common patterns will be covered here..."),
            important_notes=content_sections.get("important_notes", "Important notes will be added here..."),
            examples=content_sections.get("examples", "Examples will be provided here..."),
            practical_applications=content_sections.get("practical_applications", "Practical applications will be discussed here..."),
            code_examples=content_sections.get("code_examples", "Code examples will be provided here..." if "python" in self.config.subject.lower() else "Examples will be provided here..."),
            exercises=content_sections.get("exercises", "Practice exercises will be added here..."),
            beginner_exercises=content_sections.get("beginner_exercises", "Beginner exercises will be listed here..."),
            intermediate_exercises=content_sections.get("intermediate_exercises", "Intermediate exercises will be listed here..."),
            advanced_challenges=content_sections.get("advanced_challenges", "Advanced challenges will be listed here..."),
            related_topics=content_sections.get("related_topics", f"Related: {parent_topic}" if parent_topic else "See main index for related topics"),
            prerequisites=content_sections.get("prerequisites", "Prerequisites will be listed here..."),
            next_steps=content_sections.get("next_steps", "Next steps will be suggested here..."),
            cross_references=content_sections.get("cross_references", "Cross-references will be added here..."),
            resources=content_sections.get("resources", "Additional resources will be listed here..."),
            recommended_reading=content_sections.get("recommended_reading", "Recommended reading will be listed here..."),
            online_resources=content_sections.get("online_resources", "Online resources will be listed here..."),
            tools=content_sections.get("tools", "Tools and software will be suggested here..."),
            study_notes=content_sections.get("study_notes", "Add your personal notes here..."),
            navigation=navigation
        )

        return file_content

    def _generate_progress_content(self, research_content: Dict[str, Any]) -> str:
        """Generate progress tracking content (extracted from original method)."""
        topic_checkboxes = ""
        topic_progress = ""

        for topic in research_content["topics"]:
            topic_checkboxes += f"- [ ] {topic['name']}\n"

            topic_progress += f"### {topic['name']}\n\n"
            topic_progress += f"**Status:** Not started\n"
            topic_progress += f"**Estimated Time:** {topic.get('estimated_time', '2 hours')}\n"
            topic_progress += f"**Difficulty:** {topic.get('difficulty', 'intermediate')}\n\n"

            # Add subtopics
            for subtopic in topic.get("subtopics", []):
                topic_progress += f"- [ ] {subtopic['name']}\n"

            topic_progress += "\n"

        progress_content = self.templates["progress"].format(
            subject=self.config.subject,
            start_date=datetime.now().strftime("%Y-%m-%d"),
            update_date=datetime.now().strftime("%Y-%m-%d"),
            target_completion=(datetime.now().replace(day=1, month=datetime.now().month + 1) - datetime.now().replace(day=1)).days,
            overall_progress="0%",
            completed_topics="0",
            total_topics=str(len(research_content["topics"])),
            study_streak="0",
            time_remaining="TBD",
            progress_bar="░░░░░░░░░░░░░░░░░░░░░░░░",
            total_study_time="0 hours",
            avg_session_time="0 minutes",
            productive_day="TBD",
            topic_checkboxes=topic_checkboxes,
            topic_progress=topic_progress,
            weekly_goals="Complete 2-3 topics this week",
            daily_log="Daily study log will be maintained here...",
            completed_topics_list="No topics completed yet",
            key_takeaways="Key takeaways will be added here...",
            effective_techniques="Effective techniques will be noted here...",
            improvement_areas="Areas for improvement will be identified here...",
            motivation_reflections="Motivation reflections will be added here...",
            short_term_goals="Complete first topic",
            medium_term_goals="Complete half of all topics",
            long_term_goals="Master all concepts and complete final project",
            resource_usage="Resource usage will be tracked here...",
            helpful_resources="Helpful resources will be listed here...",
            additional_resources="Additional resources to explore...",
            achievements="Achievements will be listed here...",
            recent_milestones="Recent milestones will be added here...",
            upcoming_milestones="Upcoming milestones will be planned here...",
            personal_notes="Add your personal notes and reflections here..."
        )

        return progress_content

    async def _generate_research_content_with_loop_agent(self, content_structure: Dict[str, Any]) -> Dict[str, Any]:
        """Generate detailed research content for each topic using loop agent pattern."""
        research_content = {
            "subject": content_structure["subject"],
            "topics": []
        }

        # Use loop agent to coordinate content generation
        for i, topic in enumerate(content_structure["topics"]):
            print(f"  🔄 Loop Agent generating content for: {topic['name']} ({i+1}/{len(content_structure['topics'])})")

            # Generate content for main topic using loop agent
            topic_content = await self._generate_topic_content_with_loop_agent(topic, research_content["topics"])
            topic_content["subtopics"] = []

            # Generate content for subtopics
            for subtopic in topic.get("subtopics", []):
                subtopic_data = {
                    "name": subtopic["name"],
                    "description": subtopic.get("description", ""),
                    "parent_topic": topic["name"],
                    "difficulty": subtopic.get("difficulty", topic["difficulty"]),
                    "key_concepts": subtopic.get("key_concepts", []),
                    "estimated_time": subtopic.get("estimated_time", "1-2 hours"),
                    "learning_objectives": subtopic.get("learning_objectives", []),
                    "prerequisites": subtopic.get("prerequisites", []),
                    "resources": subtopic.get("resources", [])
                }
                subtopic_content = await self._generate_topic_content_with_loop_agent(subtopic_data, topic_content["subtopics"])
                topic_content["subtopics"].append(subtopic_content)

            research_content["topics"].append(topic_content)

        return research_content

    async def _generate_topic_content_with_loop_agent(self, topic: Dict[str, Any], previous_topics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate content for a specific topic using loop agent with context awareness."""
        is_subtopic = 'parent_topic' in topic and topic['parent_topic'] != 'N/A'

        # Adjust content depth for subtopics (more focused)
        content_depth = "focused" if is_subtopic else self.config.content_depth

        # Build context from previous topics for cross-references
        context_summary = ""
        if previous_topics:
            context_summary = "Previous topics covered:\n" + "\n".join([
                f"- {t['name']}: {t.get('description', '')[:100]}..."
                for t in previous_topics[-3:]  # Last 3 topics for context
            ])

        # Loop agent prompt for iterative content generation
        if is_subtopic:
            loop_prompt = f"""
            Generate focused study notes for the following SUBTOPIC using structured markdown format.
            This is part of an iterative notebook generation process.

            Subject: {self.config.subject}
            Parent Topic: {topic['parent_topic']}
            Subtopic: {topic['name']}
            Description: {topic.get('description', 'N/A')}
            Difficulty Level: {topic.get('difficulty', 'intermediate')}
            Content Depth: {content_depth}

            Key Concepts to Cover: {', '.join(topic.get('key_concepts', []))}

            Context from Previous Content:
            {context_summary}

            IMPORTANT: This is iteration {len(previous_topics) + 1} in the notebook generation loop.
            Ensure this subtopic content complements the parent topic "{topic['parent_topic']}"
            and builds upon previously generated content without unnecessary repetition.

            Generate content in the following EXACT markdown structure:

            ## Learning Objectives
            [Specific learning objectives for this subtopic]

            ## Key Concepts
            [List key concepts specific to this subtopic]

            ## Detailed Explanation
            [Focused content specific to this subtopic]

            ## Core Principles
            [Principles specific to this subtopic]

            ## Common Patterns
            [Patterns relevant to this subtopic]

            ## Important Notes
            [Critical information specific to this subtopic]

            ## Examples
            [Practical examples for this subtopic]

            ## Practical Applications
            [Applications specific to this subtopic]

            ## Practice Exercises
            [Exercises focused on this subtopic]

            ## Beginner Exercises
            [Simple exercises for this subtopic]

            ## Intermediate Exercises
            [Moderate exercises for this subtopic]

            ## Advanced Challenges
            [Challenging exercises for this subtopic]

            ## Related Topics
            [How this subtopic connects to other topics in the notebook]

            ## Prerequisites
            [What you need to know before this subtopic]

            ## Next Steps
            [What to learn next in this topic area]

            Focus on depth rather than breadth. Build upon the iterative generation process.
            """
        else:
            # Main topic prompt
            loop_prompt = f"""
            Generate comprehensive study notes for the following MAIN TOPIC using structured markdown format.
            This is iteration {len(previous_topics) + 1} in the notebook generation loop.

            Subject: {self.config.subject}
            Topic: {topic['name']}
            Description: {topic.get('description', 'N/A')}
            Difficulty Level: {topic.get('difficulty', 'intermediate')}
            Content Depth: {self.config.content_depth}
            Category: {self.config.subject}

            Key Concepts to Cover: {', '.join(topic.get('key_concepts', []))}
            Estimated Time: {topic.get('estimated_time', '2-4 hours')}

            Context from Previously Generated Topics:
            {context_summary}

            Generate content in the following EXACT markdown structure:

            ## Learning Objectives
            [Specific, measurable learning objectives for this topic]

            ## Key Concepts
            [List key concepts and definitions]

            ## Detailed Explanation
            [Main content and explanations]

            ## Core Principles
            [Fundamental principles and theories]

            ## Common Patterns
            [Common patterns, techniques, and approaches]

            ## Important Notes
            [Critical information, tips, and warnings]

            ## Examples
            [Practical examples and illustrations]

            ## Practical Applications
            [Real-world applications and use cases]

            ## Practice Exercises
            [Hands-on exercises and problems]

            ## Beginner Exercises
            [Simple exercises for beginners]

            ## Intermediate Exercises
            [Moderate difficulty exercises]

            ## Advanced Challenges
            [Complex, challenging exercises]

            ## Related Topics
            [Connections to previously generated and upcoming topics]

            ## Prerequisites
            [Required knowledge before this topic]

            ## Next Steps
            [What to learn after this topic]

            Make the content educational, comprehensive, and suitable for deep learning.
            Ensure this topic builds logically upon the previous topics in the generation sequence.
            """

        # Use Vertex AI notebook loop agent for content generation
        print(f"🤖 Calling Vertex AI agent for topic: {topic['name']}")
        response = await call_vertex_ai_agent(
            endpoint=VERTEX_AI_NOTEBOOK_LOOP_ENDPOINT,
            payload={"prompt": loop_prompt}
        )
        print(f"✅ Agent response received for topic: {topic['name']}")

        # Parse the structured response into sections
        parsed_sections = self._parse_structured_response(response)

        return {
            "name": topic["name"],
            "description": topic.get("description", ""),
            "content": parsed_sections,
            "difficulty": topic.get("difficulty", "intermediate"),
            "estimated_time": topic.get("estimated_time", "2 hours")
        }

    async def _generate_files_with_loop_agent_and_upload(self, folder_structure: Dict[str, Any], research_content: Dict[str, Any]):
        """Generate all markdown files using loop agent pattern and upload to GCS."""
        # Create root directory
        root_dir = Path(self.output_dir)
        root_dir.mkdir(parents=True, exist_ok=True)

        # Generate main index file and upload
        await self._generate_main_index_and_upload(root_dir, research_content)

        # Loop through topics and generate files iteratively
        for topic in research_content["topics"]:
            topic_folder = root_dir / topic["name"].lower().replace(" ", "_")
            topic_folder.mkdir(exist_ok=True)

            # Generate topic index and upload
            await self._generate_topic_index_and_upload(topic_folder, topic)

            # Generate main topic file and upload
            await self._generate_topic_file_and_upload(topic_folder, topic)

            # Generate subtopic files and upload
            for subtopic in topic.get("subtopics", []):
                subtopic_folder = topic_folder / subtopic["name"].lower().replace(" ", "_")
                subtopic_folder.mkdir(exist_ok=True)

                await self._generate_topic_file_and_upload(subtopic_folder, subtopic, is_subtopic=True, parent_topic=topic["name"])


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # JWT Settings
    jwt_secret_key: str = Field(default="your-secret-key-change-in-production", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiration_hours: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    
    # Google OAuth Settings
    google_client_id: str = Field(default="", env="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", env="GOOGLE_CLIENT_SECRET")
    

    # GCS Settings
    gcs_project_id: str = Field(default="learnpad-gcp", env="GCS_PROJECT_ID")
    gcs_bucket_name: str = Field(default="learnpad-gcp-dev", env="GCS_BUCKET_NAME")
    gcs_credentials_path: str = Field(default="learnpad-backend-key.json", env="GCS_CREDENTIALS_PATH")
    gcs_base_path: str = Field(default="users", env="GCS_BASE_PATH")
    # CORS Settings
    cors_origins: list[str] = Field(default=["http://localhost:3000", "http://localhost:8001"], env="CORS_ORIGINS")
    
    # Notebook Settings
    notebooks_base_path: str = Field(default="./notebooks", env="NOTEBOOKS_BASE_PATH")
    assessment_session_ttl_hours: int = Field(default=24, env="ASSESSMENT_SESSION_TTL_HOURS")
    
    class Config:
        env_file = ".env"


# Initialize settings
settings = Settings()

# Initialize FastAPI app
app = FastAPI(
    title="LearnPad API",
    description="Authentication-enabled API for LearnPad application",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


# Pydantic models
class GoogleTokenRequest(BaseModel):
    """Request model for Google token verification."""
    token: str = Field(..., description="Google ID token")


class LoginResponse(BaseModel):
    """Response model for successful login."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user_info: Dict[str, Any] = Field(..., description="User information")


class UserInfo(BaseModel):
    """User information model."""
    sub: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    name: str = Field(..., description="User full name")
    picture: Optional[str] = Field(None, description="User profile picture URL")
    email_verified: bool = Field(default=False, description="Email verification status")


class TokenData(BaseModel):
    """Token payload data."""
    sub: str
    email: str
    name: str
    picture: Optional[str] = None
    exp: datetime
    iat: datetime


# Notebook API Pydantic Models

# User Assessment Models
class AssessmentStartRequest(BaseModel):
    """Request to start assessment session."""
    subject: Optional[str] = Field(None, description="Subject/topic of interest")
    initial_goals: Optional[str] = Field(None, description="Initial learning goals")
    user_id: str = Field(..., description="User ID")


class AssessmentMessageRequest(BaseModel):
    """Request to send message in assessment session."""
    message: str = Field(..., description="User message")
    user_id: str = Field(..., description="User ID")


class AssessmentStartResponse(BaseModel):
    """Response for starting assessment session."""
    session_id: str = Field(..., description="Assessment session ID")
    status: str = Field(..., description="Session status")
    initial_message: str = Field(..., description="Initial agent message")
    created_at: str = Field(..., description="ISO datetime")


class AssessmentMessageResponse(BaseModel):
    """Response for assessment message."""
    session_id: str = Field(..., description="Assessment session ID")
    response: str = Field(..., description="Agent response")
    assessment_status: str = Field(..., description="in_progress or complete")
    profile_complete: bool = Field(..., description="Whether profile is complete")


class AssessmentProfileResponse(BaseModel):
    """Response for assessment profile."""
    session_id: str = Field(..., description="Assessment session ID")
    profile: Dict[str, Any] = Field(..., description="User profile")
    status: str = Field(..., description="Session status")
    created_at: str = Field(..., description="ISO datetime")


# Curriculum Planning Models
class CurriculumPlanRequest(BaseModel):
    """Request to create curriculum plan."""
    user_profile: Dict[str, Any] = Field(..., description="User profile from assessment")
    subject: str = Field(..., description="Subject to create curriculum for")
    learning_goals: Optional[str] = Field(None, description="Learning goals")
    time_constraints: Optional[str] = Field(None, description="Time constraints")


class CurriculumPlanResponse(BaseModel):
    """Response for curriculum plan."""
    plan_id: str = Field(..., description="Curriculum plan ID")
    curriculum: Dict[str, Any] = Field(..., description="Curriculum plan")
    status: str = Field(..., description="Plan status")
    created_at: str = Field(..., description="ISO datetime")


# Notebook Generation Models
class NotebookGenerateRequest(BaseModel):
    """Request to generate notebook."""
    plan_id: Optional[str] = Field(None, description="Curriculum plan ID (Option 1)")
    config: Optional[Dict[str, Any]] = Field(None, description="Direct notebook config (Option 2)")
    user_id: str = Field(..., description="User ID")
    options: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {
            "include_progress_tracking": True,
            "include_cross_references": True,
            "output_format": "markdown"
        },
        description="Generation options"
    )


class ProgressInfo(BaseModel):
    """Progress information for notebook generation."""
    current_step: str = Field(..., description="Current step")
    total_steps: int = Field(..., description="Total steps")
    percentage: int = Field(..., description="Completion percentage (0-100)")


class NotebookGenerateResponse(BaseModel):
    """Response for notebook generation."""
    notebook_id: str = Field(..., description="Notebook ID")
    status: str = Field(..., description="generating, complete, or error")
    progress: Optional[ProgressInfo] = Field(None, description="Generation progress")
    notebook_path: Optional[str] = Field(None, description="Path to generated notebook")
    created_at: str = Field(..., description="ISO datetime")


class NotebookDetailResponse(BaseModel):
    """Response for notebook details."""
    notebook_id: str = Field(..., description="Notebook ID")
    subject: str = Field(..., description="Subject")
    status: str = Field(..., description="Notebook status")
    progress: Optional[ProgressInfo] = Field(None, description="Generation progress")
    notebook_path: str = Field(..., description="Path to notebook")
    metadata: Dict[str, Any] = Field(..., description="Notebook metadata")
    structure: Dict[str, Any] = Field(..., description="Notebook structure")


class NotebookConfigResponse(BaseModel):
    """Response for notebook config."""
    notebook_id: str = Field(..., description="Notebook ID")
    config: Dict[str, Any] = Field(..., description="Notebook configuration")


class NotebookListItem(BaseModel):
    """Notebook list item."""
    notebook_id: str = Field(..., description="Notebook ID")
    subject: str = Field(..., description="Subject")
    status: str = Field(..., description="Status")
    created_at: str = Field(..., description="ISO datetime")
    updated_at: str = Field(..., description="ISO datetime")


class NotebookListResponse(BaseModel):
    """Response for notebook list."""
    notebooks: List[NotebookListItem] = Field(..., description="List of notebooks")
    total: int = Field(..., description="Total count")
    limit: int = Field(..., description="Limit")
    offset: int = Field(..., description="Offset")


class NotebookDeleteResponse(BaseModel):
    """Response for notebook deletion."""
    notebook_id: str = Field(..., description="Notebook ID")
    status: str = Field(..., description="deleted")
    deleted_at: str = Field(..., description="ISO datetime")


# JWT Token utilities
class JWTHandler:
    """Handles JWT token creation and validation."""
    
    @staticmethod
    def create_access_token(user_data: Dict[str, Any]) -> str:
        """Create a JWT access token."""
        now = datetime.now(timezone.utc)
        expire = now + timedelta(hours=settings.jwt_expiration_hours)
        
        payload = {
            "sub": user_data["sub"],
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),  # Include picture in token
            "iat": now,
            "exp": expire,
            "type": "access_token"
        }
        
        return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    
    @staticmethod
    def verify_token(token: str) -> TokenData:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(
                token, 
                settings.jwt_secret_key, 
                algorithms=[settings.jwt_algorithm]
            )
            
            # Check if token is expired
            exp_timestamp = payload.get("exp")
            if exp_timestamp:
                exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
                if datetime.now(timezone.utc) > exp_datetime:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired"
                    )
            
            return TokenData(
                sub=payload.get("sub"),
                email=payload.get("email"),
                name=payload.get("name"),
                picture=payload.get("picture"),  # Extract picture from token
                exp=datetime.fromtimestamp(payload.get("exp"), tz=timezone.utc),
                iat=datetime.fromtimestamp(payload.get("iat"), tz=timezone.utc)
            )
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )


# Google OAuth utilities
class GoogleAuthHandler:
    """Handles Google OAuth authentication."""
    
    @staticmethod
    def verify_google_token(token: str) -> Dict[str, Any]:
        """Verify Google ID token and extract user information."""
        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                settings.google_client_id
            )
            
            # Verify the issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            return {
                "sub": idinfo["sub"],
                "email": idinfo["email"],
                "name": idinfo["name"],
                "picture": idinfo.get("picture"),
                "email_verified": idinfo.get("email_verified", False)
            }
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}"
            )


# Authentication dependencies
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Dependency to get current authenticated user from JWT token."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    token = credentials.credentials
    return JWTHandler.verify_token(token)


async def get_optional_user(request: Request) -> Optional[TokenData]:
    """Optional authentication dependency that doesn't raise errors."""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        return JWTHandler.verify_token(token)
    except:
        return None


# Authentication routes
@app.post("/auth/google", response_model=LoginResponse)
async def google_login(request: GoogleTokenRequest):
    """Authenticate user with Google ID token."""
    # Verify Google token and get user info
    user_info = GoogleAuthHandler.verify_google_token(request.token)
    
    # Create JWT access token
    access_token = JWTHandler.create_access_token(user_info)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.jwt_expiration_hours * 3600,  # Convert hours to seconds
        user_info=user_info
    )


@app.post("/auth/verify")
async def verify_token(current_user: TokenData = Depends(get_current_user)):
    """Verify if the current JWT token is valid."""
    return {
        "valid": True,
        "user": {
            "sub": current_user.sub,
            "email": current_user.email,
            "name": current_user.name,
            "picture": current_user.picture,  # Include picture in response
            "exp": current_user.exp.isoformat(),
            "iat": current_user.iat.isoformat()
        }
    }


@app.post("/auth/refresh")
async def refresh_token(current_user: TokenData = Depends(get_current_user)):
    """Refresh the JWT token."""
    user_data = {
        "sub": current_user.sub,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture  # Include picture in refresh
    }
    
    new_token = JWTHandler.create_access_token(user_data)
    
    return LoginResponse(
        access_token=new_token,
        token_type="bearer",
        expires_in=settings.jwt_expiration_hours * 3600,
        user_info=user_data
    )


# Public routes
@app.get("/")
async def root():
    """Public root endpoint."""
    return {
        "message": "LearnPad API",
        "version": "1.0.0",
        "status": "running",
        "authentication": "Google OAuth + JWT"
    }


@app.get("/health")
async def health_check():
    """Public health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "google_client_configured": bool(settings.google_client_id)
    }


# Protected routes examples
@app.get("/protected")
async def protected_route(current_user: TokenData = Depends(get_current_user)):
    """Example protected route that requires authentication."""
    return {
        "message": "This is a protected route",
        "user": {
            "sub": current_user.sub,
            "email": current_user.email,
            "name": current_user.name
        }
    }


@app.get("/profile")
async def get_profile(current_user: TokenData = Depends(get_current_user)):
    """Get current user profile."""
    return {
        "sub": current_user.sub,
        "email": current_user.email,
        "name": current_user.name,
        "token_issued_at": current_user.iat.isoformat(),
        "token_expires_at": current_user.exp.isoformat()
    }


@app.get("/optional-auth")
async def optional_auth_route(current_user: Optional[TokenData] = Depends(get_optional_user)):
    """Example route with optional authentication."""
    if current_user:
        return {
            "message": "Hello authenticated user!",
            "user": current_user.email
        }
    else:
        return {
            "message": "Hello anonymous user!",
            "note": "You can access this route without authentication"
        }


# ============================================================================
# Notebook API Implementation
# ============================================================================

# In-memory storage (in production, use Redis or database)
_assessment_sessions: Dict[str, Dict[str, Any]] = {}
_curriculum_plans: Dict[str, Dict[str, Any]] = {}
_notebooks: Dict[str, Dict[str, Any]] = {}


def _cleanup_expired_sessions():
    """Clean up expired assessment sessions."""
    now = datetime.now(timezone.utc)
    expired = []
    for session_id, session in _assessment_sessions.items():
        expires_at = session.get("expires_at")
        if expires_at and now > expires_at:
            expired.append(session_id)
    for session_id in expired:
        del _assessment_sessions[session_id]


# User Assessment APIs
@app.post("/api/notebooks/assess/start", response_model=AssessmentStartResponse)
async def start_assessment(request: AssessmentStartRequest, current_user: TokenData = Depends(get_current_user)):
    """Start a new user assessment session."""
    _cleanup_expired_sessions()
    
    session_id = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.assessment_session_ttl_hours)
    
    # Initialize assessment conversation
    initial_prompt = "Hello! I'm here to help you create a personalized learning experience. "
    if request.subject:
        initial_prompt += f"I see you're interested in {request.subject}. "
    if request.initial_goals:
        initial_prompt += f"Your initial goals are: {request.initial_goals}. "
    initial_prompt += "Let's start by understanding your learning preferences and experience level. What's your current experience level with this subject?"
    
    try:
        # Call Vertex AI user assessment agent
        response_text = await call_vertex_ai_agent(
            endpoint=VERTEX_AI_USER_ASSESSMENT_ENDPOINT,
            payload={"prompt": initial_prompt}
        )
        
        _assessment_sessions[session_id] = {
            "session_id": session_id,
            "user_id": request.user_id,
            "conversation_history": [
                {"role": "assistant", "content": response_text}
            ],
            "status": "in_progress",
            "profile": None,
            "created_at": datetime.now(timezone.utc),
            "expires_at": expires_at
        }
        
        return AssessmentStartResponse(
            session_id=session_id,
            status="started",
            initial_message=response_text,
            created_at=datetime.now(timezone.utc).isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting assessment: {str(e)}"
        )


@app.post("/api/notebooks/assess/{session_id}/message", response_model=AssessmentMessageResponse)
async def send_assessment_message(
    session_id: str,
    request: AssessmentMessageRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Continue assessment conversation."""
    _cleanup_expired_sessions()
    
    if session_id not in _assessment_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found"
        )
    
    session = _assessment_sessions[session_id]
    
    # Check if session expired
    if session.get("expires_at") and datetime.now(timezone.utc) > session["expires_at"]:
        del _assessment_sessions[session_id]
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Assessment session has expired"
        )
    
    # Check user ownership
    if session["user_id"] != request.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Build conversation context
    conversation_context = "\n".join([
        f"{msg['role']}: {msg['content']}"
        for msg in session["conversation_history"]
    ])
    conversation_context += f"\nuser: {request.message}"
    
    try:
        # Call Vertex AI user assessment agent
        response_text = await call_vertex_ai_agent(
            endpoint=VERTEX_AI_USER_ASSESSMENT_ENDPOINT,
            payload={"prompt": conversation_context}
        )
        
        # Update conversation history
        session["conversation_history"].append({"role": "user", "content": request.message})
        session["conversation_history"].append({"role": "assistant", "content": response_text})
        
        # Check if profile is complete (agent should call create_user_profile)
        # For now, we'll check if the response indicates completion
        profile_complete = "profile" in response_text.lower() or session.get("profile") is not None
        
        if profile_complete and session.get("profile") is None:
            # Try to extract profile from response
            # In a real implementation, the agent would call the tool and we'd capture it
            # For now, we'll mark it as complete if the agent mentions it
            pass
        
        return AssessmentMessageResponse(
            session_id=session_id,
            response=response_text,
            assessment_status="complete" if profile_complete else "in_progress",
            profile_complete=profile_complete
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@app.get("/api/notebooks/assess/{session_id}/profile", response_model=AssessmentProfileResponse)
async def get_assessment_profile(
    session_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get the final user profile after assessment."""
    _cleanup_expired_sessions()
    
    if session_id not in _assessment_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found"
        )
    
    session = _assessment_sessions[session_id]
    
    if session.get("expires_at") and datetime.now(timezone.utc) > session["expires_at"]:
        del _assessment_sessions[session_id]
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Assessment session has expired"
        )
    
    # If profile not yet extracted, try to generate it from conversation
    if session.get("profile") is None:
        # In a real implementation, we'd call the agent to generate the profile
        # For now, return a placeholder structure
        session["profile"] = {
            "experience_level": "intermediate",
            "learning_goals": "Learn the subject",
            "learning_style": {
                "visual": 0.5,
                "hands_on": 0.5,
                "theoretical": 0.5,
                "combination": True
            },
            "control_preferences": {
                "guidance_level": 0.5,
                "autonomy_level": 0.5,
                "preferred_approach": "mixed"
            },
            "time_constraints": {
                "hours_per_week": 10,
                "target_completion": "2 months",
                "pacing_preference": "moderate"
            },
            "theory_vs_practice_ratio": {
                "theory_percentage": 50,
                "practice_percentage": 50
            },
            "knowledge_gaps": [],
            "readiness_score": 0.5,
            "prerequisites_needed": []
        }
    
    return AssessmentProfileResponse(
        session_id=session_id,
        profile=session["profile"],
        status="complete",
        created_at=session["created_at"].isoformat()
    )


# Curriculum Planning APIs
@app.post("/api/notebooks/plan", response_model=CurriculumPlanResponse)
async def create_curriculum_plan(
    request: CurriculumPlanRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Create a curriculum plan from user profile and subject."""
    plan_id = str(uuid.uuid4())
    
    try:
        # Prepare prompt for curriculum planner
        user_profile_str = json.dumps(request.user_profile)
        prompt = f"""
        Create a comprehensive curriculum plan for the following:
        
        Subject: {request.subject}
        Learning Goals: {request.learning_goals or 'Not specified'}
        Time Constraints: {request.time_constraints or 'Not specified'}
        
        User Profile:
        {user_profile_str}
        
        Please use the generate_complete_curriculum tool to create a full curriculum plan that includes:
        - Learning path with topic sequences
        - Notebook structure
        - Content depth plan
        - Assessment plan
        - Practice progression
        """
        
        # Call Vertex AI curriculum planner agent
        response_text = await call_vertex_ai_agent(
            endpoint=VERTEX_AI_CURRICULUM_PLANNER_ENDPOINT,
            payload={"prompt": prompt}
        )
        
        # Parse curriculum (simplified - in production, extract from tool call)
        curriculum = {
            "subject": request.subject,
            "curriculum_metadata": {
                "created_for": request.user_profile.get("experience_level", "intermediate"),
                "estimated_completion_time": request.time_constraints or "TBD",
                "total_notebooks": 1,
                "total_topics": 5
            },
            "learning_path": {
                "topics": [],
                "prerequisite_map": {},
                "learning_path_summary": response_text[:500]
            },
            "notebook_structure": {},
            "content_depth_plan": {},
            "assessment_plan": {},
            "practice_progression": {}
        }
        
        _curriculum_plans[plan_id] = {
            "plan_id": plan_id,
            "curriculum": curriculum,
            "status": "complete",
            "created_at": datetime.now(timezone.utc),
            "user_id": current_user.sub
        }
        
        return CurriculumPlanResponse(
            plan_id=plan_id,
            curriculum=curriculum,
            status="complete",
            created_at=datetime.now(timezone.utc).isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating curriculum plan: {str(e)}"
        )


@app.get("/api/notebooks/plan/{plan_id}", response_model=CurriculumPlanResponse)
async def get_curriculum_plan(
    plan_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get curriculum plan details."""
    if plan_id not in _curriculum_plans:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curriculum plan not found"
        )
    
    plan = _curriculum_plans[plan_id]
    
    # Check ownership
    if plan.get("user_id") != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return CurriculumPlanResponse(
        plan_id=plan["plan_id"],
        curriculum=plan["curriculum"],
        status=plan["status"],
        created_at=plan["created_at"].isoformat()
    )


# Notebook Generation APIs
@app.post("/api/notebooks/generate", response_model=NotebookGenerateResponse)
async def generate_notebook(
    request: NotebookGenerateRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Generate notebook from curriculum plan or config."""
    if not NotebookGenerator:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Notebook generator not available"
        )
    
    notebook_id = str(uuid.uuid4())
    
    # Determine config source
    config = None
    if request.config:
        config = request.config
    elif request.plan_id:
        if request.plan_id not in _curriculum_plans:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Curriculum plan not found"
            )
        plan = _curriculum_plans[request.plan_id]
        # Convert curriculum plan to notebook config
        config = _convert_curriculum_to_config(plan["curriculum"])
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either plan_id or config must be provided"
        )
    
    # Create notebook record
    notebook_path = Path(settings.notebooks_base_path) / current_user.sub / notebook_id
    notebook_path.mkdir(parents=True, exist_ok=True)
    
    _notebooks[notebook_id] = {
        "notebook_id": notebook_id,
        "user_id": current_user.sub,
        "subject": config.get("subject", "Unknown"),
        "status": "generating",
        "config": config,
        "notebook_path": str(notebook_path),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "progress": {
            "current_step": "Initializing",
            "total_steps": 5,
            "percentage": 0
        }
    }
    
    # Start async generation
    asyncio.create_task(_generate_notebook_async(notebook_id, config, notebook_path, request.options))
    
    return NotebookGenerateResponse(
        notebook_id=notebook_id,
        status="generating",
        progress=ProgressInfo(
            current_step="Initializing",
            total_steps=5,
            percentage=0
        ),
        notebook_path=None,
        created_at=datetime.now(timezone.utc).isoformat()
    )


async def _generate_notebook_async(notebook_id: str, config: Dict[str, Any], output_path: Path, options: Dict[str, Any]):
    """Async notebook generation task."""
    try:
        # Save config to temp file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config, f, indent=2)
            config_file = f.name

        # Update progress
        _notebooks[notebook_id]["progress"] = {
            "current_step": "Creating generator",
            "total_steps": 5,
            "percentage": 20
        }

        # Create generator and generate
        generator = NotebookGeneratorWithGCS(config_file, str(output_path), notebook_id)

        _notebooks[notebook_id]["progress"] = {
            "current_step": "Generating content",
            "total_steps": 5,
            "percentage": 40
        }

        await generator.generate_notebook()

        # Update status
        _notebooks[notebook_id]["status"] = "complete"
        _notebooks[notebook_id]["progress"] = {
            "current_step": "Complete",
            "total_steps": 5,
            "percentage": 100
        }
        _notebooks[notebook_id]["updated_at"] = datetime.now(timezone.utc)

        # Clean up temp file
        os.unlink(config_file)

    except Exception as e:
        _notebooks[notebook_id]["status"] = "error"
        _notebooks[notebook_id]["error"] = str(e)
        _notebooks[notebook_id]["updated_at"] = datetime.now(timezone.utc)


@app.get("/api/notebooks/{notebook_id}", response_model=NotebookDetailResponse)
async def get_notebook(
    notebook_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get notebook details and status."""
    if notebook_id not in _notebooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notebook not found"
        )
    
    notebook = _notebooks[notebook_id]
    
    # Check ownership
    if notebook["user_id"] != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Calculate structure info
    structure = {
        "total_topics": len(notebook["config"].get("topics", [])),
        "total_files": 0,  # Would need to scan directory
        "estimated_time": "TBD"
    }
    
    return NotebookDetailResponse(
        notebook_id=notebook_id,
        subject=notebook["subject"],
        status=notebook["status"],
        progress=ProgressInfo(**notebook["progress"]) if notebook.get("progress") else None,
        notebook_path=notebook["notebook_path"],
        metadata={
            "created_at": notebook["created_at"].isoformat(),
            "updated_at": notebook["updated_at"].isoformat(),
            "user_id": notebook["user_id"]
        },
        structure=structure
    )


@app.get("/api/notebooks/{notebook_id}/config", response_model=NotebookConfigResponse)
async def get_notebook_config(
    notebook_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get the notebook configuration used for generation."""
    if notebook_id not in _notebooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notebook not found"
        )
    
    notebook = _notebooks[notebook_id]
    
    # Check ownership
    if notebook["user_id"] != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return NotebookConfigResponse(
        notebook_id=notebook_id,
        config=notebook["config"]
    )


# Notebook Management APIs
@app.get("/api/notebooks", response_model=NotebookListResponse)
async def list_notebooks(
    status_filter: Optional[str] = Query(None, alias="status"),
    subject_filter: Optional[str] = Query(None, alias="subject"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: TokenData = Depends(get_current_user)
):
    """List all notebooks for the authenticated user."""
    # Filter by user
    user_notebooks = [
        nb for nb in _notebooks.values()
        if nb["user_id"] == current_user.sub
    ]
    
    # Apply filters
    if status_filter:
        user_notebooks = [nb for nb in user_notebooks if nb["status"] == status_filter]
    if subject_filter:
        user_notebooks = [nb for nb in user_notebooks if subject_filter.lower() in nb["subject"].lower()]
    
    # Sort by created_at (newest first)
    user_notebooks.sort(key=lambda x: x["created_at"], reverse=True)
    
    # Paginate
    total = len(user_notebooks)
    paginated = user_notebooks[offset:offset + limit]
    
    return NotebookListResponse(
        notebooks=[
            NotebookListItem(
                notebook_id=nb["notebook_id"],
                subject=nb["subject"],
                status=nb["status"],
                created_at=nb["created_at"].isoformat(),
                updated_at=nb["updated_at"].isoformat()
            )
            for nb in paginated
        ],
        total=total,
        limit=limit,
        offset=offset
    )


@app.delete("/api/notebooks/{notebook_id}", response_model=NotebookDeleteResponse)
async def delete_notebook(
    notebook_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Delete a notebook."""
    if notebook_id not in _notebooks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notebook not found"
        )
    
    notebook = _notebooks[notebook_id]
    
    # Check ownership
    if notebook["user_id"] != current_user.sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Delete notebook files
    import shutil
    notebook_path = Path(notebook["notebook_path"])
    if notebook_path.exists():
        shutil.rmtree(notebook_path)
    
    # Remove from storage
    del _notebooks[notebook_id]
    
    return NotebookDeleteResponse(
        notebook_id=notebook_id,
        status="deleted",
        deleted_at=datetime.now(timezone.utc).isoformat()
    )


# Helper functions
def _extract_agent_response(response) -> str:
    """Extract text response from agent response."""
    if isinstance(response, str):
        return response
    
    if isinstance(response, list):
        text_parts = []
        for event in response:
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts'):
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            text_parts.append(part.text.strip())
        if text_parts:
            return "\n".join(text_parts)
    
    if hasattr(response, 'content') and response.content:
        if hasattr(response.content, 'parts'):
            text_parts = []
            for part in response.content.parts:
                if hasattr(part, 'text') and part.text:
                    text_parts.append(part.text.strip())
            if text_parts:
                return "\n".join(text_parts)
    
    return str(response)


def _convert_curriculum_to_config(curriculum: Dict[str, Any]) -> Dict[str, Any]:
    """Convert curriculum plan to notebook config format."""
    learning_path = curriculum.get("learning_path", {})
    topics = learning_path.get("topics", [])
    
    config = {
        "subject": curriculum.get("subject", "Unknown"),
        "description": f"Curriculum for {curriculum.get('subject', 'Unknown')}",
        "difficulty": curriculum.get("curriculum_metadata", {}).get("created_for", "intermediate"),
        "prerequisites": [],
        "content_depth": "intermediate",
        "include_progress_tracking": True,
        "include_cross_references": True,
        "output_format": "markdown",
        "topics": [
            {
                "name": topic.get("name", f"Topic {i+1}"),
                "description": topic.get("description", ""),
                "difficulty": topic.get("difficulty", "intermediate"),
                "estimated_time": topic.get("estimated_time", "2 hours"),
                "key_concepts": topic.get("key_concepts", []),
                "learning_objectives": topic.get("learning_objectives", []),
                "prerequisites": topic.get("prerequisites", []),
                "subtopics": []
            }
            for i, topic in enumerate(topics)
        ],
        "metadata": {
            "version": "1.0.0",
            "created_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "tags": []
        }
    }
    
    return config

@app.get("/api/notebooks/{notebook_id}/tree")
async def get_notebook_tree(
    notebook_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Get complete file tree structure for a notebook."""
    # Verify ownership
    # Get tree from GCS
    tree = gcs_storage.get_file_tree(current_user.sub, notebook_id)
    return {"tree": tree}

@app.get("/api/notebooks/{notebook_id}/files")
async def list_notebook_files(
    notebook_id: str,
    prefix: str = Query("", description="Directory prefix"),
    current_user: TokenData = Depends(get_current_user)
):
    """List files in a notebook directory."""
    files = gcs_storage.list_files(current_user.sub, notebook_id, prefix)
    return {"files": files}

@app.get("/api/notebooks/{notebook_id}/file")
async def get_notebook_file(
    notebook_id: str,
    file_path: str = Query(..., description="Relative file path"),
    current_user: TokenData = Depends(get_current_user)
):
    """Get file content."""
    content = gcs_storage.download_file(current_user.sub, notebook_id, file_path)
    return {"content": content, "path": file_path}

@app.get("/api/notebooks/{notebook_id}/file/url")
async def get_file_signed_url(
    notebook_id: str,
    file_path: str = Query(..., description="Relative file path"),
    current_user: TokenData = Depends(get_current_user)
):
    """Get signed URL for direct frontend access."""
    url = gcs_storage.generate_signed_url(
        current_user.sub, 
        notebook_id, 
        file_path
    )
    return {"url": url, "expires_in": 3600}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
