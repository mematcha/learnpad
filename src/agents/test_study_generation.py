# test_study_generator.py
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from agents.study_notes_generator.notebook_generator import NotebookGenerator

# Test initialization
config_path = Path("src/agents/study_notes_generator/examples/python_programming.json")
generator = NotebookGenerator(str(config_path), output_dir="test_output")

print("✅ NotebookGenerator imported and initialized successfully!")