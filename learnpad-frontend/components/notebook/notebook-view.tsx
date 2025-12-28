'use client';

/**
 * Main notebook view component
 * Combines header, file tree sidebar, and content area
 */

import { useState, useEffect, useRef } from 'react';
import type { Notebook, FileTree } from '@/types/entities';
import { NotebookHeader } from './notebook-header';
import { FileTree as FileTreeComponent } from './file-tree';
import { NotebookContent } from './notebook-content';
import { EditableMarkdown } from './editable-markdown';
import { ChatWindow } from './chat-window';
import { Outline } from './outline';
import { StudioSidebar } from './studio-sidebar';
import { ResizablePanel, type ResizablePanelRef } from './resizable-panel';

interface NotebookViewProps {
  notebook: Notebook;
  fileTree: FileTree;
  fileContents: Record<string, string>;
}

export function NotebookView({
  notebook,
  fileTree,
  fileContents,
}: NotebookViewProps) {
  const [selectedFile, setSelectedFile] = useState<string>('/README.md');
  const [isChatView, setIsChatView] = useState(false);
  const [isOutlineVisible, setIsOutlineVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const filesPanelRef = useRef<ResizablePanelRef>(null);
  const studioPanelRef = useRef<ResizablePanelRef>(null);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
  };

  const handleChatToggle = () => {
    setIsChatView(!isChatView);
  };

  // Keyboard shortcuts for panel toggling (VSCode/Cursor style)
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Cmd+B or Ctrl+B - Toggle Files Panel (VSCode style)
      // Check for both lowercase and uppercase 'b' to handle different keyboard layouts
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        e.stopPropagation();
        filesPanelRef.current?.toggle();
      }
      
      // Cmd+Shift+S or Ctrl+Shift+S - Toggle Studio Panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        studioPanelRef.current?.toggle();
      }

      // Cmd+E or Ctrl+E - Toggle Edit Mode (only when not in a textarea/input)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (e.key === 'e' || e.key === 'E')) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
          e.preventDefault();
          e.stopPropagation();
          setIsEditMode(!isEditMode);
        }
      }

      // Cmd+Shift+O or Ctrl+Shift+O - Toggle Outline
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        e.stopPropagation();
        setIsOutlineVisible((prev) => !prev);
      }
    };

    // Use capture phase to catch the event before other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isEditMode]);

  const getFileContent = (filePath: string): string => {
    // Use edited content if available, otherwise use original
    if (editedContent[filePath]) {
      return editedContent[filePath];
    }
    return fileContents[filePath] || `# ${filePath}\n\nThis is a sample file. Content for this file is not yet available.\n\nYou can navigate through the file tree to explore different files in this notebook.`;
  };

  const handleContentChange = (filePath: string, newContent: string) => {
    setEditedContent((prev) => ({
      ...prev,
      [filePath]: newContent,
    }));
  };

  const handleSave = async () => {
    // TODO: Implement save to API
    console.log('Saving content:', editedContent);
    // For now, just update the fileContents
    // In production, this would call an API to save the file
  };

  return (
    <div className="h-screen bg-primary flex flex-col overflow-hidden">
      <div className="container mx-auto px-6 py-4 flex-1 flex flex-col min-h-0 max-w-[1920px] overflow-hidden">
        <NotebookHeader 
          notebook={notebook} 
          canEdit={true}
          onChatToggle={handleChatToggle}
          isChatView={isChatView}
          onOutlineToggle={() => setIsOutlineVisible(!isOutlineVisible)}
          isOutlineVisible={isOutlineVisible}
          onEditModeToggle={() => setIsEditMode(!isEditMode)}
          isEditMode={isEditMode}
        />
        
        <div className="mt-4 flex flex-1 gap-8 min-h-0 overflow-hidden">
          {/* Sidebar - File Tree - Resizable & Collapsible */}
          <aside className="flex-shrink-0 flex flex-col h-full relative z-10 overflow-hidden">
            <ResizablePanel 
              ref={filesPanelRef}
              defaultWidth={256} 
              minWidth={200} 
              maxWidth={400}
              side="right"
              storageKey={`notebook-${notebook.notebook_id}-files-width`}
            >
              <div className="h-full pr-2 overflow-hidden flex flex-col">
                <FileTreeComponent
                  fileTree={fileTree}
                  notebookId={notebook.notebook_id}
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                />
              </div>
            </ResizablePanel>
          </aside>

          {/* Main Content Area - Shows Content or Chat - Only this scrolls */}
          <main className="flex-1 flex flex-col min-h-0 overflow-y-auto relative z-0">
            {isChatView ? (
              <div className="h-full pr-4">
                <ChatWindow notebookId={notebook.notebook_id} />
              </div>
            ) : (
              <div className="relative pr-4 min-h-full flex">
                <div className={isOutlineVisible ? 'flex-1 pr-4' : 'flex-1'}>
                  {isEditMode ? (
                    <EditableMarkdown
                      content={getFileContent(selectedFile)}
                      onChange={(newContent) => handleContentChange(selectedFile, newContent)}
                      onSave={handleSave}
                      notebookId={notebook.notebook_id}
                      filePath={selectedFile}
                    />
                  ) : (
                    <NotebookContent
                      notebookId={notebook.notebook_id}
                      filePath={selectedFile}
                      content={getFileContent(selectedFile)}
                    />
                  )}
                </div>
                {/* Outline Overlay - Sticky position, fixed at top of scroll viewport, right side, 50% height, scrollable internally */}
                {isOutlineVisible && (
                  <div className="sticky top-0 self-start w-64 h-1/2 bg-secondary border border-color rounded-md shadow-lg z-20 overflow-y-auto pointer-events-auto flex-shrink-0">
                    <Outline
                      content={getFileContent(selectedFile)}
                      onHeadingClick={(headingId) => {
                        const element = document.getElementById(headingId);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Studio Sidebar - Right Sidebar - Resizable & Collapsible */}
          <aside className="flex-shrink-0 flex flex-col h-full relative z-10 overflow-hidden">
            <ResizablePanel 
              ref={studioPanelRef}
              defaultWidth={256} 
              minWidth={200} 
              maxWidth={400}
              side="left"
              storageKey={`notebook-${notebook.notebook_id}-studio-width`}
            >
              <div className="h-full pl-2 overflow-hidden flex flex-col">
                <StudioSidebar notebookId={notebook.notebook_id} />
              </div>
            </ResizablePanel>
          </aside>
        </div>
      </div>
    </div>
  );
}

