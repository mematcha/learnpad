'use client';

/**
 * Search bar component for filtering notebooks
 */

import { Search } from 'lucide-react';
import { useState } from 'react';

interface NotebookSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function NotebookSearch({ onSearch, placeholder = 'Search notebooks...' }: NotebookSearchProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" aria-hidden="true" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-secondary border border-color rounded-md text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px]"
        aria-label="Search notebooks"
      />
    </div>
  );
}

