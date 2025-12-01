'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkipLink {
  href: string;
  label: string;
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#sidebar-navigation', label: 'Skip to navigation' },
  { href: '#ai-assistant', label: 'Skip to AI assistant' },
];

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

export function SkipLinks({ links = defaultSkipLinks, className }: SkipLinksProps) {
  return (
    <div className={cn('sr-only focus-within:not-sr-only', className)}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="absolute top-4 left-4 z-[100] px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
