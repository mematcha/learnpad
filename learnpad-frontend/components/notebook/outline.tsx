'use client';

/**
 * Outline component displaying document structure from markdown headings
 */

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface OutlineProps {
  content: string;
  onHeadingClick?: (headingId: string) => void;
}

export function Outline({ content, onHeadingClick }: OutlineProps) {
  // Extract headings from markdown content
  const extractHeadings = (text: string): Heading[] => {
    const lines = text.split('\n');
    const headings: Heading[] = [];
    let inCodeBlock = false;

    lines.forEach((line, index) => {
      // Track code blocks to skip headings inside them
      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }

      if (inCodeBlock) {
        return;
      }

      // Match markdown headings (# ## ### etc.)
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        // Generate a simple ID from the heading text
        const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        headings.push({ level, text, id });
      }
    });

    return headings;
  };

  const headings = extractHeadings(content);

  if (headings.length === 0) {
    return (
      <div className="p-4 text-xs text-secondary">
        No headings found
      </div>
    );
  }

  const handleClick = (headingId: string) => {
    onHeadingClick?.(headingId);
    // Scroll to heading in the document
    const element = document.querySelector(`[data-heading-id="${headingId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      className="h-full overflow-y-auto p-4"
      aria-label="Document outline"
    >
      <h3 className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">
        Outline
      </h3>
      <ul className="space-y-1">
        {headings.map((heading, index) => (
          <li key={index}>
            <button
              onClick={() => handleClick(heading.id)}
              className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 ${
                heading.level === 1
                  ? 'text-primary font-semibold'
                  : heading.level === 2
                  ? 'text-primary font-medium pl-4'
                  : 'text-secondary pl-8'
              } hover:bg-secondary hover:text-primary`}
              style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
              aria-label={`Jump to ${heading.text}`}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

