'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';
import { FolderOpen, TerminalSquare, BookOpen, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FileTree } from '@/components/workspace';
import { notebookAPI } from '@/lib/api/client';
import { transformApiTreeToArborist, FileTreeNode } from '@/lib/utils/tree-utils';

interface SidebarProps {
  isOpen: boolean;
  isChatOpen: boolean;
  onOpenChat: () => void;
  notebookId?: string;
  className?: string;
}

export function Sidebar({ isOpen, isChatOpen, onOpenChat, notebookId, className }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectLabel = pathname?.startsWith('/notebook') ? 'TEST-PROJECT' : 'Projects';
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(true);
  const [isSandboxesOpen, setIsSandboxesOpen] = React.useState(true);
  const [isSourcesOpen, setIsSourcesOpen] = React.useState(true);
  
  // File tree state
  const [fileTreeData, setFileTreeData] = React.useState<FileTreeNode[]>([]);
  const [isLoadingTree, setIsLoadingTree] = React.useState(false);
  const [treeError, setTreeError] = React.useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = React.useState<string | undefined>();

  // Extract notebook ID from URL or use prop
  const currentNotebookId = React.useMemo(() => {
    if (notebookId) return notebookId;
    if (pathname?.startsWith('/notebook')) {
      // Try to extract from URL path or search params
      const pathParts = pathname.split('/');
      if (pathParts.length > 2 && pathParts[2]) {
        return pathParts[2];
      }
      return searchParams?.get('id') || undefined;
    }
    return undefined;
  }, [pathname, searchParams, notebookId]);

  // Fetch file tree when notebook ID is available
  React.useEffect(() => {
    if (!currentNotebookId || !isProjectsOpen || !isOpen) {
      setFileTreeData([]);
      return;
    }

    setIsLoadingTree(true);
    setTreeError(null);

    notebookAPI
      .getNotebookTree(currentNotebookId)
      .then((response) => {
        const tree = response.tree || {};
        const transformed = transformApiTreeToArborist(tree);
        setFileTreeData(transformed);
      })
      .catch((error) => {
        console.error('Failed to load file tree:', error);
        setTreeError('Failed to load file tree');
        setFileTreeData([]);
      })
      .finally(() => {
        setIsLoadingTree(false);
      });
  }, [currentNotebookId, isProjectsOpen, isOpen]);

  const handleFileSelect = React.useCallback((node: FileTreeNode) => {
    setSelectedFilePath(node.path);
    // TODO: Handle file selection (e.g., open file in editor)
    console.log('Selected file:', node.path);
  }, []);

  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r bg-background transition-all duration-300',
        !isOpen && 'w-16',
        className
      )}
    >
      <nav className="flex-1 space-y-2 p-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-between',
                  !isOpen && 'justify-center px-2'
                )}
                onClick={() => setIsProjectsOpen((prev) => !prev)}
                aria-expanded={isProjectsOpen}
              >
                <div className="flex items-center">
                  <FolderOpen className="h-4 w-4" />
                  {isOpen && <span className="ml-2 text-xs font-medium">{projectLabel}</span>}
                </div>
                {isOpen && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isProjectsOpen ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                )}
              </Button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="right" className="text-xs leading-none py-1 px-2">
                <p className="text-xs font-medium">{projectLabel}</p>
              </TooltipContent>
            )}
          </Tooltip>
          {isOpen && isProjectsOpen && (
            <div className="ml-2 mt-2">
              {currentNotebookId ? (
                <>
                  {isLoadingTree ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : treeError ? (
                    <div className="px-2 py-4 text-xs text-destructive">
                      {treeError}
                    </div>
                  ) : fileTreeData.length > 0 ? (
                    <div className="max-h-[calc(100vh-300px)] overflow-auto">
                      <FileTree
                        data={fileTreeData}
                        onSelect={handleFileSelect}
                        selectedPath={selectedFilePath}
                        height={Math.min(fileTreeData.length * 28, 400)}
                      />
                    </div>
                  ) : (
                    <div className="px-2 py-4 text-xs text-muted-foreground">
                      No files found
                    </div>
                  )}
                </>
              ) : (
                <div className="px-2 py-4 text-xs text-muted-foreground">
                  Open a notebook to view files
                </div>
              )}
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-between',
                  !isOpen && 'justify-center px-2'
                )}
                onClick={() => setIsSandboxesOpen((prev) => !prev)}
                aria-expanded={isSandboxesOpen}
              >
                <div className="flex items-center">
                  <TerminalSquare className="h-4 w-4" />
                  {isOpen && <span className="ml-2 text-xs font-medium">Sandboxes</span>}
                </div>
                {isOpen && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isSandboxesOpen ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                )}
              </Button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="right" className="text-xs leading-none py-1 px-2">
                <p className="text-xs font-medium">Sandboxes</p>
              </TooltipContent>
            )}
          </Tooltip>
          {isOpen && isSandboxesOpen && (
            <div className="ml-8 space-y-1 text-xs text-muted-foreground">
              <ul className="space-y-0.5 text-xs">
                <li>
                  <button className="w-full rounded-md px-2 py-1 text-left text-xs text-foreground hover:bg-foreground/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    Default Sandbox
                  </button>
                </li>
              </ul>
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-between',
                  !isOpen && 'justify-center px-2'
                )}
                onClick={() => setIsSourcesOpen((prev) => !prev)}
                aria-expanded={isSourcesOpen}
              >
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4" />
                  {isOpen && <span className="ml-2 text-xs font-medium">Sources</span>}
                </div>
                {isOpen && (
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      isSourcesOpen ? 'rotate-0' : '-rotate-90'
                    )}
                  />
                )}
              </Button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="right" className="text-xs leading-none py-1 px-2">
                <p className="text-xs font-medium">Sources</p>
              </TooltipContent>
            )}
          </Tooltip>
          {isOpen && isSourcesOpen && (
            <div className="ml-8 space-y-1 text-xs text-muted-foreground">
              <ul className="space-y-0.5 text-sm">
                <li>
                  <button className="w-full rounded-md px-2 py-1 text-left text-xs text-foreground hover:bg-foreground/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    file1.pdf
                  </button>
                </li>
                <li>
                  <button className="w-full rounded-md px-2 py-1 text-left text-xs text-foreground hover:bg-foreground/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    file2.pdf
                  </button>
                </li>
                <li>
                  <button className="w-full rounded-md px-2 py-1 text-left text-xs text-foreground hover:bg-foreground/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    file3.pdf
                  </button>
                </li>
              </ul>
            </div>
          )}
        </TooltipProvider>
      </nav>

      <div className="p-2">
        <button
          type="button"
          onClick={onOpenChat}
          className="w-full rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isChatOpen ? 'Close Chat' : 'Open Chat'}
        </button>
      </div>
    </div>
  );
}
