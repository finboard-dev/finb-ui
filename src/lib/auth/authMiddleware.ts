import { type NextRequest, NextResponse } from "next/server"
import { isPublicRoute, AUTH_CONFIG } from "./authConfig"

export function authMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (isPublicRoute(path) || path.includes("/_next/")) {
    return NextResponse.next()
  }

  const token = request.cookies.get("auth_token")?.value

  if (path.startsWith("/api/")) {
    return NextResponse.next()
  }

  if (!token && !isPublicRoute(path)) {
    const redirectUrl = new URL(AUTH_CONFIG.loginPath, request.url)
    redirectUrl.searchParams.set(AUTH_CONFIG.redirectAfterLoginKey, path)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}
