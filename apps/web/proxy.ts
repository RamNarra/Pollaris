import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const session = request.cookies.get('session');
  
  // Define public/pass-through routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/sign-in') || request.nextUrl.pathname.startsWith('/sign-up');
  const isRoot = request.nextUrl.pathname === '/';
  const isFirebaseProxy = request.nextUrl.pathname.startsWith('/__/auth');
  const isSentryTunnel = request.nextUrl.pathname.startsWith('/monitoring');
  
  // If there's no session and the user is trying to access a protected route
  if (!session && !isAuthRoute && !isRoot && !isFirebaseProxy && !isSentryTunnel) {
    const signInUrl = new URL('/sign-in', request.url);
    // Include original search parameters if any (to preserve redirect parameter)
    const originalPath = request.nextUrl.pathname + request.nextUrl.search;
    signInUrl.searchParams.set('redirect', originalPath);
    return NextResponse.redirect(signInUrl);
  }
  
  // If there's a session and the user is on an auth route or root, redirect to dashboard
  if (session && (isAuthRoute || isRoot)) {
    return NextResponse.redirect(new URL('/my-polls', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - __/auth (Firebase Authentication proxy)
     * - monitoring (Sentry tunnel)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|__/auth|monitoring|_next/static|_next/image|favicon.ico).*)',
  ],
};