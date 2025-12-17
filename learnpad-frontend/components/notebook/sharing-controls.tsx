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
      <h2 className="text-xl font-semibold mb-6 text-primary">
        Sharing & Privacy
      </h2>
      <div className="space-y-6">
        <div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isShared}
              onChange={handleToggleSharing}
              disabled={isUpdating}
              className="mt-1 w-5 h-5 rounded border-color bg-primary text-primary focus:ring-2 focus:ring-primary flex-shrink-0"
              aria-label="Make notebook publicly shareable"
            />
            <div className="flex-1">
              <span className="block text-base font-medium text-primary mb-1">
                Make this notebook publicly shareable
              </span>
              <span className="block text-sm text-secondary">
                Anyone with the link can view this notebook. You can revoke access at any time.
              </span>
            </div>
            {isUpdating && (
              <LoadingSpinner size="sm" className="mt-1 flex-shrink-0" />
            )}
          </label>
        </div>
        {isShared && (
          <div className="space-y-2">
            <label
              htmlFor="share-link"
              className="block text-sm font-medium text-secondary"
            >
              Share Link
            </label>
            <div className="flex gap-3 max-w-2xl">
              <input
                type="text"
                id="share-link"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-primary border border-color rounded-md text-sm text-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary min-h-[44px]"
                aria-label="Share link URL"
              />
              <button
                onClick={copyShareLink}
                className="px-6 py-2 border border-color rounded-md text-sm font-medium hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary min-h-[44px] whitespace-nowrap"
                aria-label="Copy share link"
              >
                Copy Link
              </button>
            </div>
            <p className="text-xs text-secondary">
              Share this link with anyone you want to give access to this notebook.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

