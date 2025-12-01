'use client';

import * as React from 'react';
import { Tree } from 'react-arborist';
import { File, Folder, FolderOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileTreeNode } from '@/lib/utils/tree-utils';
import type { NodeApi } from 'react-arborist';

interface FileTreeProps {
  data: FileTreeNode[];
  onSelect?: (node: FileTreeNode) => void;
  selectedPath?: string;
  className?: string;
  height?: number;
}

export function FileTree({
  data,
  onSelect,
  selectedPath,
  className,
  height = 400,
}: FileTreeProps) {
  const handleSelect = React.useCallback(
    (nodes: NodeApi<FileTreeNode>[]) => {
      if (nodes.length > 0 && onSelect) {
        onSelect(nodes[0].data);
      }
    },
    [onSelect]
  );

  return (
    <div className={cn('w-full', className)}>
      <Tree
        data={data}
        width="100%"
        height={height}
        indent={16}
        rowHeight={28}
        onSelect={handleSelect}
        openByDefault={false}
        className="file-tree"
      >
        {Node}
      </Tree>
    </div>
  );
}

function Node(props: { node: NodeApi<FileTreeNode>; style: React.CSSProperties; dragHandle?: (el: HTMLDivElement | null) => void }) {
  const { node, style, dragHandle } = props;
  const isSelected = node.isSelected;
  const isFolder = node.data.type === 'folder';
  const isOpen = node.isOpen;

  return (
    <div
      ref={dragHandle}
      style={style}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 text-sm cursor-pointer select-none',
        'hover:bg-accent/50 transition-colors',
        isSelected && 'bg-accent'
      )}
      onClick={() => node.toggle()}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {isFolder ? (
          <>
            <ChevronRight
              className={cn(
                'h-3 w-3 transition-transform flex-shrink-0',
                isOpen && 'rotate-90'
              )}
            />
            {isOpen ? (
              <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )}
          </>
        ) : (
          <div className="w-3.5" /> // Spacer for alignment
        )}
        {!isFolder && (
          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <span
          className={cn(
            'truncate text-xs',
            isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
          )}
        >
          {node.data.name}
        </span>
      </div>
    </div>
  );
}

