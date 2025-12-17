/**
 * Notebook header component with title, metadata, and integrated menubar
 */

import type { Notebook } from '@/types/entities';
import { NotebookMenubar } from './notebook-menubar';

interface NotebookHeaderProps {
  notebook: Notebook;
  canEdit: boolean;
  onChatToggle?: () => void;
  isChatView?: boolean;
}

export function NotebookHeader({ notebook, canEdit, onChatToggle, isChatView }: NotebookHeaderProps) {
  return (
    <header className="border-b border-color pb-3 mb-1">
      <div className="flex items-start justify-between gap-4">
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
        <NotebookMenubar 
          notebookId={notebook.notebook_id} 
          canEdit={canEdit}
          onChatToggle={onChatToggle}
          isChatView={isChatView}
        />
      </div>
    </header>
  );
}

