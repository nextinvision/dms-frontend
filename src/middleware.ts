
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { hasAccess } from './shared/constants/routes';
import type { UserRole } from './shared/types/auth.types';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    console.log(`[Middleware] Processing ${pathname}`);
    const response = NextResponse.next();

    // Add aggressive cache busting headers for all document requests (HTML)
    // Exclude static assets, API, and Next.js internals which are handled separately
    if (!pathname.startsWith('/_next') && !pathname.startsWith('/api') && !pathname.includes('.')) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        response.headers.set('Surrogate-Control', 'no-store');
    }

    // Public paths - allow access without auth but with headers applied
    // NOTE: Don't clear cookies on login page here - let the client-side handle it
    // to avoid interfering with successful login redirects
    if (pathname === '/' || pathname.startsWith('/_next') || pathname.includes('/api/') || pathname.includes('.')) {
        return response;
    }

    // Get role from cookie
    const roleCookie = request.cookies.get('auth_role')?.value;
    const tokenCookie = request.cookies.get('auth_token')?.value;

    // If no auth, redirect to login
    if (!roleCookie || !tokenCookie) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    const role = roleCookie as UserRole;

    // Check role-based access
    if (!hasAccess(role, pathname)) {
        // Redirect to their default dashboard if they try to access unauthorized path
        const url = request.nextUrl.clone();

        // This is a bit simplified, ideally we'd use getRedirectPath but that's a client function usually
        if (role === 'admin') {
            url.pathname = '/dashboard';
        } else if (['sc_manager', 'service_engineer', 'service_advisor', 'call_center'].includes(role)) {
            url.pathname = '/sc/dashboard';
        } else if (role === 'inventory_manager') {
            url.pathname = '/inventory-manager/dashboard';
        } else if (role === 'central_inventory_manager') {
            url.pathname = '/central-inventory/dashboard';
        } else {
            url.pathname = '/';
        }

        return NextResponse.redirect(url);
    }

    return response;
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        // Exclude static assets and API routes
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
