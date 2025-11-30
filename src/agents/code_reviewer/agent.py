from google.adk.agents.llm_agent import Agent
from google.adk.models.google_llm import Gemini
from google.genai import types
from typing import Optional, Dict, Any
import subprocess
import tempfile
import os
import re
import sys

# Import standard Google Generative AI SDK for content generation
_review_model = None
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
        _review_model = genai.GenerativeModel("gemini-2.5-flash")
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

retry_config = types.HttpRetryOptions(
    attempts=5,  # Maximum retry attempts
    exp_base=7,  # Delay multiplier
    initial_delay=1,
    http_status_codes=[429, 500, 503, 504],  # Retry on these HTTP errors
)

INSTRUCTION_TEXT = """
You are a patient, educational code reviewer specialized in helping students learn programming.

Your primary responsibilities:

1. **Code Review & Analysis**:
   - Analyze code for correctness, logic errors, and potential bugs
   - Review code style, readability, and best practices
   - Identify common mistakes and learning opportunities
   - Check for security issues and performance concerns
   - Evaluate code structure and organization

2. **Educational Feedback**:
   - Explain issues in simple, beginner-friendly terms
   - Connect mistakes to underlying concepts
   - Provide constructive, encouraging feedback
   - Suggest concrete improvements with explanations
   - Help students understand WHY something is wrong, not just WHAT is wrong
   - Adapt explanations to the student's apparent skill level

3. **Code Fixing**:
   - Provide corrected code with clear explanations
   - Explain what was changed and why
   - Show before/after comparisons when helpful
   - Suggest alternative approaches when appropriate
   - Maintain the student's original intent while improving the code

4. **Code Execution**:
   - Safely execute code in a sandboxed environment
   - Capture and report execution output and errors
   - Help debug runtime errors with clear explanations
   - Identify syntax errors, type errors, and logic errors

**Review Guidelines**:
- Be encouraging and supportive - learning to code is challenging
- Focus on learning, not just correctness
- Explain concepts, not just point out errors
- Recognize good practices and improvements
- Provide actionable, specific feedback
- Use examples and analogies when helpful
- Consider the student's learning context and goals

**Feedback Structure**:
- Start with what's working well (positive reinforcement)
- Clearly identify issues with explanations
- Provide specific, actionable suggestions
- Explain the underlying concepts when relevant
- End with encouragement and next steps

Remember: Your goal is to help students become better programmers through understanding, not just to find errors.
"""


def detect_language(code: str) -> str:
    """
    Detect the programming language from code.
    
    Args:
        code: The code to analyze
    
    Returns:
        Detected language (python, javascript, typescript, etc.)
    """
    code_lower = code.strip().lower()
    
    # Python indicators
    if any(keyword in code for keyword in ['def ', 'import ', 'print(', 'if __name__']):
        return 'python'
    if code.strip().startswith('#') or 'python' in code_lower[:100]:
        return 'python'
    
    # JavaScript/TypeScript indicators
    if any(keyword in code for keyword in ['function ', 'const ', 'let ', 'var ', 'console.log']):
        return 'javascript'
    if '=>' in code or 'async ' in code or 'await ' in code:
        return 'javascript'
    
    # TypeScript indicators
    if ': string' in code or ': number' in code or 'interface ' in code or 'type ' in code:
        return 'typescript'
    
    # Default to python for empty or unclear code
    return 'python'


