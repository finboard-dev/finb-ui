import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { FeatureIds, FeatureRouteMapping } from "@/constants/features"

// Helper function to get feature flags from cookies or headers
function getFeatureFlags(request: NextRequest) {
  // Try to get from cookies first (for SSR)
  const cookies = request.cookies
  const featureFlagsCookie = cookies.get('feature-flags')?.value
  
  if (featureFlagsCookie) {
    try {
      return JSON.parse(featureFlagsCookie)
    } catch {
      // Fallback to headers
    }
  }
  
  // Try to get from headers (for client-side)
  const featureFlagsHeader = request.headers.get('x-feature-flags')
  if (featureFlagsHeader) {
    try {
      return JSON.parse(featureFlagsHeader)
    } catch {
      // Return empty object if parsing fails
    }
  }
  
  return {}
}

// Helper function to check if user has access to a feature
function hasFeatureAccess(featureFlags: any, featureId: FeatureIds): boolean {
  if (!featureFlags || !featureFlags.enabledFeatures) {
    return false
  }
  
  return featureFlags.enabledFeatures.includes(featureId)
}

// Helper function to get feature ID from pathname
function getFeatureIdFromPath(pathname: string): FeatureIds | null {
  for (const [featureId, routes] of Object.entries(FeatureRouteMapping)) {
    if (routes.some((route: string) => pathname.startsWith(route))) {
      return featureId as FeatureIds
    }
  }
  return null
}

export function featureMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get feature flags
  const featureFlags = getFeatureFlags(request)
  
  // Check if the current path requires a specific feature
  const requiredFeatureId = getFeatureIdFromPath(pathname)
  
  if (requiredFeatureId) {
    // Check if user has access to this feature
    if (!hasFeatureAccess(featureFlags, requiredFeatureId)) {
      // Redirect to home page or show access denied
      const homeUrl = new URL('/', request.url)
      return NextResponse.redirect(homeUrl)
    }
  }
  
  // Continue to next middleware
  return NextResponse.next()
}

// Export the feature route mapping for use in other parts of the app
export { FeatureRouteMapping } 