'use client';

import { useEffect } from 'react';
import { sdk } from '@embrace-io/web-sdk';

export default function EmbraceSDKInitializer() {
  useEffect(() => {
    // Only initialize the SDK on the client side
    if (typeof window !== 'undefined') {
      try {
        sdk.initSDK({
          appID: 'xig9b',
        });
      } catch (error) {
        console.error('Failed to initialize Embrace SDK:', error);
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
