'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { FolderOpen, TerminalSquare, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
  isOpen: boolean;
  className?: string;
}

export function Sidebar({ isOpen, className }: SidebarProps) {
  const pathname = usePathname();
  const projectLabel = pathname?.startsWith('/notebook') ? 'TEST-PROJECT' : 'Projects';
  const [isProjectsOpen, setIsProjectsOpen] = React.useState(true);
  const [isSandboxesOpen, setIsSandboxesOpen] = React.useState(true);

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
                  {isOpen && <span className="ml-2">{projectLabel}</span>}
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
              <TooltipContent side="right">
                <p>{projectLabel}</p>
              </TooltipContent>
            )}
          </Tooltip>
          {isOpen && isProjectsOpen && (
            <div className="ml-8 space-y-1 text-xs text-muted-foreground">
              <p className="uppercase tracking-[0.2em] text-[0.6rem]">Active</p>
              <p className="text-foreground font-medium">{projectLabel}</p>
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
                  {isOpen && <span className="ml-2">Sandboxes</span>}
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
              <TooltipContent side="right">
                <p>Sandboxes</p>
              </TooltipContent>
            )}
          </Tooltip>
          {isOpen && isSandboxesOpen && (
            <div className="ml-8 space-y-1 text-xs text-muted-foreground">
              <p className="uppercase tracking-[0.2em] text-[0.6rem]">Quick Access</p>
              <ul className="space-y-0.5">
                <li className="text-foreground font-medium">Default Sandbox</li>
                <li>New Sandbox</li>
              </ul>
            </div>
          )}
        </TooltipProvider>
      </nav>
    </div>
  );
}
