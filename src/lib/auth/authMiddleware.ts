import { NextRequest, NextResponse } from 'next/server';
import { isPublicRoute, AUTH_CONFIG } from './authConfig';

export function authMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isPublicRoute(path)) {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}
