/**
 * Create notebook button component
 * Placeholder - links to future creation flow
 */

import Link from 'next/link';

export function CreateNotebookButton() {
  return (
    <Link
      href="/create"
      className="px-4 py-2 bg-text-primary text-bg-primary rounded-md font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px] flex items-center justify-center"
      aria-label="Create a new notebook"
    >
      Create Notebook
    </Link>
  );
}

