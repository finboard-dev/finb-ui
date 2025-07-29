export enum FeatureIds {
  CONSOLIDATION = 'CONSOLIDATION',
  REPORTING = 'REPORTING',
  DASHBOARD = 'DASHBOARD',
  COMPONENTS = 'COMPONENTS',
  FINB_AGENT = 'FINB_AGENT',
}


export const FeatureDisplayNames: Record<FeatureIds, string> = {
  [FeatureIds.CONSOLIDATION]: 'Mapping',
  [FeatureIds.REPORTING]: 'Reports',
  [FeatureIds.DASHBOARD]: 'Dashboard',
  [FeatureIds.COMPONENTS]: 'Components',
  [FeatureIds.FINB_AGENT]: 'Fin Chat',
};

export const FeatureDescriptions: Record<FeatureIds, string> = {
  [FeatureIds.CONSOLIDATION]: 'Account mapping and consolidation tools',
  [FeatureIds.REPORTING]: 'Generate and view financial reports',
  [FeatureIds.DASHBOARD]: 'View and manage your financial dashboards',
  [FeatureIds.COMPONENTS]: 'Browse and manage reusable UI components',
  [FeatureIds.FINB_AGENT]: 'AI-powered financial assistant and chat interface',
};


export const FeatureRoutes: Record<FeatureIds, string> = {
  [FeatureIds.CONSOLIDATION]: '/consolidation',
  [FeatureIds.REPORTING]: '/reports',
  [FeatureIds.DASHBOARD]: '/dashboard',
  [FeatureIds.COMPONENTS]: '/components',
  [FeatureIds.FINB_AGENT]: '/chat',
};

// Feature route mapping for middleware and protection
export const FeatureRouteMapping: Record<FeatureIds, string[]> = {
  [FeatureIds.CONSOLIDATION]: ['/consolidation'],
  [FeatureIds.REPORTING]: ['/reports'],
  [FeatureIds.DASHBOARD]: ['/dashboard'],
  [FeatureIds.COMPONENTS]: ['/components'],
  [FeatureIds.FINB_AGENT]: ['/chat'],
}; 