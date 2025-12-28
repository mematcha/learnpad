'use client';

/**
 * Settings content component that displays the appropriate section based on URL params
 */

import { useSearchParams } from 'next/navigation';
import { NotebookSettingsForm } from './notebook-settings-form';
import { SharingControls } from './sharing-controls';
import { DeleteConfirmation } from './delete-confirmation';
import type { Notebook } from '@/types/entities';

interface SettingsContentProps {
  notebook: Notebook;
  notebookId: string;
  createdDate: string;
  updatedDate: string;
}

export function SettingsContent({
  notebook,
  notebookId,
  createdDate,
  updatedDate,
}: SettingsContentProps) {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'general';

  switch (section) {
    case 'general':
      return <NotebookSettingsForm notebook={notebook} showSharing={false} />;
    
    case 'sharing':
      return (
        <div>
          <h2 className="text-xl font-semibold mb-8 text-primary">
            Sharing and Privacy
          </h2>
          <SharingControls notebook={notebook} />
        </div>
      );
    
    case 'connectors':
      return (
        <div>
          <h2 className="text-xl font-semibold mb-8 text-primary">
            Connectors
          </h2>
          <p className="text-sm text-secondary">
            Connect external services and data sources to your notebook.
          </p>
        </div>
      );
    
    case 'agents':
      return (
        <div>
          <h2 className="text-xl font-semibold mb-8 text-primary">
            Agents & MCP
          </h2>
          <p className="text-sm text-secondary">
            Configure AI agents and Model Context Protocol (MCP) settings.
          </p>
        </div>
      );
    
    case 'information':
      return (
        <div>
          <h2 className="text-xl font-semibold mb-8 text-primary">
            Notebook Information
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-secondary mb-1">Notebook ID</dt>
              <dd className="text-sm text-primary font-mono">{notebook.notebook_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-secondary mb-1">Status</dt>
              <dd className="text-sm text-primary capitalize">{notebook.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-secondary mb-1">Created</dt>
              <dd className="text-sm text-primary">{createdDate}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-secondary mb-1">Last Updated</dt>
              <dd className="text-sm text-primary">{updatedDate}</dd>
            </div>
          </dl>
        </div>
      );
    
    case 'danger':
      return (
        <div>
          <h2 className="text-xl font-semibold mb-8 text-primary">
            Danger Zone
          </h2>
          <DeleteConfirmation notebookId={notebookId} notebookTitle={notebook.title} />
        </div>
      );
    
    default:
      return <NotebookSettingsForm notebook={notebook} showSharing={false} />;
  }
}

