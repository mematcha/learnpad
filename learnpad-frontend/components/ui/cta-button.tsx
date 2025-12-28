/**
 * Call-to-action button component with proper ARIA labels and keyboard support
 */

import Link from 'next/link';
import type { ReactNode } from 'react';

interface CTAButtonProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  ariaLabel?: string;
}

export function CTAButton({
  href,
  children,
  variant = 'primary',
  ariaLabel,
}: CTAButtonProps) {
  const baseClasses =
    'px-4 py-2 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-2 min-h-[44px] min-w-[44px] flex items-center justify-center';
  const variantClasses =
    variant === 'primary'
      ? 'bg-text-primary text-bg-primary hover:opacity-90'
      : 'border border-color hover:bg-secondary';

  return (
    <Link
      href={href}
      className={`${baseClasses} ${variantClasses}`}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}

