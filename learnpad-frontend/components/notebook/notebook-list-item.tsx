/**
 * Notebook list item component for list view
 */

import Link from 'next/link';
import type { Notebook } from '@/types/entities';

interface NotebookListItemProps {
  notebook: Notebook;
}

const statusColors = {
  generating: 'text-yellow-400',
  completed: 'text-green-400',
  failed: 'text-red-400',
};

const statusLabels = {
  generating: 'Generating',
  completed: 'Completed',
  failed: 'Failed',
};

export function NotebookListItem({ notebook }: NotebookListItemProps) {
  // Format date relative to now
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const lastModified = formatRelativeTime(notebook.updated_at);

  return (
    <Link
      href={`/${notebook.notebook_id}`}
      className="block p-4 border-b border-color hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={`Open notebook: ${notebook.title}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-primary truncate">
              {notebook.title}
            </h3>
            {notebook.is_shared && (
              <span className="text-xs text-secondary flex-shrink-0" aria-label="Shared notebook">
                🔗
              </span>
            )}
          </div>
          <p className="text-sm text-secondary truncate">{notebook.subject}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-secondary flex-shrink-0">
          <span
            className={`font-medium ${statusColors[notebook.status]}`}
            aria-label={`Status: ${statusLabels[notebook.status]}`}
          >
            {statusLabels[notebook.status]}
          </span>
          <time dateTime={notebook.updated_at} aria-label={`Last modified ${lastModified}`}>
            {lastModified}
          </time>
        </div>
      </div>
    </Link>
  );
}

