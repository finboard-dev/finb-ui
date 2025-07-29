import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { 
  selectHasConsolidationFeature,
  selectHasReportingFeature,
  selectHasDashboardFeature,
  selectHasChatFeature,
  selectHasComponentsFeature,
} from '@/lib/store/slices/userSlice'
import { FeatureIds, FeatureRouteMapping } from '@/constants/features'

export function useRouteProtection() {
  const router = useRouter()
  const pathname = usePathname()
  
  // Get feature flags from Redux
  const hasConsolidationFeature = useSelector(selectHasConsolidationFeature)
  const hasReportingFeature = useSelector(selectHasReportingFeature)
  const hasDashboardFeature = useSelector(selectHasDashboardFeature)
  const hasChatFeature = useSelector(selectHasChatFeature)
  const hasComponentsFeature = useSelector(selectHasComponentsFeature)

  useEffect(() => {
    // Check if current path requires a specific feature
    const requiredFeatureId = getFeatureIdFromPath(pathname)
    
    if (requiredFeatureId) {
      const hasAccess = checkFeatureAccess(requiredFeatureId, {
        hasConsolidationFeature,
        hasReportingFeature,
        hasDashboardFeature,
        hasChatFeature,
        hasComponentsFeature
      })
      
      if (!hasAccess) {
        // Redirect to home page
        router.replace('/')
      }
    }
  }, [
    pathname,
    hasConsolidationFeature,
    hasReportingFeature,
    hasDashboardFeature,
    hasChatFeature,
    hasComponentsFeature,
    router
  ])
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

// Helper function to check if user has access to a feature
function checkFeatureAccess(featureId: FeatureIds, flags: {
  hasConsolidationFeature: boolean
  hasReportingFeature: boolean
  hasDashboardFeature: boolean
  hasChatFeature: boolean
  hasComponentsFeature: boolean
}): boolean {
  switch (featureId) {
    case FeatureIds.CONSOLIDATION:
      return flags.hasConsolidationFeature
    case FeatureIds.REPORTING:
      return flags.hasReportingFeature
    case FeatureIds.DASHBOARD:
      return flags.hasDashboardFeature
    case FeatureIds.COMPONENTS:
      return flags.hasComponentsFeature
    case FeatureIds.FINB_AGENT:
      return flags.hasChatFeature
    default:
      return false
  }
} 