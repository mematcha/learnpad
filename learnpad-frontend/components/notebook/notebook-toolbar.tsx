'use client';

/**
 * Toolbar component with search and view toggle
 */

import { useState, useMemo, useEffect } from 'react';
import type { Notebook } from '@/types/entities';
import { NotebookSearch } from './notebook-search';
import { ViewToggle, type ViewMode } from './view-toggle';

interface NotebookToolbarProps {
  notebooks: Notebook[];
  onFilteredNotebooksChange: (filtered: Notebook[]) => void;
  onViewChange: (view: ViewMode) => void;
  view: ViewMode;
}

export function NotebookToolbar({
  notebooks,
  onFilteredNotebooksChange,
  onViewChange,
  view,
}: NotebookToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notebooks based on search query
  const filteredNotebooks = useMemo(() => {
    if (!searchQuery.trim()) {
      return notebooks;
    }

    const query = searchQuery.toLowerCase();
    return notebooks.filter(
      (notebook) =>
        notebook.title.toLowerCase().includes(query) ||
        notebook.subject.toLowerCase().includes(query)
    );
  }, [notebooks, searchQuery]);

  // Notify parent of filtered notebooks (use useEffect to avoid setState during render)
  useEffect(() => {
    onFilteredNotebooksChange(filteredNotebooks);
  }, [filteredNotebooks, onFilteredNotebooksChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex-1">
        <NotebookSearch
          onSearch={setSearchQuery}
          placeholder="Search by title or subject..."
        />
      </div>
      <div className="flex-shrink-0">
        <ViewToggle view={view} onViewChange={onViewChange} />
      </div>
    </div>
  );
}

