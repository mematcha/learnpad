'use client';

import * as React from 'react';
import { Menu, BookOpen, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { LoginButton } from '@/components/auth/login-button';
import { useAuth } from '@/components/auth/auth-provider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
  hideSidebar?: boolean;
}

export function Header({ onMenuToggle, isSidebarOpen, hideSidebar = false }: HeaderProps) {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

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

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name || 'User'}
                          className="h-5 w-5 rounded-full"
                        />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      <span className="sr-only">User profile</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email || 'user@example.com'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <LoginButton variant="ghost" size="sm" className="h-7 px-3">
                  Sign In
                </LoginButton>
              )}
            </TooltipProvider>
          </nav>
        </div>
      </div>
    </header>
  );
}
