'use client';

import * as React from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChatInterface } from './chat-interface';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function AIAssistantPanel({ isOpen, onClose, className }: AIAssistantPanelProps) {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed right-4 bottom-4 z-50 transition-all duration-300',
        isExpanded ? 'inset-4' : isMinimized ? 'w-80 h-12' : 'w-80 h-96',
        className
      )}
    >
      <Card className="h-full flex flex-col shadow-lg border-2">
        {/* Panel Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <h3 className="font-semibold text-sm">AI Assistant</h3>
          
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-6 w-6 p-0"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMinimized ? 'Restore' : 'Minimize'}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-6 w-6 p-0"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExpanded ? 'Restore' : 'Expand'}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Close</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Panel Content */}
        {!isMinimized && (
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        )}
      </Card>
    </div>
  );
}
