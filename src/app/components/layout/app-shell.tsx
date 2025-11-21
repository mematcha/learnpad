'use client';

import * as React from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { StatusBar } from './status-bar';
import { AIAssistantPanel } from '@/components/ai';
import { SkipLinks } from '@/components/accessibility';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleAIAssistant = () => {
    setIsAIAssistantOpen(!isAIAssistantOpen);
  };

  return (
    <div className={cn('flex h-screen flex-col', className)}>
      <SkipLinks />
      <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex flex-1 overflow-hidden">
        <aside id="sidebar-navigation" className="flex-shrink-0">
          <Sidebar 
            isOpen={isSidebarOpen} 
            onAIAssistantToggle={toggleAIAssistant}
          />
        </aside>
        
        <main id="main-content" className="flex-1 overflow-hidden" role="main">
          <div className="h-full overflow-auto">
            {children}
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
