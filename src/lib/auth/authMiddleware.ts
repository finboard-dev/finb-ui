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


  if (path === AUTH_CONFIG.loginPath && token) {
    const hasSelectedCompany = request.cookies.get("has_selected_company")?.value === "true"

    if (hasSelectedCompany) {
      return NextResponse.redirect(new URL(AUTH_CONFIG.defaultRedirectPath, request.url))
    } else {
      return NextResponse.redirect(new URL("/company-selection", request.url))
    }
  }

  const hasSelectedCompany = request.cookies.get("has_selected_company")?.value === "true"


  if (
      !hasSelectedCompany &&
      !path.startsWith("/company-selection") &&
      !path.startsWith("/oauth2redirect") &&
      !isPublicRoute(path)
  ) {
    return NextResponse.redirect(new URL("/company-selection", request.url))
  }

  return NextResponse.next()
}
