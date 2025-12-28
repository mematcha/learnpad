/**
 * Server Component auth provider wrapper
 * Provides auth state to Server Components
 */

import { getServerUser } from '@/lib/auth/server-auth';
import type { User } from '@/types/entities';

interface AuthProviderServerProps {
  children: (user: User | null) => React.ReactNode;
}

export async function AuthProviderServer({ children }: AuthProviderServerProps) {
  const user = await getServerUser();
  return <>{children(user)}</>;
}

