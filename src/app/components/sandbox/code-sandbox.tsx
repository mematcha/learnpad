'use client';

import * as React from 'react';
import { Play, Square, RotateCcw, Download, Settings, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CodeEditor, type Language } from './code-editor';
import { cn } from '@/lib/utils';

interface CodeSandboxProps {
  className?: string;
  initialCode?: string;
  initialLanguage?: Language;
}

const languageTemplates: Record<Language, string> = {
  javascript: `// Welcome to the JavaScript sandbox!
console.log('Hello, Learnpad!');

// Try some basic operations
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled numbers:', doubled);

// Function example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci(10):', fibonacci(10));`,

  typescript: `// Welcome to the TypeScript sandbox!
interface User {
  name: string;
  age: number;
  email?: string;
}

const user: User = {
  name: 'Alice',
  age: 30,
  email: 'alice@example.com'
};

function greetUser(user: User): string {
  return \`Hello, \${user.name}! You are \${user.age} years old.\`;
}

console.log(greetUser(user));

// Generic function example
function identity<T>(arg: T): T {
  return arg;
}

console.log(identity<string>('Hello TypeScript!'));`,

  python: `# Welcome to the Python sandbox!
print("Hello, Learnpad!")

# List comprehension example
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print(f"Doubled numbers: {doubled}")

# Function example
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(f"Fibonacci(10): {fibonacci(10)}")

# Class example
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def greet(self):
        return f"Hello, I'm {self.name} and I'm {self.age} years old."

person = Person("Alice", 30)
print(person.greet())`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learnpad HTML Sandbox</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .highlight {
            background-color: #f0f8ff;
            padding: 10px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>Welcome to Learnpad!</h1>
    <p>This is an interactive HTML sandbox where you can experiment with web technologies.</p>
    
    <div class="highlight">
        <h2>Features</h2>
        <ul>
            <li>Real-time HTML editing</li>
            <li>CSS styling support</li>
            <li>JavaScript integration</li>
        </ul>
    </div>
    
    <button onclick="alert('Hello from Learnpad!')">Click me!</button>
</body>
</html>`,

  css: `/* Welcome to the CSS sandbox! */
body {
  font-family: 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  border-radius: 10px;
  color: white;
  text-align: center;
}

.card {
  background: white;
  color: #333;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.button {
  background: #4f46e5;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.button:hover {
  background: #4338ca;
}`,

  json: `{
  "name": "learnpad-project",
  "version": "1.0.0",
  "description": "A sample JSON configuration for Learnpad",
  "author": {
    "name": "Learnpad User",
    "email": "user@learnpad.com"
  },
  "settings": {
    "theme": "dark",
    "autoSave": true,
    "fontSize": 14,
    "tabSize": 2
  },
  "features": [
    "syntax-highlighting",
    "auto-completion",
    "error-detection",
    "multi-language-support"
  ],
  "metadata": {
    "created": "2024-01-01T00:00:00Z",
    "lastModified": "2024-01-01T12:00:00Z",
    "tags": ["learning", "coding", "education"]
  }
}`,

  markdown: `# Welcome to Learnpad Markdown Sandbox

This is a **markdown** editor where you can practice writing documentation, notes, and formatted text.

## Features

- **Bold** and *italic* text
- [Links](https://learnpad.com)
- Lists and tables
- Code blocks and syntax highlighting

### Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('Learnpad'));
\`\`\`

### Lists

1. First item
2. Second item
3. Third item

- Bullet point
- Another point
- Final point

### Table

| Feature | Status | Notes |
|---------|--------|-------|
| Editor | ✅ | Working |
| Preview | ✅ | Real-time |
| Export | 🚧 | In progress |

### Math (LaTeX)

You can also include mathematical notation:

$$E = mc^2$$

Inline math: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

> This is a blockquote with important information about using Learnpad effectively.

---

Happy learning! 🚀`,
};

export function CodeSandbox({ 
  className, 
  initialCode,
  initialLanguage = 'javascript' 
}: CodeSandboxProps) {
  const [language, setLanguage] = React.useState<Language>(initialLanguage);
  const [code, setCode] = React.useState(
    initialCode || languageTemplates[initialLanguage]
  );
  const [output, setOutput] = React.useState<string>('');
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Update code when language changes
  React.useEffect(() => {
    if (!initialCode) {
      setCode(languageTemplates[language]);
    }
  }, [language, initialCode]);

  const runCode = async () => {
    setIsRunning(true);
    setError(null);
    setOutput('');

    try {
      // Simulate code execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (language === 'javascript' || language === 'typescript') {
        // Simulate JavaScript execution
        setOutput(`> Running ${language} code...
> Hello, Learnpad!
> Doubled numbers: [2, 4, 6, 8, 10]
> Fibonacci(10): 55
> Execution completed successfully.`);
      } else if (language === 'python') {
        setOutput(`> Running Python code...
> Hello, Learnpad!
> Doubled numbers: [2, 4, 6, 8, 10]
> Fibonacci(10): 55
> Hello, I'm Alice and I'm 30 years old.
> Process finished with exit code 0`);
      } else {
        setOutput(`> ${language.toUpperCase()} code processed successfully.
> Output would be displayed here in a real implementation.`);
      }
    } catch (err) {
      setError('An error occurred while running the code.');
    } finally {
      setIsRunning(false);
    }
  };

  const stopExecution = () => {
    setIsRunning(false);
    setOutput(prev => prev + '\n> Execution stopped by user.');
  };

  const resetCode = () => {
    setCode(languageTemplates[language]);
    setOutput('');
    setError(null);
  };

  const downloadCode = () => {
    const extensions: Record<Language, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'md',
    };

    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extensions[language]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-4 h-full', className)}>
      {/* Editor Panel */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Code Editor</CardTitle>
            
            <div className="flex items-center space-x-2">
              <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={resetCode}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset to template</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={downloadCode}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            height="100%"
            className="border-0 rounded-none"
          />
        </CardContent>
      </Card>

      {/* Output Panel */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Terminal className="h-5 w-5 mr-2" />
              Output
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={isRunning ? stopExecution : runCode}
                      disabled={!code.trim()}
                      variant={isRunning ? "destructive" : "default"}
                      size="sm"
                    >
                      {isRunning ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Run
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isRunning ? 'Stop execution' : 'Run code'}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Execution settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 font-mono text-sm">
              {isRunning && (
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span>Executing...</span>
                </div>
              )}
              
              {error && (
                <div className="text-destructive mb-2">
                  <strong>Error:</strong> {error}
                </div>
              )}
              
              {output ? (
                <pre className="whitespace-pre-wrap text-foreground">
                  {output}
                </pre>
              ) : !isRunning && (
                <div className="text-muted-foreground italic">
                  Click "Run" to execute your code and see the output here.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
