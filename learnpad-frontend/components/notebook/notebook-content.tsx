'use client';

/**
 * Notebook content component for displaying file content
 */

interface NotebookContentProps {
  notebookId: string;
  filePath: string;
  content: string;
}

export function NotebookContent({
  notebookId,
  filePath,
  content,
}: NotebookContentProps) {
  // Simple markdown rendering (basic formatting)
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockKey = 0;

    lines.forEach((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          elements.push(
            <pre
              key={`code-${codeBlockKey++}`}
              className="bg-primary border border-color rounded-md p-4 my-4 overflow-x-auto"
            >
              <code className="text-sm text-primary font-mono">
                {codeBlockContent.join('\n')}
              </code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          // Start code block
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        const headingText = line.substring(2).trim();
        const headingId = `heading-${index}-${headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        elements.push(
          <h1
            key={index}
            data-heading-id={headingId}
            id={headingId}
            className="text-2xl font-bold mb-4 mt-8 text-primary first:mt-0 scroll-mt-4"
          >
            {headingText}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        const headingText = line.substring(3).trim();
        const headingId = `heading-${index}-${headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        elements.push(
          <h2
            key={index}
            data-heading-id={headingId}
            id={headingId}
            className="text-xl font-semibold mb-3 mt-8 text-primary first:mt-0 scroll-mt-4"
          >
            {headingText}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        const headingText = line.substring(4).trim();
        const headingId = `heading-${index}-${headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        elements.push(
          <h3
            key={index}
            data-heading-id={headingId}
            id={headingId}
            className="text-lg font-medium mb-2 mt-6 text-primary first:mt-0 scroll-mt-4"
          >
            {headingText}
          </h3>
        );
        return;
      }
      // Handle h4, h5, h6 headings
      const headingMatch = line.match(/^(#{4,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].trim();
        const headingId = `heading-${index}-${headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const className = level === 4 
          ? 'text-base font-medium mb-2 mt-4 text-primary scroll-mt-4'
          : level === 5
          ? 'text-sm font-medium mb-2 mt-4 text-primary scroll-mt-4'
          : 'text-xs font-medium mb-2 mt-4 text-primary scroll-mt-4';
        elements.push(
          <div
            key={index}
            data-heading-id={headingId}
            id={headingId}
            className={className}
            role="heading"
            aria-level={level}
          >
            {headingText}
          </div>
        );
        return;
      }

      // Bold text
      const boldRegex = /\*\*(.+?)\*\*/g;
      let processedLine = line;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      let matchKey = 0;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={`bold-${matchKey++}`} className="font-semibold text-primary">
            {match[1]}
          </strong>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      // Inline code
      const codeRegex = /`([^`]+)`/g;
      const codeParts: React.ReactNode[] = [];
      lastIndex = 0;
      matchKey = 0;

      parts.forEach((part) => {
        if (typeof part === 'string') {
          while ((match = codeRegex.exec(part)) !== null) {
            if (match.index > lastIndex) {
              codeParts.push(part.substring(lastIndex, match.index));
            }
            codeParts.push(
              <code
                key={`code-inline-${matchKey++}`}
                className="bg-primary px-1 py-0.5 rounded text-xs font-mono text-primary"
              >
                {match[1]}
              </code>
            );
            lastIndex = match.index + match[0].length;
          }
          if (lastIndex < part.length) {
            codeParts.push(part.substring(lastIndex));
          }
        } else {
          codeParts.push(part);
        }
        lastIndex = 0;
      });

      // Empty line
      if (line.trim() === '') {
        elements.push(<br key={index} />);
        return;
      }

      // Regular paragraph
      elements.push(
        <p key={index} className="text-sm text-secondary mb-3 leading-relaxed">
          {codeParts.length > 0 ? codeParts : line}
        </p>
      );
    });

    // Close any open code block
    if (inCodeBlock && codeBlockContent.length > 0) {
      elements.push(
        <pre
          key={`code-${codeBlockKey++}`}
          className="bg-primary border border-color rounded-md p-4 my-4 overflow-x-auto"
        >
          <code className="text-sm text-primary font-mono">
            {codeBlockContent.join('\n')}
          </code>
        </pre>
      );
    }

    return elements;
  };

  return (
    <article
      className="prose prose-invert max-w-none"
      aria-label={`File content: ${filePath}`}
    >
      <div className="mb-6 pb-4 border-b border-color">
        <div className="text-xs text-secondary font-mono">
          {filePath}
        </div>
      </div>
      <div className="markdown-content space-y-4">{renderMarkdown(content)}</div>
    </article>
  );
}

