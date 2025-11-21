'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen } from 'lucide-react';
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
                  'w-full justify-start',
                  !isOpen && 'justify-center px-2'
                )}
              >
                <FolderOpen className="h-4 w-4" />
                {isOpen && <span className="ml-2">Projects</span>}
              </Button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="right">
                <p>Projects</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </nav>
    </div>
  );
}
