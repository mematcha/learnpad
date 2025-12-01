# learnpad
Learnpad is a L4-level adaptive learning system that delivers fully personalized, notebook-based educational content. It blends notebooks, interactive sandboxes and agentic teaching loops that evolve as the user learns.

## Architecture

LearnPad uses a microservices architecture with AI agents deployed to Vertex AI Agent Engine:

```
┌─────────────────┐    HTTP API    ┌─────────────────┐    HTTP API    ┌─────────────────────┐
│   Next.js App   │───────────────▶│  FastAPI Server │──────────────▶│  Vertex AI Agent    │
│   (Port 3000)   │                │   (Port 8001)    │               │  Engine (Cloud)     │
│                 │                │                  │               │                     │
│                 │                │  ✅ No agent     │               │  • user_assessment  │
│                 │                │     imports      │               │  • curriculum_plan  │
│                 │                │                  │               │  • content_gen      │
│                 │                │                  │               │  • notebook_loop    │
└─────────────────┘                └─────────────────┘               └─────────────────────┘
```

**Components:**
- **FastAPI Server** (Port 8001): REST API server, handles auth, storage, and business logic
- **Vertex AI Agent Engine**: Hosts AI agents as managed services in Google Cloud  
- **Next.js Frontend** (Port 3000): React-based user interface

See [AGENT_DEPLOYMENT.md](AGENT_DEPLOYMENT.md) for deployment instructions.