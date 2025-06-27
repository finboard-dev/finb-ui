export const AUTH_CONFIG = {
  publicRoutes: ["/login", "/oauth2redirect", "/oauth2redirect/quickbooks", "/_next", "/favicon.ico"],

  publicApiEndpoints: ["/auth/sso?provider=INTUIT"],

  privateDevApiEndpoints: [
    "datasource/all?company",
    "/connection/callback",
    "add?provider=QUICKBOOKS",
    "datasource/disconnect?datasource",
      "/companies/current"
  ],

  organizationIdInHeaders: ["add?provider=QUICKBOOKS"],

  devApiWithAuthEndpoints: ["/auth/login", "/auth/sso?provider=INTUIT"],

  loginPath: "/login",

  defaultRedirectPath: "/",

  redirectAfterLoginKey: "redirectAfterLogin",

  debug: process.env.NODE_ENV === "development",
}

export const isPublicRoute = (path: string): boolean => {
  // Always allow static files and Next.js internals
  if (path.startsWith("/_next/") || path.includes(".") || path === "/favicon.ico") {
    return true
  }

  return AUTH_CONFIG.publicRoutes.some((route) => path === route || path.startsWith(route))
}

export const requiresAuth = (path: string): boolean => {
  return !isPublicRoute(path)
}
