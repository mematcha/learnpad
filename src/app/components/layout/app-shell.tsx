'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { StatusBar } from './status-bar';
import { AIAssistantPanel, ChatInterface } from '@/components/ai';
import { SkipLinks } from '@/components/accessibility';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const pathname = usePathname();
  const hideSidebar = pathname === '/';

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleAIAssistant = () => {
    setIsAIAssistantOpen(!isAIAssistantOpen);
  };

  const handleToggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  return (
    <div className={cn('flex h-screen flex-col', className)}>
      <SkipLinks />
      <Header
        onMenuToggle={toggleSidebar}
        isSidebarOpen={isSidebarOpen && !hideSidebar}
        hideSidebar={hideSidebar}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {!hideSidebar && (
          <aside id="sidebar-navigation" className="flex-shrink-0">
            <React.Suspense fallback={<div className="w-64 h-full bg-muted animate-pulse" />}>
              <Sidebar
                isOpen={isSidebarOpen}
                isChatOpen={isChatOpen}
                onOpenChat={handleToggleChat}
              />
            </React.Suspense>
          </aside>
        )}
        
        <main
          id="main-content"
          className={cn(
            'flex-1 overflow-hidden',
            hideSidebar && 'px-4'
          )}
          role="main"
        >
          <div className="h-full overflow-auto">
            {isChatOpen ? <ChatInterface className="h-full" /> : children}
          </div>
        </main>
      </div>
      
      <StatusBar />
      
      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
      />
    </div>
  );
}
