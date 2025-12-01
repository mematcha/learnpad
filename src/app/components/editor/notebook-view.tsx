'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mathematics from '@tiptap/extension-mathematics';
import { Play, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface NotebookViewProps {
  content?: string;
  className?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  python: 'Python',
  py: 'Python',
  ruby: 'Ruby',
  rb: 'Ruby',
  go: 'Go',
  golang: 'Go',
  java: 'Java',
  csharp: 'C#',
  cs: 'C#',
  cpp: 'C++',
  c: 'C',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  rust: 'Rust',
};

function getLanguageLabel(language?: string) {
  if (!language) return 'Plain Text';
  const normalized = language.toLowerCase();
  if (LANGUAGE_LABELS[normalized]) return LANGUAGE_LABELS[normalized];
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

interface CodeBlockState {
  id: string;
  code: string;
  language?: string;
  output?: string;
  isRunning: boolean;
  error?: string;
}

export function NotebookView({
  content = '',
  className,
}: NotebookViewProps) {
  const [codeBlocks, setCodeBlocks] = React.useState<Map<string, CodeBlockState>>(new Map());
  const containerRef = React.useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
          displayMode: false,
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'notebook-content',
          'focus:outline-none'
        ),
      },
    },
  });

  // Extract, track, and wrap code blocks
  React.useEffect(() => {
    if (!editor || !containerRef.current) return;

    const processCodeBlocks = () => {
      const preElements = containerRef.current?.querySelectorAll('pre code');
      const newCodeBlocks = new Map<string, CodeBlockState>();

      preElements?.forEach((element, index) => {
        const pre = element.closest('pre');
        if (!pre) return;

        // Skip if already processed
        if (pre.parentElement?.classList.contains('notebook-code-wrapper')) return;

        const codeId = `code-${index}-${Date.now()}`;
        const codeText = element.textContent || '';
        const language = element.className.match(/language-(\w+)/)?.[1] || 'javascript';

        // Set data attribute for identification
        pre.setAttribute('data-code-id', codeId);

        newCodeBlocks.set(codeId, {
          id: codeId,
          code: codeText,
          language,
          isRunning: false,
        });

        // Create wrapper container
        const wrapper = document.createElement('div');
        wrapper.className = 'notebook-code-wrapper';
        
        // Create menu bar
        const menuBar = document.createElement('div');
        menuBar.className = 'notebook-code-menu-bar';

        const languageLabel = document.createElement('span');
        languageLabel.className = 'notebook-code-language';
        languageLabel.textContent = getLanguageLabel(language);
        menuBar.appendChild(languageLabel);
        
        // Create run button container on the right
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'notebook-code-menu-actions';
        
        // Create run button
        const runButton = document.createElement('button');
        runButton.className = 'notebook-code-run-button';
        runButton.setAttribute('data-code-id', codeId);
        runButton.innerHTML = `
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Run</span>
        `;
        
        runButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          runCode(codeId, codeText, language);
        };

        // Create clear output button
        const clearButton = document.createElement('button');
        clearButton.className = 'notebook-code-clear-button';
        clearButton.setAttribute('data-code-id', codeId);
        clearButton.style.display = 'none'; // Initially hidden
        clearButton.innerHTML = `
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>Clear</span>
        `;
        
        clearButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          clearOutput(codeId);
        };

        buttonContainer.appendChild(runButton);
        buttonContainer.appendChild(clearButton);
        menuBar.appendChild(buttonContainer);
        
        // Wrap the pre element
        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(menuBar);
        wrapper.appendChild(pre);

        // Add output container below the code block
        const outputContainer = document.createElement('div');
        outputContainer.className = 'notebook-code-output';
        outputContainer.setAttribute('data-code-id', codeId);
        wrapper.appendChild(outputContainer);
      });

      setCodeBlocks(newCodeBlocks);
    };

    // Process after content is rendered
    const timeout = setTimeout(processCodeBlocks, 200);
    return () => clearTimeout(timeout);
  }, [editor, content]);

  const clearOutput = (codeId: string) => {
    setCodeBlocks(prev => {
      const updated = new Map(prev);
      const block = updated.get(codeId);
      if (block) {
        updated.set(codeId, {
          ...block,
          output: undefined,
          error: undefined,
        });
      }
      return updated;
    });
  };

  const runCode = async (codeId: string, code: string, language: string = 'javascript') => {
    setCodeBlocks(prev => {
      const updated = new Map(prev);
      const block = updated.get(codeId);
      if (block) {
        updated.set(codeId, {
          ...block,
          isRunning: true,
          output: undefined,
          error: undefined,
        });
      }
      return updated;
    });

    try {
      // Simulate code execution (similar to sandbox)
      await new Promise(resolve => setTimeout(resolve, 1000));

      let output = '';
      if (language === 'javascript' || language === 'typescript' || language === 'js') {
        output = `> Running ${language} code...\n> ${code.split('\n')[0] || 'Code executed'}\n> Execution completed successfully.`;
      } else if (language === 'python' || language === 'py') {
        output = `> Running Python code...\n> ${code.split('\n')[0] || 'Code executed'}\n> Process finished with exit code 0`;
      } else {
        output = `> ${language.toUpperCase()} code processed successfully.\n> Output would be displayed here in a real implementation.`;
      }

      setCodeBlocks(prev => {
        const updated = new Map(prev);
        const block = updated.get(codeId);
        if (block) {
          updated.set(codeId, {
            ...block,
            isRunning: false,
            output,
          });
        }
        return updated;
      });
    } catch (err) {
      setCodeBlocks(prev => {
        const updated = new Map(prev);
        const block = updated.get(codeId);
        if (block) {
          updated.set(codeId, {
            ...block,
            isRunning: false,
            error: 'An error occurred while running the code.',
          });
        }
        return updated;
      });
    }
  };


  // Update buttons and output when codeBlocks state changes
  React.useEffect(() => {
    if (!containerRef.current) return;

    codeBlocks.forEach((blockState, codeId) => {
      // Update run button state
      const runButton = containerRef.current?.querySelector(
        `.notebook-code-run-button[data-code-id="${codeId}"]`
      ) as HTMLButtonElement;
      
      if (runButton) {
        if (blockState.isRunning) {
          runButton.innerHTML = `
            <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Running...</span>
          `;
          runButton.disabled = true;
        } else {
          runButton.innerHTML = `
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Run</span>
          `;
          runButton.disabled = false;
        }
      }

      // Update clear button visibility
      const clearButton = containerRef.current?.querySelector(
        `.notebook-code-clear-button[data-code-id="${codeId}"]`
      ) as HTMLButtonElement;
      
      if (clearButton) {
        if (blockState.output || blockState.error) {
          clearButton.style.display = 'flex';
        } else {
          clearButton.style.display = 'none';
        }
      }

      // Update output
      const outputContainer = containerRef.current?.querySelector(
        `.notebook-code-output[data-code-id="${codeId}"]`
      );
      
      if (outputContainer) {
        if (blockState.error) {
          outputContainer.className = 'notebook-code-output text-destructive';
          outputContainer.innerHTML = `<pre class="text-sm font-mono whitespace-pre-wrap">Error: ${blockState.error}</pre>`;
        } else if (blockState.output) {
          outputContainer.className = 'notebook-code-output';
          outputContainer.innerHTML = `<pre class="text-sm font-mono whitespace-pre-wrap text-foreground">${blockState.output}</pre>`;
        } else {
          outputContainer.innerHTML = '';
        }
      }
    });
  }, [codeBlocks]);

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);


  if (!editor) {
    return (
      <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('max-w-3xl mx-auto px-6 py-8', className)}>
      <EditorContent
        editor={editor}
        className="focus:outline-none"
      />
    </div>
  );
}

