'use client';

import * as React from 'react';
import { Moon, Sun, Contrast } from 'lucide-react';
import { useTheme } from '@/lib/themes/theme-provider';
import { themes } from '@/lib/themes/theme-config';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const getIcon = (themeName: string) => {
    switch (themeName) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'high-contrast':
        return <Contrast className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1 rounded-md border p-1">
        {themes.map((themeOption) => (
          <Tooltip key={themeOption.value}>
            <TooltipTrigger asChild>
              <Button
                variant={theme === themeOption.value ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setTheme(themeOption.value)}
                className="h-8 w-8"
              >
                {getIcon(themeOption.value)}
                <span className="sr-only">{themeOption.name}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{themeOption.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
