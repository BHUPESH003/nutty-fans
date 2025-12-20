import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuth = !!token;
  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register');

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return null;
  }

  if (!isAuth) {
    let from = request.nextUrl.pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, request.url)
    );
  }

  return null;
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/profile/:path*', '/login', '/register'],
};
