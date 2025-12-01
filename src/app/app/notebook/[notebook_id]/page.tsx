'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout';
import { NotebookView } from '@/components/editor/notebook-view';
import { NotebookEditor } from '@/components/editor/notebook-editor';
import { Button } from '@/components/ui/button';
import { Eye, Code2, X, ArrowLeft, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { notebookAPI } from '@/lib/api/client';
import { NotebookLoader } from '@/components/ui/notebook-loader';
import { useAuthStore } from '@/lib/stores/auth-store';

interface NotebookFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  updated?: string;
  content?: string;
}

interface NotebookTree {
  [key: string]: {
    type: 'file' | 'folder';
    path: string;
    size?: number;
    updated?: string;
    children?: NotebookTree;
  };
}

export default function DynamicNotebookPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const notebookId = params.notebook_id as string;

  const [mode, setMode] = React.useState<'view' | 'code'>('view');
  const [chatMode, setChatMode] = React.useState<'teach' | 'chat'>('teach');
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [notebookData, setNotebookData] = React.useState<any>(null);
  const [notebookTree, setNotebookTree] = React.useState<NotebookTree | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<NotebookFile | null>(null);
  const [fileContent, setFileContent] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load notebook data on mount
  React.useEffect(() => {
    if (!notebookId || !user?.sub) return;

    loadNotebook();
  }, [notebookId, user?.sub]);

  const loadNotebook = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get notebook details
      const notebookDetails = await notebookAPI.getNotebook(notebookId);
      setNotebookData(notebookDetails);

      // Get notebook tree structure
      const tree = await notebookAPI.getNotebookTree(notebookId);
      setNotebookTree(tree);

      // Load the main README file by default
      try {
        const readmeContent = await notebookAPI.listNotebookFiles(notebookId, '');
        const readmeFile = readmeContent.files?.find((f: any) => f.name === 'README.md');
        if (readmeFile) {
          const content = await notebookAPI.getNotebookFile(notebookId, 'README.md');
          setFileContent(content.content);
          setSelectedFile({
            name: 'README.md',
            path: 'README.md',
            type: 'file',
            content: content.content
          });
        }
      } catch (err) {
        console.warn('Could not load README.md:', err);
      }

    } catch (err: any) {
      console.error('Failed to load notebook:', err);
      let errorMessage = 'Failed to load notebook. Please try again.';

      if (err?.response?.status === 404) {
        errorMessage = 'Notebook not found.';
      } else if (err?.response?.status === 403) {
        errorMessage = 'You do not have permission to view this notebook.';
      } else if (err?.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFileContent = async (filePath: string) => {
    try {
      const content = await notebookAPI.getNotebookFile(notebookId, filePath);
      setFileContent(content.content);
      setSelectedFile({
        name: filePath.split('/').pop() || filePath,
        path: filePath,
        type: 'file',
        content: content.content
      });
    } catch (err) {
      console.error('Failed to load file:', err);
      setError('Failed to load file content.');
    }
  };

  const handleFileClick = (file: NotebookFile) => {
    if (file.type === 'file') {
      loadFileContent(file.path);
    }
  };

  const renderFileTree = (tree: NotebookTree, level = 0): React.ReactNode => {
    return Object.entries(tree).map(([name, item]) => (
      <div key={item.path} style={{ paddingLeft: `${level * 16}px` }}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start text-left font-normal h-8',
            selectedFile?.path === item.path && 'bg-accent'
          )}
          onClick={() => handleFileClick({
            name,
            path: item.path,
            type: item.type as 'file' | 'folder'
          })}
        >
          <span className="truncate">{name}</span>
        </Button>
        {item.type === 'folder' && item.children && (
          <div>
            {renderFileTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <NotebookLoader
            title="Loading Notebook"
            message="Retrieving your personalized learning content..."
            status="generating"
          />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-lg font-semibold">Error Loading Notebook</span>
          </div>
          <p className="text-muted-foreground text-center max-w-md">{error}</p>
          <div className="flex space-x-2">
            <Button onClick={() => router.push('/workspace')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workspace
            </Button>
            <Button onClick={loadNotebook}>
              Try Again
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-full">
        {/* File Tree Sidebar */}
        <div className="w-64 border-r bg-muted/20 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm truncate">
              {notebookData?.subject || 'Notebook'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              ID: {notebookId}
            </p>
          </div>

          <div className="flex-1 overflow-auto p-2">
            {notebookTree && renderFileTree(notebookTree)}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-2 px-4 pt-4 border-b">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/workspace')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {selectedFile && (
                <span className="text-sm text-muted-foreground truncate">
                  {selectedFile.path}
                </span>
              )}
            </div>

            <div className="inline-flex rounded-md border bg-muted/40 p-0.5 text-xs">
              <ToggleButton
                icon={<Eye className="h-3.5 w-3.5" />}
                label="View"
                isActive={mode === 'view'}
                onClick={() => setMode('view')}
              />
              <ToggleButton
                icon={<Code2 className="h-3.5 w-3.5" />}
                label="Code"
                isActive={mode === 'code'}
                onClick={() => setMode('code')}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {selectedFile ? (
              mode === 'view' ? (
                <NotebookView content={fileContent} />
              ) : (
                <div className="mx-auto max-w-5xl px-4 py-6">
                  <NotebookEditor initialCells={[{ id: 'content', type: 'text', content: fileContent }]} hideActions />
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Select a file to view its contents</p>
                </div>
              </div>
            )}

            {isChatOpen && (
              <div className="border-t mt-6 pt-4 relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                  className="absolute top-2 right-2 z-10 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
                <ChatInterface
                  className="max-h-[500px]"
                  mode={chatMode}
                  onModeChange={setChatMode}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

interface ToggleButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ToggleButton({ icon, label, isActive, onClick }: ToggleButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-colors',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

// Import ChatInterface (assuming it exists)
import { ChatInterface } from '@/components/ai/chat-interface';
import { BookOpen } from 'lucide-react';
