'use client';

import { useFeatureFlagsSync } from '@/hooks/useFeatureFlagsSync';

export function FeatureFlagsSync() {
  useFeatureFlagsSync();
  return null; // This component doesn't render anything
}
