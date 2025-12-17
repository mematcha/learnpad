'use client';

/**
 * File tree component displaying hierarchical notebook structure
 */

import { useState } from 'react';
import Link from 'next/link';
import type { FileNode } from '@/types/entities';

interface FileTreeProps {
  fileTree: { root: FileNode };
  notebookId: string;
  onFileSelect?: (filePath: string) => void;
  selectedFile?: string;
}

export function FileTree({ fileTree, notebookId, onFileSelect, selectedFile }: FileTreeProps) {
  const [isFilesExpanded, setIsFilesExpanded] = useState(true);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);
  const [isStudioExpanded, setIsStudioExpanded] = useState(true);

  return (
    <nav
      className="border border-color rounded-md bg-secondary p-4 h-full overflow-y-auto flex flex-col"
      aria-label="Notebook file tree"
    >
      {/* Files Section */}
      <div className="flex-shrink-0 mb-2">
        <button
          onClick={() => setIsFilesExpanded(!isFilesExpanded)}
          className="w-full text-left text-sm font-semibold mb-3 text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 rounded flex items-center gap-2 py-1"
          aria-expanded={isFilesExpanded}
          aria-label="Toggle Files section"
        >
          <span className="text-xs" aria-hidden="true">
            {isFilesExpanded ? '▼' : '▶'}
          </span>
          <span>Files</span>
        </button>
        {isFilesExpanded && fileTree.root.children && (
          <div>
            {fileTree.root.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                notebookId={notebookId}
                level={0}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-color my-2 flex-shrink-0" />

      {/* Sources Section */}
      <div className="flex-shrink-0 mb-2">
        <button
          onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
          className="w-full text-left text-sm font-semibold mb-3 text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 rounded flex items-center gap-2 py-1"
          aria-expanded={isSourcesExpanded}
          aria-label="Toggle Sources section"
        >
          <span className="text-xs" aria-hidden="true">
            {isSourcesExpanded ? '▼' : '▶'}
          </span>
          <span>Sources</span>
        </button>
        {isSourcesExpanded && (
          <div className="text-xs text-secondary px-2 py-1">
            No sources available
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-color my-2 flex-shrink-0" />

      {/* Studio Section */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setIsStudioExpanded(!isStudioExpanded)}
          className="w-full text-left text-sm font-semibold mb-3 text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 rounded flex items-center gap-2 py-1"
          aria-expanded={isStudioExpanded}
          aria-label="Toggle Studio section"
        >
          <span className="text-xs" aria-hidden="true">
            {isStudioExpanded ? '▼' : '▶'}
          </span>
          <span>Studio</span>
        </button>
        {isStudioExpanded && (
          <div className="text-xs text-secondary px-2 py-1">
            No studio items available
          </div>
        )}
      </div>
    </nav>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  notebookId: string;
  level: number;
  onFileSelect?: (filePath: string) => void;
  selectedFile?: string;
}

function FileTreeNode({ node, notebookId, level, onFileSelect, selectedFile }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const isDirectory = node.type === 'directory';
  const hasChildren = node.children && node.children.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isDirectory && hasChildren) {
        setIsExpanded(!isExpanded);
      }
    }
  };

  if (isDirectory) {
    return (
      <div>
        <button
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
          onKeyDown={handleKeyDown}
          className="w-full text-left px-3 py-2 text-sm text-secondary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 rounded flex items-center gap-2 min-h-[44px]"
          style={{ paddingLeft: `${level * 12 + 4}px` }}
          aria-expanded={isExpanded}
          aria-label={`${node.name} directory`}
        >
          <span className="text-xs" aria-hidden="true">
            {isExpanded ? '📂' : '📁'}
          </span>
          <span>{node.name}</span>
        </button>
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                notebookId={notebookId}
                level={level + 1}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedFile === node.path;
  
  const handleClick = (e: React.MouseEvent) => {
    if (onFileSelect) {
      e.preventDefault();
      onFileSelect(node.path);
    }
  };

  const linkClassName = `block px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-2 rounded min-h-[44px] flex items-center gap-2 transition-colors ${
    isSelected
      ? 'text-primary bg-primary bg-opacity-20'
      : 'text-secondary hover:text-primary'
  }`;
  
  const linkProps = onFileSelect
    ? {
        onClick: handleClick,
        href: '#',
        role: 'button' as const,
      }
    : {
        href: `/${notebookId}?file=${encodeURIComponent(node.path)}`,
      };

  return (
    <Link
      {...linkProps}
      className={linkClassName}
      style={{ paddingLeft: `${level * 12 + 4}px` }}
      aria-label={`Open file: ${node.name}`}
      aria-current={isSelected ? 'page' : undefined}
    >
      <span className="text-xs" aria-hidden="true">📄</span>
      <span>{node.name}</span>
    </Link>
  );
}

