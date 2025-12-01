# LearnPad - AI Agents Capstone Project Writeup

**Track:** Agents for Good (Education)  
**Team Size:** Individual  
**Submission Date:** December 1, 2025

## Executive Summary

LearnPad is an adaptive learning platform that uses AI agents to generate personalized, structured study notebooks tailored to individual learning styles and experience levels. The system demonstrates three key course concepts: multi-agent architecture, custom tools, and session/state management.

## The Problem

Creating high-quality, personalized educational content is:
- **Time-intensive**: Hours of manual work per topic
- **One-size-fits-all**: Generic content doesn't adapt to individual needs
- **Inconsistent quality**: Varies by author and subject matter
- **Difficult to maintain**: Updates require extensive rework

Educators need a way to quickly generate comprehensive, personalized learning materials that adapt to each student's unique needs.

## The Solution

LearnPad uses a multi-agent system to automate the creation of complete study notebooks:

1. **User Assessment**: Conversational agent evaluates experience level and learning preferences
2. **Curriculum Planning**: Agent designs a structured learning path based on user profile
3. **Content Generation**: Loop agent iteratively generates educational content for each topic
4. **Storage & Delivery**: Content automatically uploaded to GCS and served via web interface

**Value Proposition:**
- Reduces notebook creation time from **hours to minutes**
- Generates **consistent, high-quality** educational content
- Adapts to **individual learning styles** (visual, hands-on, theoretical)
- Creates **progressive learning paths** that build on prior knowledge

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         LearnPad System                          │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │   Frontend   │ │   Backend    │ │    Agents    │
      │  (Next.js)   │ │  (FastAPI)   │ │ (ADK-based)  │
      │  Port 3000   │ │  Port 8001   │ │              │
      └──────────────┘ └──────────────┘ └──────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │   GCS Storage     │
                    │  (Notebooks)      │
                    └───────────────────┘
```

### Multi-Agent System

LearnPad uses **four specialized agents** working together:

1. **User Assessment Agent**
   - **Role**: Conversational assessment of user needs
   - **Tools**: Create user profile, store session state
   - **Pattern**: Stateful conversation with profile extraction

2. **Curriculum Planner Agent**
   - **Role**: Design structured learning paths
   - **Tools**: Generate curriculum, define topic sequences
   - **Pattern**: Structured output generation with prerequisites

3. **Content Generator Agent**
   - **Role**: Create educational content for topics
   - **Tools**: Gemini model, structured content templates
   - **Pattern**: Template-based content generation

4. **Notebook Loop Agent** (Primary Orchestrator)
   - **Role**: Coordinate the entire notebook generation process
   - **Tools**: All sub-agents + GCS storage tool
   - **Pattern**: Loop agent with iterative content generation

**Agent Flow:**
```
User Request
    │
    ▼
User Assessment Agent ──▶ User Profile
    │
    ▼
Curriculum Planner ──▶ Learning Path + Topics
    │
    ▼
Notebook Loop Agent ──▶ For each topic:
    │                      │
    │                      ▼
    │                   Content Generator ──▶ Markdown Content
    │                      │
    │                      ▼
    │                   GCS Storage Tool ──▶ Upload to GCS
    │
    ▼
Complete Notebook (10-20 files)
```

## Course Concepts Demonstrated

### 1. Agent Architecture (Multi-Agent System)

**Concept:** Specialized agents that collaborate on complex tasks

**Implementation:**
- **LLM Orchestrator Pattern**: Notebook Loop Agent coordinates sub-agents
- **Sequential Agent Pattern**: User Assessment → Curriculum → Generation
- **Loop Agent Pattern**: Iterative content generation for each topic

**Code Example:**
```python
# From src/agents/notebook_loop_agent/agent.py
def generate_notebook(
    subject: str,
    user_profile: str,
    learning_goals: str,
    ...
) -> str:
    # Step 1: Use curriculum planner to design structure
    curriculum = generate_complete_curriculum(
        subject=subject,
        user_profile=user_profile,
        ...
    )
    
    # Step 2: Loop through topics
    for topic in curriculum['topics']:
        # Step 3: Use content generator for each topic
        content = generate_section_content(
            topic=topic['name'],
            curriculum_context=curriculum,
            ...
        )
        
        # Step 4: Upload to GCS
        gcs_service.upload_file(
            user_id=user_id,
            notebook_id=notebook_id,
            file_path=f"sections/{topic['slug']}.md",
            content=content
        )
