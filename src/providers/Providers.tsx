'use client';

import QueryProvider from '@/lib/react-query';
import { AuthGuard } from '@/lib/auth/authGuard';
import ReduxProvider from './ReduxProvider';
import { FeatureFlagsSync } from '@/components/FeatureFlagsSync';
import { RouteProtection } from '@/components/RouteProtection';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <AuthGuard>
          <FeatureFlagsSync />
          <RouteProtection />
          {children}
        </AuthGuard>
      </QueryProvider>
    </ReduxProvider>
  );
}
