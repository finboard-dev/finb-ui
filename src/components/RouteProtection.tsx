'use client';

import { useRouteProtection } from '@/hooks/useRouteProtection';

export function RouteProtection() {
  useRouteProtection();
  return null; // This component doesn't render anything
}
