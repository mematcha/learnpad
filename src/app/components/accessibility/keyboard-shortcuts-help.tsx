'use client';

import * as React from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface KeyboardShortcut {
  category: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const keyboardShortcuts: KeyboardShortcut[] = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['Tab'], description: 'Move to next focusable element' },
      { keys: ['Shift', 'Tab'], description: 'Move to previous focusable element' },
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
      { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    category: 'Editor',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save document' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' },
      { keys: ['Ctrl', 'A'], description: 'Select all' },
      { keys: ['Ctrl', 'F'], description: 'Find in document' },
      { keys: ['Ctrl', 'Enter'], description: 'Run code cell' },
    ],
  },
  {
    category: 'Formatting',
    shortcuts: [
      { keys: ['Ctrl', 'B'], description: 'Bold text' },
      { keys: ['Ctrl', 'I'], description: 'Italic text' },
      { keys: ['Ctrl', 'U'], description: 'Underline text' },
      { keys: ['Ctrl', '1'], description: 'Heading 1' },
      { keys: ['Ctrl', '2'], description: 'Heading 2' },
      { keys: ['Ctrl', '3'], description: 'Heading 3' },
    ],
  },
  {
    category: 'AI Assistant',
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'A'], description: 'Open AI assistant' },
      { keys: ['Escape'], description: 'Close AI assistant' },
      { keys: ['Enter'], description: 'Send message' },
      { keys: ['Shift', 'Enter'], description: 'New line in message' },
    ],
  },
  {
    category: 'Workspace',
    shortcuts: [
      { keys: ['Ctrl', 'N'], description: 'New project' },
      { keys: ['Ctrl', 'O'], description: 'Open project' },
      { keys: ['Ctrl', 'Shift', 'P'], description: 'Project settings' },
      { keys: ['Ctrl', 'Shift', 'E'], description: 'Export project' },
    ],
  },
];

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '/') {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const formatKeys = (keys: string[]) => {
    return keys.map((key, index) => (
      <React.Fragment key={key}>
        {index > 0 && <span className="mx-1 text-muted-foreground">+</span>}
        <Badge variant="outline" className="font-mono text-xs">
          {key}
        </Badge>
      </React.Fragment>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Show keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {keyboardShortcuts.map((category, categoryIndex) => (
              <div key={category.category}>
                <h3 className="font-semibold text-lg mb-3">{category.category}</h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, shortcutIndex) => (
                    <div
                      key={shortcutIndex}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {formatKeys(shortcut.keys)}
                      </div>
                    </div>
                  ))}
                </div>
                {categoryIndex < keyboardShortcuts.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Press <Badge variant="outline" className="font-mono text-xs">Ctrl</Badge>
            <span className="mx-1">+</span>
            <Badge variant="outline" className="font-mono text-xs">/</Badge>
            <span className="ml-1">to open this dialog anytime</span>
          </p>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
