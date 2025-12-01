# Next Steps: Testing Your Integration

Your agents are deployed and the API is integrated! Here's exactly what to do now.

## 🚀 Quick Test (5 minutes)

### Step 1: Set Environment Variables

```bash
cd /Users/smatcha/Documents/Serious\ Projects/learnpad

# Create or update src/api/.env
cat > src/api/.env << 'EOF'
# Vertex AI Agent Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
NOTEBOOK_ENGINE_ID=6990268318888230912
AGENT_APP_NAME=notebook_orchestrator

# GCS Configuration
GCS_BUCKET_NAME=your-learnpad-notebooks-bucket

# Add your other existing environment variables below
# JWT_SECRET_KEY=...
# GOOGLE_CLIENT_ID=...
EOF

# Update with your actual project details
nano src/api/.env  # or use your preferred editor
```

### Step 2: Ensure Authentication

```bash
# Make sure you're authenticated
gcloud auth application-default login

# Verify your project
gcloud config get-value project
```

### Step 3: Start the API Server

```bash
cd src/api

# Install/verify dependencies
pip install google-adk google-cloud-aiplatform google-genai

# Start the server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Expected output:**
```
🔗 Configuring Vertex AI Agent Engine endpoints...
✅ Vertex AI Agent Engine client configured
🔗 Initializing ADK-based Notebook Engine...
✅ Notebook Engine initialized with Agent Engine ID: 6990268318888230912
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Step 4: Test the Endpoint

**Option A: Simple curl test** (in a new terminal):

```bash
# Test health check
curl http://localhost:8001/health

# Test notebook generation (you'll need a valid JWT token)
curl -X POST http://localhost:8001/api/notebooks/generate-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_id": "test-user",
    "notebook_id": "test-notebook-001",
    "subject": "Python Basics",
    "user_profile": {
      "experience_level": "beginner",
      "learning_style": "hands_on"
    },
    "learning_goals": "Learn Python programming fundamentals",
    "user_experience_level": "beginner",
    "learning_style": "hands_on"
  }'
```

**Option B: Use the test script** (if auth is not strictly required):

```bash
cd src/api
python test_notebook_generation.py
```

### Step 5: Verify GCS Files

```bash
# Check that files were created
gsutil ls gs://your-learnpad-notebooks-bucket/users/test-user/notebooks/test-notebook-001/sections/

# Download and view a file
gsutil cat gs://your-learnpad-notebooks-bucket/users/test-user/notebooks/test-notebook-001/sections/01_*.md
```

---

## 🔧 Troubleshooting

### If you see: "Notebook Engine not initialized"

```bash
# Make sure NOTEBOOK_ENGINE_ID is in your .env
echo "NOTEBOOK_ENGINE_ID=6990268318888230912" >> src/api/.env

# Restart the API server
```

### If you see: "Module not found: agents.notebook_loop_agent"

```bash
# The import path issue needs fixing - switch to agent mode and I'll fix it
# Or manually fix the imports in src/agents/notebook_loop_agent/agent.py
```

### If you see: "Authentication failed"

```bash
# Re-authenticate
gcloud auth application-default login

# Or set service account explicitly
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

### If the agent call times out

This is expected for the first call (can take 30-60 seconds). The agent is:
1. Designing a curriculum structure
2. Generating content for each section
3. Uploading files to GCS

---

## 📋 Full Integration Checklist

### Pre-requisites
- [x] Agents deployed (Engine ID: 6990268318888230912) ✅
- [ ] Environment variables configured in `src/api/.env`
- [ ] Google Cloud authentication set up
- [ ] GCS bucket created and accessible
- [ ] Dependencies installed (`google-adk`, etc.)

### Testing
- [ ] API server starts without errors
- [ ] Notebook Engine initialization message appears
- [ ] `/api/notebooks/generate-v2` endpoint responds
- [ ] Test request completes successfully
- [ ] Files appear in GCS bucket
- [ ] Response contains file metadata and curriculum

### Next Phase
- [ ] Update frontend to use new endpoint
- [ ] Add error handling UI
- [ ] Implement progress tracking
- [ ] Set up monitoring/logging
- [ ] Add caching for common subjects

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| [AGENT_DEPLOYMENT.md](AGENT_DEPLOYMENT.md) | How to deploy agents |
| [src/api/QUICK_START.md](src/api/QUICK_START.md) | API setup and testing |
| [src/api/AGENT_INTEGRATION.md](src/api/AGENT_INTEGRATION.md) | Integration patterns |
| [API_INTEGRATION_SUMMARY.md](API_INTEGRATION_SUMMARY.md) | What was integrated |

---

## 🎯 Immediate Next Actions

1. **Right now**: Test the endpoint using one of the methods above
2. **Today**: Verify files in GCS and check content quality
3. **This week**: Update frontend to call `/api/notebooks/generate-v2`
4. **Next week**: Add progress tracking and error handling

---

## 💡 Tips

### For Development
- Keep the API server running with `--reload` for auto-restart on code changes
- Check API logs for detailed error messages
- Use GCP Console to view agent execution logs

### For Production
- Use a service account with minimal permissions
- Set up proper JWT authentication
- Add rate limiting per user
- Implement caching for curriculum plans
- Set up monitoring and alerts in GCP

### Cost Optimization
- Cache curriculum plans (they're expensive to generate)
- Batch similar notebook requests
- Use cheaper models if acceptable (`gemini-1.5-flash` vs `gemini-2.5-flash`)
- Set quotas to prevent runaway costs

---

## ❓ Need Help?

If you run into issues:

1. Check the **Troubleshooting** section in [AGENT_DEPLOYMENT.md](AGENT_DEPLOYMENT.md)
2. Review API logs for error details
3. Check GCP Console → Vertex AI → Agent Engines → Logs
4. Verify environment variables are set correctly

---

**Ready to test? Start with Step 1 above!** 🚀

