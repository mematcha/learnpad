'use client';

import * as React from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/lib/themes/theme-provider';
import { cn } from '@/lib/utils';

export type Language = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  readOnly?: boolean;
  className?: string;
  height?: string | number;
  onMount?: (editor: any, monaco: any) => void;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  className,
  height = '400px',
  onMount,
}: CodeEditorProps) {
  const { theme } = useTheme();
  
  // Map our theme to Monaco themes
  const getMonacoTheme = () => {
    switch (theme) {
      case 'dark':
        return 'vs-dark';
      case 'high-contrast':
        return 'hc-black';
      default:
        return 'vs';
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'var(--font-jetbrains-mono), "JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, "Courier New", monospace',
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      guides: {
        indentation: true,
        bracketPairs: true,
      },
    });

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Handle save
      console.log('Save triggered');
    });

    onMount?.(editor, monaco);
  };

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(newValue) => onChange(newValue || '')}
        theme={getMonacoTheme()}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: 'line',
          automaticLayout: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}
