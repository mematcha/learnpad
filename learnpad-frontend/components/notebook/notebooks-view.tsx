'use client';

/**
 * Main notebooks view component with search, view toggle, and list display
 */

import { useState } from 'react';
import type { Notebook } from '@/types/entities';
import { NotebookToolbar } from './notebook-toolbar';
import { NotebookList } from './notebook-list';
import { CreateNotebookButton } from './create-notebook-button';
import type { ViewMode } from './view-toggle';

interface NotebooksViewProps {
  notebooks: Notebook[];
}

export function NotebooksView({ notebooks: initialNotebooks }: NotebooksViewProps) {
  const [filteredNotebooks, setFilteredNotebooks] = useState<Notebook[]>(initialNotebooks);
  const [view, setView] = useState<ViewMode>('grid');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">
            My Notebooks
          </h1>
          <p className="text-sm text-secondary">
            {filteredNotebooks.length} notebook{filteredNotebooks.length !== 1 ? 's' : ''}
            {filteredNotebooks.length !== initialNotebooks.length && ` of ${initialNotebooks.length}`}
          </p>
        </div>
        <CreateNotebookButton />
      </div>

      <NotebookToolbar
        notebooks={initialNotebooks}
        onFilteredNotebooksChange={setFilteredNotebooks}
        onViewChange={setView}
        view={view}
      />

      <NotebookList notebooks={filteredNotebooks} view={view} />
    </div>
  );
}

