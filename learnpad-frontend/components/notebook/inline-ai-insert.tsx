'use client';

/**
 * Inline AI insert component - Cursor-style AI prompt input
 */

import { useState, useEffect, useRef } from 'react';

interface InlineAIInsertProps {
  onInsert: (prompt: string) => Promise<string>;
  onCancel: () => void;
  position: { top: number; left: number };
}

export function InlineAIInsert({ onInsert, onCancel, position }: InlineAIInsertProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await onInsert(prompt);
      // The parent component should handle the insertion
      setPrompt('');
    } catch (error) {
      console.error('AI insert error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed z-50 bg-secondary border border-primary rounded-md shadow-xl p-1 min-w-[500px]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-primary rounded border border-color">
          <span className="text-xs font-medium text-primary bg-primary bg-opacity-20 px-1.5 py-0.5 rounded">AI</span>
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI to insert content here..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-primary placeholder:text-secondary"
            disabled={isGenerating}
          />
        </div>
        <button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className="px-3 py-2 text-xs font-medium bg-text-primary text-bg-primary rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-[32px]"
        >
          {isGenerating ? '...' : 'Insert'}
        </button>
      </form>
      <div className="text-xs text-secondary px-2 py-1 mt-1">
        Press <kbd className="px-1 py-0.5 bg-primary rounded text-xs">Esc</kbd> to cancel
      </div>
    </div>
  );
}