```

**Why This Approach:**
- **Separation of concerns**: Each agent has a single, clear responsibility
- **Easier to test**: Can test curriculum planning independently of content generation
- **Easier to improve**: Can upgrade content generator without touching assessment logic
- **Scalability**: Can add new agent types (quiz generator, video script writer) without changing existing agents

### 2. Tools (Custom & Built-in)

**Concept:** Agents use tools to take actions and interact with external systems

**Custom Tools Implemented:**

1. **Curriculum Generation Tool** (`generate_complete_curriculum`)
   - **Purpose**: Design learning paths with topic sequences
   - **Input**: User profile, subject, learning goals
   - **Output**: Structured curriculum JSON
   - **Location**: `src/agents/curriculum_planner/agent.py`

2. **Content Generation Tool** (`generate_section_content`)
   - **Purpose**: Generate educational markdown for topics
   - **Input**: Topic name, difficulty, context
   - **Output**: Structured markdown content
   - **Location**: `src/agents/content_generator/agent.py`

3. **GCS Storage Tool** (`GCSStorageService`)
   - **Purpose**: Persist notebook files to cloud storage
   - **Actions**: `upload_file`, `download_file`, `list_files`, `get_file_tree`
   - **Location**: `src/storage/gcs_storage.py`

**Built-in Tools Used:**
- **Gemini Models**: For content generation (via `google-genai`)
- **Code Execution**: For structured data extraction (parsing curriculum JSON)

**Code Example:**
```python
# Custom GCS storage tool
class GCSStorageService:
    def upload_file(
        self, 
        user_id: str, 
        notebook_id: str, 
        file_path: str, 
        content: str
    ) -> str:
        """Upload a markdown file to GCS."""
        gcs_path = f"users/{user_id}/notebooks/{notebook_id}/{file_path}"
        blob = self.bucket.blob(gcs_path)
        blob.upload_from_string(content, content_type="text/markdown")
        return gcs_path
```

**Why Custom Tools:**
- **Domain-specific actions**: GCS operations tailored for notebook structure
- **Reusability**: Same tools used across multiple agents
- **Type safety**: Structured inputs/outputs prevent errors
- **Testability**: Can mock tools for unit testing

### 3. Sessions & Memory (State Management)

**Concept:** Maintain context across multiple interactions

**Implementation:**

1. **Assessment Sessions**
   - **Storage**: In-memory dictionary `_assessment_sessions`
   - **Lifetime**: 24 hours (configurable TTL)
   - **State**: Conversation history, user profile, assessment status
   - **Location**: `src/api/server.py` (lines 1289-1507)

2. **Notebook Generation State**
   - **Storage**: In-memory dictionary `_notebooks`
   - **State**: Generation progress (0-100%), status (generating/complete/error)
   - **Location**: `src/api/server.py` (lines 1658-1737)

3. **Session Management Pattern**
   ```python
   # Start assessment session
   session_id = str(uuid.uuid4())
   _assessment_sessions[session_id] = {
       "session_id": session_id,
       "user_id": request.user_id,
       "conversation_history": [],
       "status": "in_progress",
       "profile": None,
       "expires_at": datetime.now() + timedelta(hours=24)
   }
   
   # Continue conversation
   session = _assessment_sessions[session_id]
   session["conversation_history"].append({
       "role": "user", 
       "content": message
   })
   ```

**Context Compaction:**
- Long conversations summarized to key facts (user profile)
- Only last 3 topics kept in context for content generation
- Reduces token usage and improves response quality

**Why This Approach:**
- **Stateful conversations**: Assessment agent remembers previous answers
- **Progress tracking**: Users can check notebook generation status
- **Resume capability**: Can continue where left off if disconnected
- **Cost efficiency**: Context compaction reduces token usage

## Implementation Highlights

### Technology Stack

- **Frontend**: Next.js 14, React, TailwindCSS, TypeScript
- **Backend**: FastAPI (Python), Pydantic for validation
- **AI/ML**: Google ADK, Vertex AI, Gemini 2.5 Flash
- **Storage**: Google Cloud Storage
- **Auth**: JWT tokens + Google OAuth

### Key Design Decisions

1. **GCS-First Architecture**
   - Files uploaded during generation, not after
   - Avoids large data transfers through API
   - Enables parallel file creation

2. **Placeholder Content for Local Testing**
   - Backend works without deployed agents
   - Generates structure with placeholder text
   - Perfect for testing GCS integration and API flow

3. **RESTful API Design**
   - Standard HTTP endpoints for notebook CRUD
   - Async generation with polling for status
   - File tree API for efficient navigation

4. **Hierarchical Storage Structure**
   ```
   gs://bucket/users/{user_id}/notebooks/{notebook_id}/
       ├── README.md
       ├── PROGRESS.md
       ├── topic_1/
       │   ├── README.md
       │   ├── topic_1.md
       │   └── subtopic_1/
       │       └── subtopic_1.md
       └── topic_2/
           └── ...
   ```

### Code Quality

- **Type hints** throughout Python codebase
- **Pydantic models** for request/response validation
- **Error handling** with structured error responses
- **Environment-based config** (no hardcoded credentials)
- **Docstrings** for all major functions and classes

## Local Testing Workflow

The complete system can be tested locally without deploying agents:

1. **Setup GCS authentication** (Application Default Credentials)
2. **Configure environment variables** (`.env` files)
3. **Start backend server** (`uvicorn server:app --port 8001`)
4. **Start frontend** (`npm run dev`)
5. **Generate notebook via UI** or direct API call
6. **Verify files in GCS** using `gsutil` or API endpoints

**Key Test Points:**
- ✓ Authentication works (Google OAuth → JWT tokens)
- ✓ Notebook generation triggered successfully
- ✓ Files uploaded to GCS (verified with `gsutil ls`)
- ✓ File tree API returns correct structure
- ✓ File content can be retrieved and displayed
- ✓ Frontend renders markdown properly

See **[LOCAL_TEST_WORKFLOW.md](LOCAL_TEST_WORKFLOW.md)** for complete testing instructions.

## Results & Impact

### Metrics

- **Generation Time**: ~2-5 minutes for complete notebook (vs. hours manually)
- **File Structure**: 10-20 markdown files per notebook
- **Content Quality**: Structured, consistent format with learning objectives, examples, and exercises
- **Storage**: Scalable cloud storage via GCS
- **Accessibility**: Web-based interface, accessible from any device

### User Experience

1. **Quick Assessment**: 3-5 minute conversation to understand needs
2. **Instant Generation**: Click button, get complete notebook in minutes
3. **Structured Learning**: Progressive topics that build on each other
4. **Easy Navigation**: File tree with topic hierarchy
5. **Portable**: Markdown files can be downloaded and used offline

### Educational Value

- **Personalization**: Content adapted to experience level (beginner/intermediate/advanced)
- **Progressive Learning**: Topics ordered by prerequisites
- **Comprehensive**: Covers learning objectives, key concepts, examples, exercises
- **Cross-references**: Links between related topics
- **Progress Tracking**: Built-in progress tracker for learning journey

## Challenges & Solutions

### Challenge 1: Config Object Type Issues

**Problem:** `self.config.subject` failed because config was a dict, not an object.

**Solution:** 
```python
config_dict = self.config if isinstance(self.config, dict) else {}
subject = config_dict.get('subject', 'Unknown')
```

Safely access dict keys with fallbacks.

### Challenge 2: Missing Helper Methods

**Problem:** `_analyze_content` and `_create_folder_structure` were referenced but not implemented.

**Solution:** Implemented simple versions:
```python
async def _analyze_content(self) -> Dict[str, Any]:
    """Extract topics from config and structure them."""
    config_dict = self.config if isinstance(self.config, dict) else {}
    return {
        "subject": config_dict.get("subject"),
        "topics": config_dict.get("topics", [])
    }
