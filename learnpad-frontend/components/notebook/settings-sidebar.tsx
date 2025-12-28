'use client';

/**
 * Settings sidebar navigation component
 */

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type SettingsSection = 
  | 'general'
  | 'sharing'
  | 'connectors'
  | 'agents'
  | 'information'
  | 'danger';

interface SettingsSidebarProps {
  notebookId: string;
}

const sections: Array<{
  id: SettingsSection;
  label: string;
}> = [
  { id: 'general', label: 'General Settings' },
  { id: 'sharing', label: 'Sharing and Privacy' },
  { id: 'connectors', label: 'Connectors' },
  { id: 'agents', label: 'Agents & MCP' },
  { id: 'information', label: 'Notebook Information' },
  { id: 'danger', label: 'Danger Zone' },
];

export function SettingsSidebar({ notebookId }: SettingsSidebarProps) {
  const searchParams = useSearchParams();
  const activeSection = (searchParams.get('section') || 'general') as SettingsSection;

  return (
    <nav
      className="border border-color rounded-md bg-secondary p-4 h-fit"
      aria-label="Settings navigation"
    >
      <ul className="space-y-1">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <li key={section.id}>
              <Link
                href={`/${notebookId}/settings?section=${section.id}`}
                className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? 'text-primary bg-primary bg-opacity-20 font-medium'
                    : 'text-secondary hover:text-primary hover:bg-primary hover:bg-opacity-10'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

