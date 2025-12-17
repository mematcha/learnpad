'use client';

/**
 * Resizable and collapsible panel component
 */

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: 'left' | 'right';
  storageKey?: string;
}

export interface ResizablePanelRef {
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  isCollapsed: boolean;
}

export const ResizablePanel = forwardRef<ResizablePanelRef, ResizablePanelProps>(({
  children,
  defaultWidth = 400,
  minWidth = 200,
  maxWidth = 600,
  side = 'right',
  storageKey,
}, ref) => {
  // Load saved width and collapsed state from localStorage
  const getStoredWidth = () => {
    if (typeof window === 'undefined' || !storageKey) return defaultWidth;
    const stored = localStorage.getItem(storageKey);
    return stored ? parseInt(stored, 10) : defaultWidth;
  };

  const getStoredCollapsed = () => {
    if (typeof window === 'undefined' || !storageKey) return false;
    const stored = localStorage.getItem(`${storageKey}-collapsed`);
    return stored === 'true';
  };

  const [width, setWidth] = useState(getStoredWidth);
  const [isCollapsed, setIsCollapsed] = useState(getStoredCollapsed);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Save width to localStorage
  useEffect(() => {
    if (storageKey && !isCollapsed) {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [width, storageKey, isCollapsed]);

  // Save collapsed state to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`${storageKey}-collapsed`, isCollapsed.toString());
    }
  }, [isCollapsed, storageKey]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = side === 'right' 
        ? startXRef.current - e.clientX // Resizing from left edge
        : e.clientX - startXRef.current; // Resizing from right edge
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth, side]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const collapse = () => {
    setIsCollapsed(true);
  };

  const expand = () => {
    setIsCollapsed(false);
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    toggle: toggleCollapse,
    collapse,
    expand,
    isCollapsed,
  }));

  const resizeHandleSide = side === 'right' ? 'left' : 'right';

  return (
    <div
      ref={panelRef}
      className="relative flex flex-col h-full transition-all duration-200"
      style={{ 
        width: isCollapsed ? '0px' : `${width}px`,
        minWidth: isCollapsed ? '0px' : `${minWidth}px`,
        maxWidth: isCollapsed ? '0px' : `${maxWidth}px`,
        overflow: 'hidden',
      }}
    >
      {/* Resize handle */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className={`absolute ${resizeHandleSide}-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary transition-colors z-10 group`}
          aria-label="Resize panel"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary opacity-0 group-hover:opacity-20 transition-opacity" />
        </div>
      )}

      {/* Panel content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
});

ResizablePanel.displayName = 'ResizablePanel';

