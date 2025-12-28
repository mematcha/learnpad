'use client';

/**
 * Studio sidebar component
 * Displays studio-related content and tools
 */

import { useState } from 'react';

interface StudioSidebarProps {
  notebookId: string;
}

export function StudioSidebar({ notebookId }: StudioSidebarProps) {
  const [isStudioExpanded, setIsStudioExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const studioItems = [
    'Quizzes',
    'Flashcards',
    'Slides',
    'Labs',
    'Mindmaps',
  ];

  const handleItemClick = (item: string) => {
    // Handle item click - can be implemented later
    console.log(`Clicked on ${item}`);
  };

  return (
    <nav
      className="border border-color rounded-md bg-secondary p-4 h-full overflow-y-auto flex flex-col"
      aria-label="Studio sidebar"
    >
      {/* Studio Section */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setIsStudioExpanded(!isStudioExpanded)}
          className="w-full text-left text-sm font-semibold mb-3 text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 rounded flex items-center gap-2 py-1"
          aria-expanded={isStudioExpanded}
          aria-label="Toggle Studio section"
        >
          <span className="text-xs" aria-hidden="true">
            {isStudioExpanded ? '▼' : '▶'}
          </span>
          <span>Studio</span>
        </button>
        {isStudioExpanded && (
          <div className="flex flex-col gap-4">
            {/* 2x3 Grid of Buttons */}
            <div className="grid grid-cols-2 gap-2 w-full">
              {studioItems.map((item) => (
                <button
                  key={item}
                  onClick={() => handleItemClick(item)}
                  className="w-full min-w-0 px-2 py-2 text-xs font-medium text-primary bg-primary bg-opacity-10 hover:bg-opacity-20 border border-color rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 truncate"
                  aria-label={`Open ${item}`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-color my-2" />

            {/* Search Bar */}
            <div className="flex-shrink-0 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 text-sm text-primary bg-primary bg-opacity-10 border border-color rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 placeholder:text-secondary"
                aria-label="Search studio items"
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

