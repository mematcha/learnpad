/**
 * Design tokens for programmatic access
 * Based on Constitution P2 (Typography) and P3 (Design Language)
 */

export const typography = {
  fontSize: {
    base: '0.875rem', // 14px
    sm: '0.8125rem',  // 13px
    xs: '0.6875rem',  // 11px
  },
  lineHeight: {
    base: 1.5,
    tight: 1.4,
    relaxed: 1.6,
  },
  fontFamily: {
    sans: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
    mono: 'var(--font-geist-mono), "Courier New", monospace',
  },
} as const;

export const spacing = {
  unit: '0.25rem', // 4px base unit
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
} as const;

export const colors = {
  dark: {
    bgPrimary: '#0a0a0a',
    bgSecondary: '#1a1a1a',
    textPrimary: '#ededed',
    textSecondary: '#a0a0a0',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f5f5f5',
    textPrimary: '#171717',
    textSecondary: '#666666',
    border: 'rgba(0, 0, 0, 0.1)',
  },
} as const;

export const breakpoints = {
  mobile: 640,
  tablet: 1024,
} as const;

export const touchTarget = {
  minSize: 44, // pixels - Constitution P9
} as const;

