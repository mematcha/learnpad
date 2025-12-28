/**
 * Notebook list component displaying user's notebooks with metadata
 * Supports both grid and list views
 */

import type { Notebook } from '@/types/entities';
import { NotebookCard } from './notebook-card';
import { NotebookListItem } from './notebook-list-item';
import { EmptyState } from './empty-state';
import type { ViewMode } from './view-toggle';

interface NotebookListProps {
  notebooks: Notebook[];
  isLoading?: boolean;
  view?: ViewMode;
}

export function NotebookList({ notebooks, isLoading, view = 'grid' }: NotebookListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6" role="status" aria-label="Loading notebooks">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="sr-only">Loading notebooks...</span>
      </div>
    );
  }

  if (notebooks.length === 0) {
    return <EmptyState />;
  }

  if (view === 'list') {
    return (
      <div
        className="border border-color rounded-md bg-secondary divide-y divide-color"
        role="list"
        aria-label={`${notebooks.length} notebooks`}
      >
        {notebooks.map((notebook) => (
          <NotebookListItem key={notebook.notebook_id} notebook={notebook} />
        ))}
      </div>
    );
  }

  // Grid view (default)
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      role="list"
      aria-label={`${notebooks.length} notebooks`}
    >
      {notebooks.map((notebook) => (
        <NotebookCard key={notebook.notebook_id} notebook={notebook} />
      ))}
    </div>
  );
}

