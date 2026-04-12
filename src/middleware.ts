import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
] as const;

const PUBLIC_ROUTE_PREFIXES = ['/c/'] as const;

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuth = !!token;
  const { pathname } = request.nextUrl;

  const isLiveRoute =
    pathname === '/live' ||
    pathname.startsWith('/live/') ||
    pathname === '/creator/live' ||
    pathname.startsWith('/creator/live/');

  if (isLiveRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]) ||
    PUBLIC_ROUTE_PREFIXES.some((routePrefix) => pathname.startsWith(routePrefix));

  // Auth pages (login, register) - redirect to home if already logged in
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If not authenticated and not on a public route, redirect to login
  if (!isAuth && !isPublicRoute) {
    let from = request.nextUrl.pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, request.url)
    );
  }

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
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
