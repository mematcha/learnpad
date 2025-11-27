'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { FolderOpen, TerminalSquare, BookOpen, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
  isOpen: boolean;
  isChatOpen: boolean;
  onOpenChat: () => void;
  className?: string;
}

export function Sidebar({ isOpen, isChatOpen, onOpenChat, className }: SidebarProps) {
  const pathname = usePathname();
  const projectLabel = pathname?.startsWith('/notebook') ? 'TEST-PROJECT' : 'Projects';
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(true);
  const [isSandboxesOpen, setIsSandboxesOpen] = React.useState(true);
  const [isSourcesOpen, setIsSourcesOpen] = React.useState(true);

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
            <div className="ml-8 space-y-3 text-xs text-muted-foreground">
              <div>
                <ul className="space-y-1 text-foreground text-sm">
                  <li>
                    <div className="font-medium">📁 notebooks</div>
                    <ul className="ml-4 space-y-0.5 text-muted-foreground">
                      <li>
                        <button className="w-full rounded-md px-2 py-1 text-left text-xs text-foreground hover:bg-foreground/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                          📄 introduction.md
                        </button>
                      </li>
                      <li>
                        <button className="w-full rounded-md px-2 py-1 text-left text-xs text-foreground hover:bg-foreground/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                          📄 advanced-topics.md
                        </button>
                      </li>
                      <li>
                        <div className="font-medium">📁 experiments</div>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <div className="font-medium">📁 sandboxes</div>
                    <ul className="ml-4 space-y-0.5 text-muted-foreground">
                      <li>
                        <button className="w-full rounded-md px-2 py-1 text-left text-xs text-foreground hover:bg-foreground/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                          📄 python-basics.tsx
                        </button>
                      </li>
                      <li>
                        <button className="w-full rounded-md px-2 py-1 text-left text-xs text-foreground hover:bg-foreground/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                          📄 js-math-playground.tsx
                        </button>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <button className="w-full rounded-md px-2 py-1 text-left text-xs text-foreground hover:bg-foreground/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      📄 README.md
                    </button>
                  </li>
                </ul>
              </div>
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
