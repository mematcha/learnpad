'use client';

import * as React from 'react';
import { Wifi, WifiOff, Save, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBarProps {
  className?: string;
}

export function StatusBar({ className }: StatusBarProps) {
  const [isOnline, setIsOnline] = React.useState(true);
  const [lastSaved, setLastSaved] = React.useState<Date>(new Date());
  const [wordCount, setWordCount] = React.useState(0);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={cn(
        'flex h-6 items-center justify-between border-t bg-background px-4 text-xs text-muted-foreground',
        className
      )}
    >
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <Wifi className="h-3 w-3 text-success" />
          ) : (
            <WifiOff className="h-3 w-3 text-destructive" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Save Status */}
        <div className="flex items-center space-x-1">
          <Save className="h-3 w-3" />
          <span>Saved</span>
        </div>

        {/* Last Saved Time */}
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Last saved: {formatTime(lastSaved)}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Word Count */}
        <div className="flex items-center space-x-1">
          <FileText className="h-3 w-3" />
          <span>{wordCount} words</span>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-1">
          <span>Progress: 75%</span>
        </div>

        {/* Current Position */}
        <div className="flex items-center space-x-1">
          <span>Ln 1, Col 1</span>
        </div>
      </div>
    </div>
  );
}
