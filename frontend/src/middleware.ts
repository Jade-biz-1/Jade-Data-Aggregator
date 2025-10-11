/**
 * Next.js Middleware for route protection and authentication
 * Phase 8: Enhanced RBAC - Role-based route access control
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/account-inactive',
];

// Routes that require specific permissions (checked on client side)
// This is just for basic protection, detailed permission checking happens in components
const protectedRoutes: Record<string, string[]> = {
  '/users': ['admin', 'developer'],
  '/admin': ['admin', 'developer'],
  '/analytics': ['admin', 'developer', 'executive', 'designer'],
  '/pipelines': ['admin', 'developer', 'designer', 'executor', 'viewer'],
  '/connectors': ['admin', 'developer', 'designer', 'executor', 'viewer'],
  '/transformations': ['admin', 'developer', 'designer', 'executor', 'viewer'],
  '/monitoring': ['admin', 'developer', 'designer', 'executor'],
  '/dashboard': ['admin', 'developer', 'designer', 'executor', 'viewer', 'executive'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // TODO: Optionally decode JWT to check role here
  // For now, we'll let the client-side components handle detailed permission checks

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
