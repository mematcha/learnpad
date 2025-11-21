'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  FolderOpen,
  FileText,
  MessageSquare,
  Code,
  BarChart3,
  Plus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
  isOpen: boolean;
  className?: string;
  onAIAssistantToggle?: () => void;
}

export function Sidebar({ isOpen, className, onAIAssistantToggle }: SidebarProps) {
  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col border-r bg-background transition-all duration-300',
        !isOpen && 'w-16',
        className
      )}
    >
      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-2">
        <TooltipProvider>
          {/* Quick Actions */}
          <div className="space-y-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                    !isOpen && 'justify-center px-2'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  {isOpen && <span className="ml-2">New Project</span>}
                </Button>
              </TooltipTrigger>
              {!isOpen && (
                <TooltipContent side="right">
                  <p>New Project</p>
                </TooltipContent>
              )}
            </Tooltip>

            {isOpen && (
              <div className="px-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    className="pl-8"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Main Navigation */}
          <div className="space-y-1 pt-4">
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                    !isOpen && 'justify-center px-2'
                  )}
                >
                  <FileText className="h-4 w-4" />
                  {isOpen && <span className="ml-2">Notebooks</span>}
                </Button>
              </TooltipTrigger>
              {!isOpen && (
                <TooltipContent side="right">
                  <p>Notebooks</p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                    !isOpen && 'justify-center px-2'
                  )}
                >
                  <Code className="h-4 w-4" />
                  {isOpen && <span className="ml-2">Sandboxes</span>}
                </Button>
              </TooltipTrigger>
              {!isOpen && (
                <TooltipContent side="right">
                  <p>Code Sandboxes</p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                    !isOpen && 'justify-center px-2'
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                  {isOpen && <span className="ml-2">Progress</span>}
                </Button>
              </TooltipTrigger>
              {!isOpen && (
                <TooltipContent side="right">
                  <p>Learning Progress</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Project Tree - Only show when sidebar is open */}
        {isOpen && (
          <div className="pt-4">
            <div className="px-2 pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Recent Projects
              </h3>
            </div>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm font-normal"
              >
                <FileText className="mr-2 h-3 w-3" />
                Introduction to Python
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm font-normal"
              >
                <FileText className="mr-2 h-3 w-3" />
                Data Structures
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm font-normal"
              >
                <FileText className="mr-2 h-3 w-3" />
                Machine Learning Basics
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* AI Assistant Toggle */}
      <div className="border-t p-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={onAIAssistantToggle}
                className={cn(
                  'w-full justify-start',
                  !isOpen && 'justify-center px-2'
                )}
              >
                <MessageSquare className="h-4 w-4" />
                {isOpen && <span className="ml-2">AI Assistant</span>}
              </Button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="right">
                <p>AI Assistant</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
