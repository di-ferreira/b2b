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
    // Server Actions (POST) are forwarded internally by Next with a streaming body.
    // A redirect cannot be replayed in that case, which surfaces as
    // "failed to forward action response: TypeError: fetch failed".
    // Let the action run instead: it will fail with the API's 401 and the client
    // can show a proper message.
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return NextResponse.next();
    }

    const loginUrl = new URL('/auth', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
