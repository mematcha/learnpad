"""Test script to verify multi-agent orchestration works."""
import asyncio
import os
import sys
from pathlib import Path
from google.adk.runners import InMemoryRunner
from dotenv import load_dotenv
load_dotenv()
# Set API key if not already set
src_path = Path(__file__).parent.parent
sys.path.insert(0, str(src_path))

if not os.getenv("GOOGLE_API_KEY"):
    print("⚠️  Set GOOGLE_API_KEY environment variable")
    exit(1)

from agents.teacher.agent import root_agent

async def test_learning_request():
    """Test: Student wants to learn a concept → should delegate to ConceptExplainerAgent"""
    runner = InMemoryRunner(agent=root_agent)
    response = await runner.run_debug(
        "I want to learn about Python loops. Can you explain them?"
    )
    print("\n" + "="*60)
    print("TEST 1: Learning Request")
    print("="*60)
    print(response)
    return response

async def test_code_review():
    """Test: Student submits code → should delegate to CodeReviewerAgent"""
    runner = InMemoryRunner(agent=root_agent)
    response = await runner.run_debug(
        """Please review this code:
        def add(a, b):
            return a + b
        """
    )
    print("\n" + "="*60)
    print("TEST 2: Code Review Request")
    print("="*60)
    print(response)
    return response

async def test_assessment():
    """Test: Student needs practice → should delegate to AssessmentCheckerAgent"""
    runner = InMemoryRunner(agent=root_agent)
    response = await runner.run_debug(
        "I need practice exercises on Python functions"
    )
    print("\n" + "="*60)
    print("TEST 3: Assessment Request")
    print("="*60)
    print(response)
    return response

async def main():
    """Run all orchestration tests."""
    print("🚀 Testing Multi-Agent Orchestration\n")
    
    await test_learning_request()
    await test_code_review()
    await test_assessment()
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())