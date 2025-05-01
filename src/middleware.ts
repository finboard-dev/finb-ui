import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from './lib/auth/authMiddleware';

export function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/((?!api|login|oauth2redirect|oauth2redirect/quickbooks).*)',
  ],
}; 