'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Theme, defaultTheme } from './theme-config';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('learnpad-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'high-contrast'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    setIsLoaded(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!isLoaded) return;
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'high-contrast');
    
    // Add current theme class
    if (theme === 'high-contrast') {
      root.classList.add('high-contrast');
      // Also check if user prefers dark mode for high-contrast
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    } else {
      root.classList.add(theme);
    }
  }, [theme, isLoaded]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('learnpad-theme', newTheme);
  };

  const toggleTheme = () => {
    const themeOrder: Theme[] = ['light', 'dark', 'high-contrast'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div data-theme-ready={isLoaded}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
