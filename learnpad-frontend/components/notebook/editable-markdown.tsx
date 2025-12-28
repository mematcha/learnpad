'use client';

/**
 * Editable markdown editor component with inline AI insert
 */

import { useState, useRef, useEffect } from 'react';
import { InlineAIInsert } from './inline-ai-insert';

interface EditableMarkdownProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  notebookId: string;
  filePath: string;
}

export function EditableMarkdown({
  content,
  onChange,
  onSave,
  notebookId,
  filePath,
}: EditableMarkdownProps) {
  const [localContent, setLocalContent] = useState(content);
  const [showAIInsert, setShowAIInsert] = useState(false);
  const [aiInsertPosition, setAiInsertPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const calculateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const selectionStart = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, selectionStart);
    
    // Split text into lines
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length - 1;
    const currentColumn = lines[currentLine]?.length || 0;
    
    // Create a mirror div with exact same styling
    const mirror = document.createElement('div');
    const styles = window.getComputedStyle(textarea);
    
    // Copy all relevant styles
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.font = styles.font;
    mirror.style.fontSize = styles.fontSize;
    mirror.style.fontFamily = styles.fontFamily;
    mirror.style.fontWeight = styles.fontWeight;
    mirror.style.lineHeight = styles.lineHeight;
    mirror.style.padding = styles.padding;
    mirror.style.border = styles.border;
    mirror.style.width = styles.width;
    mirror.style.letterSpacing = styles.letterSpacing;
    mirror.style.boxSizing = styles.boxSizing;
    mirror.style.margin = styles.margin;
    
    // Set the text content up to cursor
    mirror.textContent = textBeforeCursor;
    
    // Add a span at cursor position
    const span = document.createElement('span');
    span.textContent = '\u200b'; // Zero-width space
    mirror.appendChild(span);
    
    // Position mirror at textarea location
    const textareaRect = textarea.getBoundingClientRect();
    mirror.style.top = `${textareaRect.top}px`;
    mirror.style.left = `${textareaRect.left}px`;
    
    document.body.appendChild(mirror);
    
    const spanRect = span.getBoundingClientRect();
    const top = spanRect.top;
    const left = spanRect.left;
    
    document.body.removeChild(mirror);
    
    return { top, left };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent | globalThis.KeyboardEvent) => {
      // Cmd+K or Ctrl+K for inline AI insert
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const selectionStart = textarea.selectionStart;
          
          // Calculate exact cursor position
          const cursorPos = calculateCursorPosition(textarea);
          const textareaRect = textarea.getBoundingClientRect();
          
          // Ensure the AI insert box is visible
          // If cursor is near bottom of viewport, position above cursor
          const viewportHeight = window.innerHeight;
          const spaceBelow = viewportHeight - cursorPos.top;
          const spaceAbove = cursorPos.top;
          
          let top = cursorPos.top;
          if (spaceBelow < 100 && spaceAbove > 150) {
            // Position above cursor if not enough space below
            top = cursorPos.top - 60;
          } else {
            // Position below cursor
            top = cursorPos.top + 20;
          }
          
          // Ensure it doesn't go off screen
          top = Math.max(10, Math.min(top, viewportHeight - 100));
          
          setCursorPosition(selectionStart);
          setAiInsertPosition({
            top,
            left: Math.max(10, Math.min(cursorPos.left, window.innerWidth - 520)), // Keep within viewport
          });
          setShowAIInsert(true);
        }
      }

      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown as any);
      return () => {
        textarea.removeEventListener('keydown', handleKeyDown as any);
      };
    }
  }, [onSave]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange(newContent);
  };

  const handleAIInsert = async (prompt: string): Promise<string> => {
    // TODO: Call AI API to generate content based on prompt
    // For now, return a placeholder
    const aiResponse = `\n\n<!-- AI Generated: ${prompt} -->\n[AI content will be inserted here]\n\n`;
    
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const before = localContent.substring(0, cursorPosition);
      const after = localContent.substring(cursorPosition);
      const newContent = before + aiResponse + after;
      
      setLocalContent(newContent);
      onChange(newContent);
      
      // Update cursor position
      setTimeout(() => {
        const newCursorPos = cursorPosition + aiResponse.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }
    
    setShowAIInsert(false);
    return aiResponse;
  };

  const handleCancelAI = () => {
    setShowAIInsert(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="mb-6 pb-4 border-b border-color">
        <div className="flex items-center justify-between">
          <div className="text-xs text-secondary font-mono">{filePath}</div>
          <div className="flex items-center gap-2 text-xs text-secondary">
            <span>Press Cmd+K for AI insert</span>
            <span>•</span>
            <span>Press Cmd+S to save</span>
          </div>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={handleContentChange}
        className="w-full min-h-[600px] px-4 py-3 text-sm font-mono text-primary bg-primary border border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary resize-y leading-relaxed"
        placeholder="Start editing your markdown content..."
        spellCheck={false}
      />
      {showAIInsert && (
        <InlineAIInsert
          onInsert={handleAIInsert}
          onCancel={handleCancelAI}
          position={aiInsertPosition}
        />
      )}
    </div>
  );
}

