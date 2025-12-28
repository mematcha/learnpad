'use client';

/**
 * Markdown renderer component for displaying notebook content
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getNotebookFile } from '@/lib/api/notebooks';
import { LoadingSpinner } from '@/components/ui/loading';

interface MarkdownRendererProps {
  notebookId: string;
}

export function MarkdownRenderer({ notebookId }: MarkdownRendererProps) {
  const searchParams = useSearchParams();
  const filePath = searchParams.get('file') || 'README.md';
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fileData = await getNotebookFile(notebookId, filePath);
        setContent(fileData.content);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load file content'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [notebookId, filePath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6" role="status" aria-label="Loading file content">
        <LoadingSpinner />
        <span className="sr-only">Loading file content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-color rounded-md bg-secondary">
        <p className="text-sm text-secondary">{error}</p>
      </div>
    );
  }

  // Simple markdown rendering (basic formatting)
  // For production, consider using a markdown library like react-markdown
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold mb-3 mt-lg text-primary">
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-semibold mb-1 mt-lg text-primary">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-medium mb-1 mt-md text-primary">
            {line.substring(4)}
          </h3>
        );
      }
      // Code blocks
      if (line.startsWith('```')) {
        return <div key={index} className="my-md" />;
      }
      // Bold
      const boldRegex = /\*\*(.+?)\*\*/g;
      let processedLine = line;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="font-semibold text-primary">
            {match[1]}
          </strong>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      // Empty line
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return (
        <p key={index} className="text-sm text-secondary mb-1 leading-relaxed">
          {parts.length > 0 ? parts : line}
        </p>
      );
    });
  };

  return (
    <article
      className="prose prose-invert max-w-none p-4 border border-color rounded-md bg-secondary"
      aria-label={`File content: ${filePath}`}
    >
      <div className="text-xs text-secondary mb-3 font-mono">
        {filePath}
      </div>
      <div className="markdown-content">{renderMarkdown(content)}</div>
    </article>
  );
}

