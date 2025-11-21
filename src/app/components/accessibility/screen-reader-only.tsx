import * as React from 'react';
import { cn } from '@/lib/utils';

interface ScreenReaderOnlyProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * Component for content that should only be visible to screen readers
 */
export function ScreenReaderOnly({ 
  children, 
  className, 
  ...props 
}: ScreenReaderOnlyProps) {
  return (
    <span 
      className={cn('sr-only', className)} 
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Hook to announce messages to screen readers
 */
export function useScreenReaderAnnouncement() {
  const announce = React.useCallback((
    message: string, 
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, []);

  return announce;
}
