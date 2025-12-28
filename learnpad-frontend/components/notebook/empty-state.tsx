/**
 * Empty state component for when user has no notebooks
 */

import { CreateNotebookButton } from './create-notebook-button';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
      <div className="mb-4">
        <svg
          className="w-16 h-16 text-secondary mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-1 text-primary">
        No notebooks yet
      </h2>
      <p className="text-sm text-secondary mb-4 max-w-md">
        Get started by creating your first personalized learning notebook.
      </p>
      <CreateNotebookButton />
    </div>
  );
}

