import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection and authentication checks
 * Blocks unauthenticated access to protected routes
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token');

  // Protected routes that require authentication
  const protectedRoutes = [
    '/settings',
    // Dynamic routes need pattern matching
  ];

  // Check if pathname matches protected routes
  const isProtectedRoute =
    pathname.startsWith('/settings') ||
    pathname.match(/^\/[^/]+\/settings$/); // Matches /[notebookid]/settings

  // Public routes that don't require authentication
  const isPublicRoute = pathname === '/' || pathname === '/login';

  // Shared notebook route - accessible without auth if notebook is shared
  const isNotebookRoute = pathname.match(/^\/[a-f0-9-]{36}$/); // UUID pattern

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow access to public routes, notebook routes (will check permissions server-side), and authenticated protected routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

