'use client';

/**
 * Notebook menubar component with File, Edit, View menus
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, FileText, Edit, Eye, Settings, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface NotebookMenubarProps {
  notebookId: string;
  canEdit: boolean;
  onChatToggle?: () => void;
  isChatView?: boolean;
  onOutlineToggle?: () => void;
  isOutlineVisible?: boolean;
  onEditModeToggle?: () => void;
  isEditMode?: boolean;
}

interface MenuItem {
  label: string;
  action?: () => void;
  href?: string;
  shortcut?: string;
  divider?: boolean;
  checked?: boolean;
}

export function NotebookMenubar({ notebookId, canEdit, onChatToggle, isChatView, onOutlineToggle, isOutlineVisible, onEditModeToggle, isEditMode }: NotebookMenubarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu && menuRefs.current[activeMenu]) {
        const menuElement = menuRefs.current[activeMenu];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setActiveMenu(null);
        }
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  const fileMenuItems: MenuItem[] = [
    { label: 'Export Notebook', action: () => console.log('Export'), shortcut: '⌘E' },
    { label: 'Print', action: () => window.print(), shortcut: '⌘P' },
    { divider: true },
    { label: 'Share...', action: () => console.log('Share') },
  ];

  const editMenuItems: MenuItem[] = [
    { 
      label: 'Edit Mode', 
      action: () => {
        if (onEditModeToggle) {
          onEditModeToggle();
        }
      },
      shortcut: '⌘E',
      checked: isEditMode
    },
    { divider: true },
    { label: 'Undo', action: () => console.log('Undo'), shortcut: '⌘Z', divider: false },
    { label: 'Redo', action: () => console.log('Redo'), shortcut: '⌘⇧Z' },
    { divider: true },
    { label: 'Find in Notebook', action: () => console.log('Find'), shortcut: '⌘F' },
    { label: 'Find and Replace', action: () => console.log('Replace'), shortcut: '⌘⇧F' },
    { divider: true },
    { label: 'AI Insert', action: () => console.log('AI Insert'), shortcut: '⌘K' },
  ];

  const viewMenuItems: MenuItem[] = [
    { label: 'Zoom In', action: () => console.log('Zoom In'), shortcut: '⌘+' },
    { label: 'Zoom Out', action: () => console.log('Zoom Out'), shortcut: '⌘-' },
    { label: 'Reset Zoom', action: () => console.log('Reset Zoom'), shortcut: '⌘0' },
    { divider: true },
    { 
      label: 'Show Outline', 
      action: () => {
        if (onOutlineToggle) {
          onOutlineToggle();
        }
      },
      shortcut: '⌘⇧O',
      checked: isOutlineVisible
    },
  ];

  // Note: Panel toggling is handled via keyboard shortcuts in notebook-view.tsx
  // This menu item is informational only

  const handleChatClick = () => {
    onChatToggle?.();
  };

  const renderMenu = (menuId: string, items: MenuItem[], icon: React.ReactNode) => {
    const isOpen = activeMenu === menuId;

    return (
      <div className="relative" ref={(el) => (menuRefs.current[menuId] = el)}>
        <button
          onClick={() => setActiveMenu(isOpen ? null : menuId)}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary min-h-[32px] ${
            isOpen
              ? 'bg-secondary text-primary'
              : 'text-secondary hover:bg-secondary hover:text-primary'
          }`}
          aria-label={`${menuId} menu`}
          aria-expanded={isOpen}
        >
          {icon}
          <span className="capitalize">{menuId}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-secondary border border-color rounded-md shadow-lg py-1 min-w-[200px] z-50">
            {items.map((item, index) => {
              if (item.divider) {
                return (
                  <div
                    key={`divider-${index}`}
                    className="border-t border-color my-1"
                  />
                );
              }

              const content = (
                <>
                  <span className="flex items-center gap-2 flex-1">
                    {item.checked && <span className="text-xs">✓</span>}
                    <span>{item.label}</span>
                  </span>
                  {item.shortcut && (
                    <span className="text-xs text-secondary ml-4 font-mono">
                      {item.shortcut}
                    </span>
                  )}
                </>
              );

              if (item.href) {
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2 text-sm text-secondary hover:bg-primary hover:text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset min-h-[36px]"
                    onClick={() => setActiveMenu(null)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={index}
                  onClick={() => {
                    item.action?.();
                    setActiveMenu(null);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-secondary hover:bg-primary hover:text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset min-h-[36px] text-left"
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="flex items-center gap-1" aria-label="Notebook menu">
      {renderMenu('file', fileMenuItems, <FileText className="w-4 h-4" />)}
      {canEdit && renderMenu('edit', editMenuItems, <Edit className="w-4 h-4" />)}
      {renderMenu('view', viewMenuItems, <Eye className="w-4 h-4" />)}
      <button
        onClick={handleChatClick}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary min-h-[32px] ${
          isChatView
            ? 'bg-secondary text-primary'
            : 'text-secondary hover:bg-secondary hover:text-primary'
        }`}
        aria-label="Toggle chat view"
        aria-pressed={isChatView}
      >
        <MessageSquare className="w-4 h-4" />
        <span>Chat</span>
      </button>
      <Link
        href={`/${notebookId}/settings`}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary hover:text-primary rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary min-h-[32px]"
        aria-label="Notebook settings"
      >
        <Settings className="w-4 h-4" />
        <span>Settings</span>
      </Link>
    </nav>
  );
}

