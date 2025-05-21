import { NextRequest, NextResponse } from 'next/server';

export function ParseRoute(req: NextRequest) {
  if (req.nextUrl.protocol === 'https:') {
    // Reescreve a URL para HTTP
    const httpUrl = `http://${req.nextUrl.host}${req.nextUrl.pathname}`;
    return NextResponse.redirect(httpUrl);
  }

  return NextResponse.next();
}