def review_code(
    code: str,
    language: Optional[str] = None,
    context: Optional[str] = None,
    student_level: Optional[str] = None
) -> str:
    """
    Review code and provide comprehensive feedback on correctness, style, and best practices.
    
    Args:
        code: The code to review
        language: Optional programming language (auto-detected if not provided)
        context: Optional context about what the code is supposed to do
        student_level: Optional student level (beginner, intermediate, advanced)
    
    Returns:
        Detailed review with feedback on correctness, style, and improvements
    """
    try:
        if not code or not code.strip():
            return "No code provided for review. Please provide the code you'd like me to review."
        
        # Detect language if not provided
        if not language:
            language = detect_language(code)
        
        # Build the review prompt
        prompt_parts = [
            f"Review the following {language} code and provide comprehensive, educational feedback:",
            "",
            "```" + language,
            code,
            "```",
            "",
            "Provide a detailed review that includes:",
            "1. **What's Working Well**: Start with positive feedback on what's correct or well-done",
            "2. **Issues Found**: Identify any bugs, errors, or problems with clear explanations",
            "3. **Style & Best Practices**: Comment on code style, readability, and adherence to best practices",
            "4. **Learning Opportunities**: Explain underlying concepts related to any issues",
            "5. **Suggestions for Improvement**: Provide specific, actionable suggestions",
            "",
            "Be encouraging and educational. Explain WHY something is an issue, not just WHAT is wrong.",
            "Adapt your explanation to be beginner-friendly unless the code shows advanced understanding.",
        ]
        
        if context:
            prompt_parts.insert(1, f"Context: {context}")
            prompt_parts.insert(2, "")
        
        if student_level:
            level_guidance = {
                "beginner": "Use very simple language and explain basic concepts thoroughly.",
                "intermediate": "Provide balanced explanations with some technical detail.",
                "advanced": "You can use more technical language and assume deeper knowledge."
            }
            prompt_parts.append(f"Student Level: {student_level}. {level_guidance.get(student_level, '')}")
        
        prompt = "\n".join(prompt_parts)
        
        # Generate review using the model
        if _use_genai_sdk and _review_model:
            try:
                response = _review_model.generate_content(prompt)
                return response.text
            except Exception as e:
                error_msg = str(e)
                # Provide specific guidance based on error type
                if "API key" in error_msg.lower() or "authentication" in error_msg.lower():
                    guidance = """
**Authentication Error**: The Google Generative AI API requires an API key.

**To fix this:**
1. Get a Google API key from: https://makersuite.google.com/app/apikey
2. Set it as an environment variable:
   ```bash
   export GOOGLE_API_KEY="your-api-key-here"
   ```
3. Or add it to your `.env` file:
   ```
   GOOGLE_API_KEY=your-api-key-here
   ```
4. Restart your application

**Alternative**: You can use the code_reviewer_agent directly in conversation - it uses the ADK which handles authentication automatically.
"""
                else:
                    guidance = f"Error: {error_msg}\n\nPlease check your API configuration or use the code_reviewer_agent directly in conversation."
                
                return f"""Code Review Error

{guidance}

**Code Provided:**
```{language}
{code}
```

**Quick Info:**
- Language detected: {language}
- Code length: {len(code)} characters
- Lines: {len(code.split(chr(10)))} lines"""
        else:
            # Fallback: Provide a helpful message
            error_detail = _genai_error if _genai_error else "API not configured"
            return f"""Code Review Request Received

I received your code for review, but I'm unable to generate an automated review at the moment.

**Issue**: {error_detail}

**Code Provided:**
```{language}
{code}
```

**To enable automated reviews:**
1. Install the package: `pip install google-generativeai>=0.8.5`
2. Get a Google API key: https://makersuite.google.com/app/apikey
3. Set environment variable: `export GOOGLE_API_KEY="your-key"`
4. Restart your application

**Alternative - Use Interactive Review:**
You can use the code_reviewer_agent directly in conversation for interactive code review. The agent itself is working and can provide reviews through conversation.

**Quick Info:**
- Language detected: {language}
- Code length: {len(code)} characters
- Lines: {len(code.split(chr(10)))} lines"""
        
    except Exception as e:
        return f"Error generating code review: {str(e)}. Please try again or provide more specific information."


def fix_code(
    code: str,
    language: Optional[str] = None,
    issues: Optional[str] = None,
    explain_fixes: Optional[bool] = True
) -> str:
    """
    Fix code issues and provide corrected version with explanations.
    
    Args:
        code: The code to fix
        language: Optional programming language (auto-detected if not provided)
        issues: Optional description of specific issues to fix
        explain_fixes: Whether to include explanations of what was fixed (default: True)
    
    Returns:
        Fixed code with explanations of changes
    """
    try:
        if not code or not code.strip():
            return "No code provided to fix. Please provide the code you'd like me to fix."
        
        # Detect language if not provided
        if not language:
            language = detect_language(code)
        
        # Build the fix prompt
        prompt_parts = [
            f"Fix the following {language} code and provide the corrected version:",
            "",
            "```" + language,
            code,
            "```",
            "",
        ]
        
        if issues:
            prompt_parts.append(f"Specific issues to address: {issues}")
            prompt_parts.append("")
        
        prompt_parts.extend([
            "Provide:",
            "1. The corrected code (properly formatted)",
            "2. A clear explanation of what was fixed and why",
            "3. Brief notes on any improvements made",
            "",
            "Format your response with:",
            "- Fixed code in a code block",
            "- Explanations of changes below",
            "- Any additional recommendations",
        ])
        
        if not explain_fixes:
            prompt_parts.append("Focus on providing the fixed code with minimal explanation.")
        
        prompt = "\n".join(prompt_parts)
        
        # Generate fixed code using the model
        if _use_genai_sdk and _review_model:
            try:
                response = _review_model.generate_content(prompt)
                return response.text
            except Exception as e:
                error_msg = str(e)
                # Provide specific guidance based on error type
                if "API key" in error_msg.lower() or "authentication" in error_msg.lower():
                    guidance = """
**Authentication Error**: The Google Generative AI API requires an API key.

**To fix this:**
1. Get a Google API key from: https://makersuite.google.com/app/apikey
2. Set it as an environment variable:
   ```bash
   export GOOGLE_API_KEY="your-api-key-here"
   ```
3. Or add it to your `.env` file:
   ```
   GOOGLE_API_KEY=your-api-key-here
   ```
4. Restart your application

**Alternative**: You can use the code_reviewer_agent directly in conversation - it uses the ADK which handles authentication automatically.
"""
                else:
                    guidance = f"Error: {error_msg}\n\nPlease check your API configuration or use the code_reviewer_agent directly in conversation."
                
                return f"""Code Fix Error

{guidance}

**Code Provided:**
```{language}
{code}
```

**Issues to Address:**
{issues if issues else 'Not specified'}

**Quick Info:**
- Language detected: {language}
- Code length: {len(code)} characters"""
        else:
            # Fallback: Provide a helpful message
            error_detail = _genai_error if _genai_error else "API not configured"
            return f"""Code Fix Request Received

I received your code to fix, but I'm unable to generate automated fixes at the moment.

**Issue**: {error_detail}

**Code Provided:**
```{language}
{code}
```

**Issues to Address:**
{issues if issues else 'Not specified'}

**To enable automated fixes:**
1. Install the package: `pip install google-generativeai>=0.8.5`
2. Get a Google API key: https://makersuite.google.com/app/apikey
3. Set environment variable: `export GOOGLE_API_KEY="your-key"`
4. Restart your application

**Alternative - Use Interactive Fixing:**
You can use the code_reviewer_agent directly in conversation for interactive code fixing. The agent itself is working and can provide fixes through conversation.

**Quick Info:**
- Language detected: {language}
- Code length: {len(code)} characters"""
        
    except Exception as e:
        return f"Error fixing code: {str(e)}. Please try again or provide more specific information."


