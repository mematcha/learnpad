'use client';

/**
 * View toggle component for switching between grid and list views
 */

import { Grid3x3, List } from 'lucide-react';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 border border-color rounded-md p-1 bg-secondary" role="group" aria-label="View mode">
      <button
        onClick={() => onViewChange('grid')}
        className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center ${
          view === 'grid'
            ? 'bg-text-primary text-bg-primary'
            : 'text-secondary hover:opacity-80'
        }`}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
      >
        <Grid3x3 className="w-4 h-4" aria-hidden="true" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center ${
          view === 'list'
            ? 'bg-text-primary text-bg-primary'
            : 'text-secondary hover:opacity-80'
        }`}
        aria-label="List view"
        aria-pressed={view === 'list'}
      >
        <List className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

