'use client';

/**
 * Delete confirmation dialog component
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteNotebook } from '@/lib/api/notebooks';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorMessage } from '@/components/ui/error-message';

interface DeleteConfirmationProps {
  notebookId: string;
  notebookTitle: string;
}

export function DeleteConfirmation({
  notebookId,
  notebookTitle,
}: DeleteConfirmationProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteNotebook(notebookId);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete notebook'
      );
      setIsDeleting(false);
    }
  };

  if (!showConfirm) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3 text-primary">
          Danger Zone
        </h2>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 border border-red-500/50 text-red-400 rounded-md font-medium hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-2 min-h-[44px]"
          aria-label="Delete notebook"
        >
          Delete Notebook
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-primary">
        Danger Zone
      </h2>
      <div className="p-4 border border-red-500/50 rounded-md bg-red-900/20">
        <h3 className="text-base font-medium mb-1 text-red-400">
          Delete Notebook
        </h3>
        <p className="text-sm text-secondary mb-3">
          Are you sure you want to delete &quot;{notebookTitle}&quot;? This
          action cannot be undone.
        </p>
        {error && <ErrorMessage message={error} />}
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
            aria-label="Confirm delete notebook"
            aria-busy={isDeleting}
          >
            {isDeleting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Deleting...</span>
              </>
            ) : (
              'Delete'
            )}
          </button>
          <button
            onClick={() => {
              setShowConfirm(false);
              setError(null);
            }}
            disabled={isDeleting}
            className="px-4 py-2 border border-color rounded-md font-medium hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

