import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/age-gate',
] as const;

const PUBLIC_ROUTE_PREFIXES = ['/c/'] as const;

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuth = !!token;
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]) ||
    PUBLIC_ROUTE_PREFIXES.some((routePrefix) => pathname.startsWith(routePrefix));

  // Age Gate Check
  const isAgeVerified = request.cookies.get('age_verified')?.value === 'true';
  const isAgeGatePage = pathname === '/age-gate';
  /** Auth entry routes reachable from the age gate header (user can sign in/up; app rules still apply after login). */
  const bypassAgeForPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  if (
    !isAgeVerified &&
    !isAgeGatePage &&
    !bypassAgeForPath &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/static')
  ) {
    return NextResponse.redirect(new URL('/age-gate', request.url));
  }

  // If already verified and trying to access age gate, redirect to home
  if (isAgeVerified && isAgeGatePage) {
    return NextResponse.redirect(new URL(isAuth ? '/' : '/login', request.url));
  }

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