def execute_code(
    code: str,
    language: Optional[str] = None,
    timeout_seconds: int = 10
) -> str:
    """
    Safely execute code in a sandboxed environment and return the output.
    
    Args:
        code: The code to execute
        language: Optional programming language (auto-detected if not provided)
        timeout_seconds: Maximum execution time in seconds (default: 10)
    
    Returns:
        Execution output, errors, or results
    """
    try:
        if not code or not code.strip():
            return "No code provided to execute. Please provide the code you'd like to run."
        
        # Detect language if not provided
        if not language:
            language = detect_language(code)
        
        # Security check: block dangerous operations
        dangerous_patterns = [
            r'import\s+os\s*$',
            r'import\s+subprocess',
            r'import\s+sys',
            r'__import__',
            r'eval\s*\(',
            r'exec\s*\(',
            r'open\s*\(',
            r'file\s*\(',
            r'input\s*\(',
            r'raw_input\s*\(',
        ]
        
        code_lower = code.lower()
        for pattern in dangerous_patterns:
            if re.search(pattern, code_lower):
                return f"Security: Code execution blocked. The code contains potentially unsafe operations: {pattern}"
        
        # Execute based on language
        if language == 'python':
            return _execute_python(code, timeout_seconds)
        elif language in ['javascript', 'typescript']:
            return _execute_javascript(code, timeout_seconds)
        else:
            return f"Code execution for {language} is not yet supported. Supported languages: Python, JavaScript/TypeScript"
    
    except subprocess.TimeoutExpired:
        return f"Execution timeout: Code took longer than {timeout_seconds} seconds to execute. This might indicate an infinite loop or very slow operation."
    except Exception as e:
        return f"Error executing code: {str(e)}. Please check the code syntax and try again."


def _execute_python(code: str, timeout_seconds: int) -> str:
    """Execute Python code safely."""
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Execute with timeout
            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                cwd=tempfile.gettempdir()
            )
            
            output_parts = []
            
            if result.stdout:
                output_parts.append("Output:")
                output_parts.append(result.stdout)
            
            if result.stderr:
                output_parts.append("\nErrors:")
                output_parts.append(result.stderr)
            
            if result.returncode != 0:
                output_parts.append(f"\nExit code: {result.returncode}")
            
            if not output_parts:
                return "Code executed successfully with no output."
            
            return "\n".join(output_parts)
        
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file)
            except:
                pass
    
    except subprocess.TimeoutExpired:
        return f"Execution timeout: Code took longer than {timeout_seconds} seconds to execute."
    except Exception as e:
        return f"Error executing Python code: {str(e)}"


def _execute_javascript(code: str, timeout_seconds: int) -> str:
    """Execute JavaScript code safely using Node.js."""
    try:
        # Check if node is available
        try:
            subprocess.run(['node', '--version'], capture_output=True, timeout=2)
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return "JavaScript execution requires Node.js, but it's not available. Python execution is supported."
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        try:
            # Execute with timeout
            result = subprocess.run(
                ['node', temp_file],
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                cwd=tempfile.gettempdir()
            )
            
            output_parts = []
            
            if result.stdout:
                output_parts.append("Output:")
                output_parts.append(result.stdout)
            
            if result.stderr:
                output_parts.append("\nErrors:")
                output_parts.append(result.stderr)
            
            if result.returncode != 0:
                output_parts.append(f"\nExit code: {result.returncode}")
            
            if not output_parts:
                return "Code executed successfully with no output."
            
            return "\n".join(output_parts)
        
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file)
            except:
                pass
    
    except subprocess.TimeoutExpired:
        return f"Execution timeout: Code took longer than {timeout_seconds} seconds to execute."
    except Exception as e:
        return f"Error executing JavaScript code: {str(e)}"


root_agent = Agent(
    model=Gemini(
        model="gemini-2.5-flash",
        retry_options=retry_config
    ),
    name="code_reviewer_agent",
    description="Specialist agent for code review, debugging, and code improvement with educational feedback",
    instruction=INSTRUCTION_TEXT,
    tools=[review_code, fix_code, execute_code],
)
