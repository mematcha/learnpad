'use client';

import * as React from 'react';
import { Plus, Play, Save, MoreHorizontal, FileText, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RichTextEditor } from './rich-text-editor';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type CellType = 'text' | 'code';

interface NotebookCell {
  id: string;
  type: CellType;
  content: string;
  output?: string;
}

interface NotebookEditorProps {
  initialCells?: NotebookCell[];
  onSave?: (cells: NotebookCell[]) => void;
  className?: string;
  readOnly?: boolean;
  hideActions?: boolean;
}

export function NotebookEditor({
  initialCells = [
    {
      id: '1',
      type: 'text',
      content: '<h1>Welcome to Learnpad</h1><p>This is your interactive notebook. You can add text cells with rich formatting and mathematical notation, as well as code cells for programming exercises.</p>',
    },
  ],
  onSave,
  className,
  readOnly = false,
  hideActions = false,
}: NotebookEditorProps) {
  const [cells, setCells] = React.useState<NotebookCell[]>(initialCells);
  const [activeCell, setActiveCell] = React.useState<string | null>(null);

  const addCell = (type: CellType, afterId?: string) => {
    if (readOnly) return;
    const newCell: NotebookCell = {
      id: Date.now().toString(),
      type,
      content: '',
    };

    if (afterId) {
      const index = cells.findIndex((cell) => cell.id === afterId);
      const newCells = [...cells];
      newCells.splice(index + 1, 0, newCell);
      setCells(newCells);
    } else {
      setCells([...cells, newCell]);
    }

    setActiveCell(newCell.id);
  };

  const updateCell = (id: string, content: string) => {
    if (readOnly) return;
    setCells((prev) =>
      prev.map((cell) => (cell.id === id ? { ...cell, content } : cell))
    );
  };

  const deleteCell = (id: string) => {
    if (readOnly) return;
    if (cells.length > 1) {
      setCells((prev) => prev.filter((cell) => cell.id !== id));
    }
  };

  const runCodeCell = (id: string) => {
    // Placeholder for code execution
    const cell = cells.find((c) => c.id === id);
    if (cell && cell.type === 'code') {
      // Simulate code execution
      setCells((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, output: `Output for: ${cell.content.slice(0, 50)}...` }
            : c
        )
      );
    }
  };

  const handleSave = () => {
    onSave?.(cells);
  };

  return (
    <div className={cn('max-w-4xl mx-auto p-6 space-y-4', className)}>
      {/* Notebook Header */}
      {!hideActions && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Untitled Notebook</h1>
            <p className="text-sm text-muted-foreground">
              Last saved: {new Date().toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save notebook</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More options</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Notebook Cells */}
      <div className="space-y-4">
        {cells.map((cell, index) => (
          <NotebookCell
            key={cell.id}
            cell={cell}
            isActive={activeCell === cell.id}
            onFocus={() => setActiveCell(cell.id)}
            onBlur={() => setActiveCell(null)}
            onChange={(content) => updateCell(cell.id, content)}
            onDelete={() => deleteCell(cell.id)}
            onRun={() => runCodeCell(cell.id)}
            onAddCell={(type) => addCell(type, cell.id)}
            canDelete={cells.length > 1}
            readOnly={readOnly}
          />
        ))}
      </div>

      {!hideActions && (
        <div className="flex justify-center pt-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCell('text')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Add Text Cell
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCell('code')}
            >
              <Code2 className="h-4 w-4 mr-2" />
              Add Code Cell
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface NotebookCellProps {
  cell: NotebookCell;
  isActive: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (content: string) => void;
  onDelete: () => void;
  onRun: () => void;
  onAddCell: (type: CellType) => void;
  canDelete: boolean;
  readOnly: boolean;
}

function NotebookCell({
  cell,
  isActive,
  onFocus,
  onBlur,
  onChange,
  onDelete,
  onRun,
  onAddCell,
  canDelete,
  readOnly,
}: NotebookCellProps) {
  return (
    <Card
      className={cn(
        'border-none bg-transparent shadow-none transition-all duration-200',
        isActive && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {cell.type === 'text' ? (
              <FileText className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Code2 className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium capitalize">
              {cell.type} Cell
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {cell.type === 'code' && !readOnly && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onRun}>
                      <Play className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Run cell</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            

            {canDelete && !readOnly && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onDelete}
                      className="text-destructive hover:text-destructive"
                    >
                      ×
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete cell</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {cell.type === 'text' ? (
          <RichTextEditor
            content={cell.content}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Enter your text here. You can use markdown, math formulas with $LaTeX$, and rich formatting."
            editable={!readOnly}
            showToolbar={!readOnly}
            bordered={!readOnly}
          />
        ) : (
            <div className="space-y-2">
              <textarea
                value={cell.content}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder="# Enter your code here
print('Hello, Learnpad!')
"
                className={cn(
                  'w-full min-h-[120px] p-3 font-mono text-sm border rounded-md bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 resize-none',
                  readOnly && 'pointer-events-none opacity-70'
                )}
                readOnly={readOnly}
              />
              
              {cell.output && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">Output:</div>
                  <pre className="text-sm font-mono">{cell.output}</pre>
                </div>
              )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
