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

// Role hierarchy for permission checking
const roleHierarchy: Record<string, number> = {
  'viewer': 1,
  'executor': 2,
  'designer': 3,
  'executive': 4,
  'developer': 5,
  'admin': 6,
};

// Routes with minimum required role level
// Routes require authentication but no specific role are not listed here
const protectedRoutes: Record<string, { minRole: string; exact?: boolean }> = {
  // User management - Admin or Developer only
  '/users': { minRole: 'developer' },

  // Admin routes - Admin or Developer only
  '/admin/maintenance': { minRole: 'developer' },
  '/admin/activity-logs': { minRole: 'developer' },
  '/admin/settings': { minRole: 'admin', exact: true }, // Admin only

  // Analytics - Executive and above
  '/analytics': { minRole: 'executive' },

  // Monitoring - Executor and above
  '/monitoring': { minRole: 'executor' },

  // Design routes - Designer and above
  '/pipelines/create': { minRole: 'designer' },
  '/pipelines/edit': { minRole: 'designer' },
  '/connectors/create': { minRole: 'designer' },
  '/connectors/edit': { minRole: 'designer' },
  '/transformations/create': { minRole: 'designer' },
  '/transformations/edit': { minRole: 'designer' },

  // Execution routes - Executor and above
  '/pipelines/execute': { minRole: 'executor' },

  // All authenticated users can access: dashboard, view pipelines/connectors/transformations, settings
};

function hasRequiredRole(userRole: string, requiredRole: string, exact: boolean = false): boolean {
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  if (exact) {
    return userLevel === requiredLevel;
  }

  return userLevel >= requiredLevel;
}

function getUserRoleFromToken(token: string): string | null {
  try {
    // Decode JWT token (simple base64 decode for the payload)
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for protected routes
  const userRole = getUserRoleFromToken(token);

  if (!userRole) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if route requires specific role
  for (const [route, config] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!hasRequiredRole(userRole, config.minRole, config.exact)) {
        // User doesn't have required role, redirect to dashboard with error
        const dashboardUrl = new URL('/dashboard', request.url);
        dashboardUrl.searchParams.set('error', 'insufficient_permissions');
        dashboardUrl.searchParams.set('required_role', config.minRole);
        return NextResponse.redirect(dashboardUrl);
      }
      break;
    }
  }

  // Allow access
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
