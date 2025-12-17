'use client';

/**
 * Sharing controls component for public/private toggle and share link
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateNotebookSettings } from '@/lib/api/notebooks';
import type { Notebook } from '@/types/entities';
import { LoadingSpinner } from '@/components/ui/loading';

interface SharingControlsProps {
  notebook: Notebook;
}

export function SharingControls({ notebook }: SharingControlsProps) {
  const router = useRouter();
  const [isShared, setIsShared] = useState(notebook.is_shared);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleSharing = async () => {
    setIsUpdating(true);
    try {
      await updateNotebookSettings(notebook.notebook_id, {
        is_shared: !isShared,
      });
      setIsShared(!isShared);
      router.refresh();
    } catch (error) {
      console.error('Failed to update sharing settings:', error);
      // Revert on error
      setIsShared(notebook.is_shared);
    } finally {
      setIsUpdating(false);
    }
  };

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${notebook.notebook_id}`;

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div>
      <h3 className="text-base font-medium mb-3 text-primary">
        Sharing
      </h3>
      <div className="space-y-md">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isShared}
            onChange={handleToggleSharing}
            disabled={isUpdating}
            className="w-4 h-4 rounded border-color bg-primary text-primary focus:ring-2 focus:ring-primary"
            aria-label="Make notebook publicly shareable"
          />
          <span className="text-sm text-secondary">
            Make this notebook publicly shareable
          </span>
          {isUpdating && (
            <LoadingSpinner size="sm" className="ml-2" />
          )}
        </label>
        {isShared && (
          <div className="p-3 bg-primary border border-color rounded-md">
            <label
              htmlFor="share-link"
              className="block text-xs font-medium mb-0.5 text-secondary"
            >
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="share-link"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-1 bg-secondary border border-color rounded-md text-xs text-secondary font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px]"
                aria-label="Share link URL"
              />
              <button
                onClick={copyShareLink}
                className="px-3 py-1 border border-color rounded-md text-xs font-medium hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px]"
                aria-label="Copy share link"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

