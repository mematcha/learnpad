/**
 * Protected route wrapper component for Server Components
 * Verifies authentication before rendering children
 */

import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth/server-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export async function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const user = await getServerUser();

  if (!user) {
    redirect(redirectTo);
  }

  return <>{children}</>;
}