```

### Challenge 3: Agent Integration for Local Testing

**Problem:** Local testing requires agents, but deployment is optional for testing.

**Solution:** Backend returns placeholder content when agents unavailable:
```python
placeholder_text = (
    f"Content generation for topic '{topic['name']}' is not available "
    "without deployed agents. Provide your own notes or enable agents."
)
```

This allows testing the complete flow (API → GCS) without agent deployment.

## Future Enhancements

1. **Real-time Collaboration**: Multiple users editing same notebook
2. **Interactive Exercises**: Code execution sandboxes embedded in notebooks
3. **Quiz Generation**: Auto-generated quizzes based on content
4. **Voice Narration**: Text-to-speech for accessibility
5. **Video Script Generation**: Generate video tutorial scripts
6. **Multi-language Support**: Generate content in multiple languages
7. **Adaptive Difficulty**: Adjust content based on quiz performance
8. **Spaced Repetition**: Schedule review sessions based on forgetting curve

## Conclusion

LearnPad demonstrates the power of multi-agent AI systems for education. By combining specialized agents with custom tools and state management, we've created a system that can generate high-quality, personalized learning materials in minutes.

The three course concepts are deeply integrated:
- **Agent architecture** enables modular, maintainable design
- **Custom tools** provide domain-specific capabilities
- **Session management** enables stateful, conversational interactions

This project shows how AI agents can be used for social good, making quality education more accessible and personalized for learners worldwide.

## Resources

- **GitHub Repository**: [github.com/your-username/learnpad](https://github.com/your-username/learnpad)
- **Local Test Guide**: [LOCAL_TEST_WORKFLOW.md](LOCAL_TEST_WORKFLOW.md)
- **Architecture Docs**: [LOCAL_SETUP.md](LOCAL_SETUP.md)
- **GCS Setup**: [GCS_AUTH_SETUP.md](GCS_AUTH_SETUP.md)

---

**Submitted by:** [Your Name]  
**Date:** December 1, 2025  
**Track:** Agents for Good (Education)

