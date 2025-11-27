'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout';
import { NotebookView } from '@/components/editor/notebook-view';
import { NotebookEditor } from '@/components/editor/notebook-editor';
import { Button } from '@/components/ui/button';
import { Eye, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatInterface } from '@/components/ai/chat-interface';

const notebookContent = `
  <h1>Welcome to Learnpad</h1>
  <p>This is your interactive notebook. You can read your learning materials here with clean, readable formatting.</p>
  
  <h2>Getting Started</h2>
  <p>This notebook view is optimized for reading and comprehension. The content is displayed with:</p>
  <ul>
    <li>Clear typography and spacing</li>
    <li>Mathematical notation support</li>
    <li>Code blocks with syntax highlighting</li>
    <li>Responsive layout for all devices</li>
  </ul>
  
  <h2>Mathematical Expressions</h2>
  <p>You can include mathematical formulas using LaTeX notation. For example, the quadratic formula:</p>
  <p class="math-node">$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$</p>
  
  <h2>Code Examples</h2>
  <p>Code blocks are displayed with proper formatting. You can run code cells by clicking the "Run" button:</p>
  <pre><code class="language-python">def hello_world():
  print("Hello, Learnpad!")
  return True

hello_world()</code></pre>
  
  <p>JavaScript code blocks are also supported:</p>
  <pre><code class="language-javascript">function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Learnpad"));</code></pre>
  
  <h2>Best Practices</h2>
  <p>When creating notebook content, keep in mind:</p>
  <ol>
    <li>Use clear headings to organize your content</li>
    <li>Break up long paragraphs for better readability</li>
    <li>Include examples and code snippets where relevant</li>
    <li>Use lists to organize information</li>
  </ol>
`;

const defaultCodeCells = [
  {
    id: 'intro',
    type: 'text' as const,
    content: notebookContent,
  },
];

export default function NotebookPage() {
  const [mode, setMode] = React.useState<'view' | 'code'>('view');
  const [chatMode, setChatMode] = React.useState<'teach' | 'chat'>('teach');

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-end gap-2 px-4 pt-4">
          <div className="inline-flex rounded-md border bg-muted/40 p-0.5 text-xs">
            <ToggleButton
              icon={<Eye className="h-3.5 w-3.5" />}
              label="View"
              isActive={mode === 'view'}
              onClick={() => setMode('view')}
            />
            <ToggleButton
              icon={<Code2 className="h-3.5 w-3.5" />}
              label="Code"
              isActive={mode === 'code'}
              onClick={() => setMode('code')}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {mode === 'view' ? (
            <NotebookView content={notebookContent} />
          ) : (
            <div className="mx-auto max-w-5xl px-4 py-6">
              <NotebookEditor initialCells={defaultCodeCells} hideActions />
            </div>
          )}
          <div className="border-t mt-6 pt-4">
            <ChatInterface
              className="max-h-[500px]"
              mode={chatMode}
              onModeChange={setChatMode}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

interface ToggleButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ToggleButton({ icon, label, isActive, onClick }: ToggleButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}
