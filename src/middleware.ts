import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/app'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token_b2b');

  if (!token) {
    const loginUrl = new URL('/auth', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
