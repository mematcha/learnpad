'use client';

import * as React from 'react';
import { Menu, BookOpen, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { KeyboardShortcutsHelp } from '@/components/accessibility';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
  hideSidebar?: boolean;
}

export function Header({ onMenuToggle, isSidebarOpen, hideSidebar = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 max-w-screen-2xl items-center px-3 md:px-5">
        {!hideSidebar && (
          <div className="mr-2 hidden md:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="h-7 w-7"
            >
              <Menu className="h-3.5 w-3.5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <span className="font-bold text-xs md:text-sm tracking-tight">Learnpad</span>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-1 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none text-xs text-muted-foreground">
            {/* Workspace switcher will go here */}
          </div>
          
          <nav className="flex items-center space-x-1">
            <ThemeSwitcher />
            <KeyboardShortcutsHelp />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Settings className="h-3 w-3" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <User className="h-3 w-3" />
                    <span className="sr-only">User profile</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>User Profile</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>
        </div>
      </div>
    </header>
  );
}
