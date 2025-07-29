import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authMiddleware } from "@/lib/auth/authMiddleware"
import { featureMiddleware } from "@/lib/auth/featureMiddleware"

export function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes
  const { pathname } = request.nextUrl

  if (
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/api/") ||
      pathname.includes(".") ||
      pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // First run auth middleware
  const authResponse = authMiddleware(request)
  if (authResponse.status !== 200) {
    return authResponse
  }

  // Then run feature middleware
  return featureMiddleware(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/((?!api|_next/static|login|_next/image|favicon.ico).*)",
  ],
}
