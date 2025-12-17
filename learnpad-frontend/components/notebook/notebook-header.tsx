/**
 * Notebook header component with title, metadata, and integrated menubar
 */

import Link from 'next/link';
import type { Notebook } from '@/types/entities';
import { NotebookMenubar } from './notebook-menubar';

interface NotebookHeaderProps {
  notebook: Notebook;
  canEdit: boolean;
  onChatToggle?: () => void;
  isChatView?: boolean;
  onOutlineToggle?: () => void;
  isOutlineVisible?: boolean;
}

export function NotebookHeader({ notebook, canEdit, onChatToggle, isChatView, onOutlineToggle, isOutlineVisible }: NotebookHeaderProps) {
  return (
    <header className="border-b border-color pb-3 mb-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Logo linking to home */}
          <Link
            href="/"
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-md hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-primary"
            aria-label="Go to homepage"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold mb-1 text-primary truncate">
              {notebook.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-secondary">
              <span className="text-secondary">{notebook.subject}</span>
              {notebook.is_shared && (
                <span className="flex items-center gap-1" aria-label="Shared notebook">
                  <span>🔗</span>
                  <span>Shared</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <NotebookMenubar 
          notebookId={notebook.notebook_id} 
          canEdit={canEdit}
          onChatToggle={onChatToggle}
          isChatView={isChatView}
          onOutlineToggle={onOutlineToggle}
          isOutlineVisible={isOutlineVisible}
        />
      </div>
    </header>
  );
}

