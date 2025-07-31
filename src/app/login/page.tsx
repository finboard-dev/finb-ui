'use client';

import React, { useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { SSO_LOGIN } from '@/constants';
import { intuitSSOLogin } from '@/lib/api/intuitService';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';
import { userBearerToken } from '@/lib/store/slices/userSlice';
import { useMagicLinkAuth } from '@/hooks/query-hooks/useMagicLinkAuth';

const LoginPageContainer = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [processedToken, setProcessedToken] = React.useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAppSelector(userBearerToken);
  const magicLinkAuthMutation = useMagicLinkAuth();

  // Handle magic link authentication
  useEffect(() => {
    const magicToken = searchParams.get('token');

    console.log('Magic link effect triggered:', {
      magicToken: !!magicToken,
      processedToken,
      isPending: magicLinkAuthMutation.isPending,
      isError: magicLinkAuthMutation.isError,
    });

    if (
      magicToken &&
      magicToken !== processedToken &&
      !magicLinkAuthMutation.isPending &&
      !magicLinkAuthMutation.isError
    ) {
      console.log('Starting magic link authentication...');
      setProcessedToken(magicToken);
      magicLinkAuthMutation.mutate({ token: magicToken });
    }
  }, [searchParams.toString(), processedToken, magicLinkAuthMutation.isPending, magicLinkAuthMutation.isError]);

  useEffect(() => {
    // Don't run default redirects if we're processing a magic link
    const magicToken = searchParams.get('token');
    if (magicToken) {
      console.log('Skipping default redirect - magic link in progress');
      return;
    }

    if (token && !magicLinkAuthMutation.isPending && !magicLinkAuthMutation.isSuccess) {
      const hasSelectedCompany = document.cookie.includes('has_selected_company=true');
      const hasSelectedOrganization = document.cookie.includes('has_selected_organization=true');

      console.log('Default redirect effect triggered:', {
        hasToken: !!token,
        isPending: magicLinkAuthMutation.isPending,
        isSuccess: magicLinkAuthMutation.isSuccess,
        hasSelectedCompany,
        hasSelectedOrganization,
        currentPath: window.location.pathname,
      });

      if (hasSelectedCompany) {
        console.log('Redirecting to home page');
        router.push('/');
      } else if (hasSelectedOrganization) {
        console.log('company selection login');
        router.push('/company-selection');
      } else {
        console.log('organization selection login');
        router.push('/organization-selection');
      }
    }
  }, [token, router, magicLinkAuthMutation.isPending, magicLinkAuthMutation.isSuccess]);

  const handleInuitLoginClick = async () => {
    try {
      setIsLoading(true);
      const redirectUrl = await intuitSSOLogin(SSO_LOGIN);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        console.error('No redirect URL provided');
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  // Show loading if magic link authentication is in progress or redirecting
  if (magicLinkAuthMutation.isPending || magicLinkAuthMutation.isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            {magicLinkAuthMutation.isRedirecting ? 'Redirecting...' : 'Authenticating...'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {magicLinkAuthMutation.isRedirecting
              ? 'Please wait while we redirect you to your destination'
              : 'Please wait while we set up your account'}
          </p>
        </div>
      </div>
    );
  }

  // Show error if magic link authentication failed
  if (magicLinkAuthMutation.isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">
            {magicLinkAuthMutation.error?.message || 'Authentication failed. Please try again.'}
          </p>
          <button
            onClick={() => {
              setProcessedToken(null);
              magicLinkAuthMutation.reset();
              router.push('/login');
            }}
            className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <LoginPage handleIntuitLogin={handleInuitLoginClick} isLoading={isLoading} />;
};

export default LoginPageContainer;
