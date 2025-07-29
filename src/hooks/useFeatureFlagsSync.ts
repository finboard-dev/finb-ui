import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { 
  selectHasConsolidationFeature,
  selectHasReportingFeature,
  selectHasDashboardFeature,
  selectHasChatFeature,
  selectHasComponentsFeature,
} from '@/lib/store/slices/userSlice'
import { FeatureIds } from '@/constants/features'

export function useFeatureFlagsSync() {
  // Get feature flags from Redux
  const hasConsolidationFeature = useSelector(selectHasConsolidationFeature)
  const hasReportingFeature = useSelector(selectHasReportingFeature)
  const hasDashboardFeature = useSelector(selectHasDashboardFeature)
  const hasChatFeature = useSelector(selectHasChatFeature)
  const hasComponentsFeature = useSelector(selectHasComponentsFeature)

  useEffect(() => {
    // Build enabled features array
    const enabledFeatures: string[] = []
    
    if (hasConsolidationFeature) enabledFeatures.push(FeatureIds.CONSOLIDATION)
    if (hasReportingFeature) enabledFeatures.push(FeatureIds.REPORTING)
    if (hasDashboardFeature) enabledFeatures.push(FeatureIds.DASHBOARD)
    if (hasChatFeature) enabledFeatures.push(FeatureIds.FINB_AGENT)
    if (hasComponentsFeature) enabledFeatures.push(FeatureIds.COMPONENTS)

    // Set feature flags in cookie for middleware access
    const featureFlagsData = {
      enabledFeatures,
      timestamp: Date.now()
    }

    // Set cookie (accessible by middleware)
    document.cookie = `feature-flags=${JSON.stringify(featureFlagsData)}; path=/; max-age=3600; SameSite=Strict`

    // Also set in sessionStorage for client-side access
    sessionStorage.setItem('feature-flags', JSON.stringify(featureFlagsData))
  }, [
    hasConsolidationFeature,
    hasReportingFeature,
    hasDashboardFeature,
    hasChatFeature,
    hasComponentsFeature
  ])
} 