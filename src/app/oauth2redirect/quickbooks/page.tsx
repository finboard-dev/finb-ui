'use client';

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setUserData, addCompany } from '@/lib/store/slices/userSlice';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense, useMemo } from 'react';
import { getAndClearRedirectPath } from '@/lib/auth/authUtils';
import { AUTH_CONFIG } from '@/lib/auth/authConfig';
import { quickbooksService } from '@/lib/api/sso/quickbooks';
import { addCompany as addCompanyApi } from '@/lib/api/intuitService';
import { store } from '@/lib/store/store';
import { setAuthCookies } from '@/lib/auth/tokenUtils';
import { useLogin } from '@/hooks/query-hooks/useLogin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  ChevronDown,
  ArrowRight,
  Building2,
  User,
  ShieldCheck, // Changed from Shield for a more "verified" feel
  KeyRound, // Changed from Key for a softer look
  DatabaseZap, // Changed from Database for a more "active sync" feel
  Sparkles,
  CheckCircle2,
  AlertTriangle, // Changed from AlertCircle for a more standard warning
  Loader2, // A more common spinner
  Info, // For debug section
  Briefcase, // For company selection
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'circOut',
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.3, ease: 'circIn' },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'circOut' } },
};

const iconVariants: Variants = {
  initial: { scale: 0, rotate: -90 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20, delay: 0.3 },
  },
};

const progressStepVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

function CallbackHandler() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'add-company-success' | 'error'>('loading');
  const [message, setMessage] = useState('Initializing secure connection...');
  const [debug, setDebug] = useState<Record<string, any>>({});
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [readyToRedirect, setReadyToRedirect] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentToken = useAppSelector((state) => state?.user?.token || null);
  const currentUser = useAppSelector((state) => state?.user?.user || null);
  const selectedCompany = useAppSelector((state) => state?.user?.selectedCompany || null);

  // React Query login mutation
  const loginMutation = useLogin();

  const AUTO_REDIRECT_DELAY_MS = 3000;

  const steps = useMemo(
    () => [
      { label: 'Authenticating Session', icon: ShieldCheck },
      { label: 'Validating Credentials', icon: KeyRound },
      { label: 'Syncing Account Data', icon: DatabaseZap },
      { label: 'Finalizing Connection', icon: Sparkles },
    ],
    []
  );

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let stepInterval: NodeJS.Timeout;

    if (status === 'loading' || loginMutation.isPending) {
      setMessage('Establishing secure connection...');
      const totalDuration = 4000; // Approximate total time for loading visuals
      const stepChangeInterval = totalDuration / steps.length;

      stepInterval = setInterval(() => {
        setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, stepChangeInterval);

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) return prev; // Don't hit 100% until truly done
          const increment = Math.random() * 5 + 2;
          return Math.min(prev + increment, 98);
        });
      }, 150);
    } else {
      setProgress(100);
      setCurrentStepIndex(steps.length - 1);
      if (status === 'success' || status === 'add-company-success') {
        setMessage(status === 'add-company-success' ? 'Company Connected Successfully!' : 'Authentication Successful!');
      }
    }
    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [status, steps.length, loginMutation.isPending]);

  useEffect(() => {
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    if (params.state && params.code) {
      if (params.realmId && params.realmId !== 'null') {
        handleAddCompany(params);
      } else {
        handleLogin(params);
      }
    } else {
      setStatus('error');
      setMessage('Invalid authentication request. Missing required parameters.');
      setDebug({ error: 'Missing SSO parameters', paramsReceived: params });
    }
  }, [searchParams]); // Removed debug from dependencies to avoid loop if it contains non-serializable data

  console.log(selectedCompany, 'selectedCompany');

  useEffect(() => {
    if (
      readyToRedirect &&
      (status === 'success' || status === 'add-company-success') &&
      currentToken?.accessToken &&
      typeof selectedCompany !== 'undefined'
    ) {
      const timer = setTimeout(() => {
        // Check the latest value of selectedCompany at the time of redirect
        let redirectPath = getAndClearRedirectPath() || AUTH_CONFIG.defaultRedirectPath;
        if (status === 'success' && !selectedCompany) {
          console.log('company-selection outh');
          redirectPath = '/company-selection';
          console.log('No company selected, will redirect to company selection.');
        } else {
          console.log(`Token verified, will redirect to ${redirectPath}.`);
        }
        router.push(redirectPath);
      }, AUTO_REDIRECT_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [readyToRedirect, currentToken, router, status, selectedCompany]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      document.cookie = `processing_oauth=true; path=/; SameSite=Lax; Secure`;
    } else if (status !== 'error') {
      // Only redirect if not already in an error state
      console.warn('OAuth code missing from URL parameters.');
      // Don't auto-redirect here, let the main logic decide if it's an error
    }
  }, [searchParams, status, router]);

  useEffect(() => {
    if (status === 'success' || status === 'add-company-success') {
      const timer = setTimeout(() => {
        setDebug((prev) => ({
          ...prev,
          finalReduxState: {
            tokenExists: !!currentToken?.accessToken,
            userExists: !!currentUser,
            companySelected: !!selectedCompany,
          },
        }));
        setReadyToRedirect(true); // Enable redirect logic
      }, 500); // Shorter delay to mark as ready, actual redirect has its own timer
      return () => clearTimeout(timer);
    }
  }, [status, currentToken, currentUser, selectedCompany]);

  const handleLogin = async (params: { code: string }) => {
    setStatus('loading');
    setMessage('Authenticating your credentials...');
    setCurrentStepIndex(0);
    setProgress(10);

    try {
      setProgress(50);
      setCurrentStepIndex(1);

      // Use React Query mutation for login
      const result = await loginMutation.mutateAsync(params);

      setApiResponse(result);
      setProgress(90);
      setCurrentStepIndex(2);

      console.log('Login successful, response:', result);

      setTimeout(() => {
        setCurrentStepIndex(3);
        setStatus('success');
      }, 300);
    } catch (error: any) {
      console.error('Login error:', error);
      setStatus('error');
      setMessage(error.message || 'Login failed. Please try again.');
      setDebug((prev) => ({
        ...prev,
        error: error.message,
        errorDetails: error,
      }));
    }
  };

  const handleAddCompany = async (params: { realmId: string; code: string }) => {
    setStatus('loading');
    setMessage('Connecting your Quickbooks company...');
    setCurrentStepIndex(0);
    setProgress(10);

    try {
      if (!currentToken?.accessToken) {
        throw new Error('No active session. Please log in again.');
      }
      setProgress(30);
      setCurrentStepIndex(1);

      const response = await addCompanyApi(params.code, params.realmId);
      setApiResponse(response);
      setProgress(60);
      setCurrentStepIndex(2);

      if (response && response.success) {
        const currentUserState = store.getState().user;

        // Extract the newly added company from the response
        // The API response structure might vary, so we need to handle different possibilities
        let newCompany = null;

        if (response.data) {
          // If response has a data property, use it
          newCompany = response.data;
        } else if (response.company) {
          // If response has a company property, use it
          newCompany = response.company;
        } else if (response.selectedCompany) {
          // If response has selectedCompany property, use it
          newCompany = response.selectedCompany;
        } else if (typeof response === 'object' && response.id) {
          // If the response itself is a company object
          newCompany = response;
        }

        // Ensure the company has the required structure
        if (newCompany) {
          const mappedCompany = {
            ...newCompany,
            name: newCompany.companyName || newCompany.name,
            status: newCompany.isActive ? 'ACTIVE' : 'INACTIVE',
          };

          const userData = {
            token: currentUserState.token, // Preserve existing token
            user: { ...currentUserState.user, ...response }, // Merge user details
            selectedOrganization: response.selectedOrganization || currentUserState.selectedOrganization,
            selectedCompany: mappedCompany, // Set the newly added company as selected
          };

          dispatch(setUserData(userData as any));

          // Also add the company to the companies array if it's not already there
          const existingCompanies = currentUserState.companies || [];
          const companyExists = existingCompanies.some((company: any) => company.id === mappedCompany.id);

          if (!companyExists) {
            dispatch(addCompany(mappedCompany));
          }

          setProgress(90);

          // Set the cookie to indicate a company is selected
          document.cookie = 'has_selected_company=true; path=/; SameSite=Lax; Secure';

          console.log('Successfully added and selected company:', mappedCompany);
        } else {
          console.warn('No company data found in response:', response);
        }

        setTimeout(() => {
          // Simulate finalization
          setCurrentStepIndex(3);
          setStatus('add-company-success');
          // Message is set by the status useEffect
        }, 300);
      } else {
        throw new Error(response?.message || 'Failed to connect company.');
      }
    } catch (error: any) {
      console.error('Add company error:', error);
      setStatus('error');
      setMessage(error.message || 'Could not connect company. Please try again.');
      setDebug((prev) => ({
        ...prev,
        error: error.message,
        errorDetails: error,
      }));
    }
  };

  const manualRedirect = () => {
    let redirectPath = getAndClearRedirectPath() || AUTH_CONFIG.defaultRedirectPath;
    if (status === 'success' && !selectedCompany) {
      console.log('company selection aouth 2');

      redirectPath = '/company-selection';
    }
    router.push(redirectPath);
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <motion.div
            key="loading"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="flex justify-center items-center flex-col">
              <div className="relative w-20 h-20">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-full h-full border-4 border-blue-500 rounded-full"
                    initial={{ opacity: 0.5, scale: 0.6, rotate: i * 30 }}
                    animate={{
                      opacity: [0.5, 0.2, 0.5],
                      scale: [0.6, 1, 0.6],
                      rotate: i * 30 + 360,
                    }}
                    transition={{
                      duration: 2 + i * 0.2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'linear',
                    }}
                    style={{ borderStyle: i % 2 === 0 ? 'solid' : 'dashed' }}
                  />
                ))}
                <Building2 className="w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </motion.div>

            <motion.p variants={itemVariants} className="text-center text-lg font-medium text-gray-700">
              {steps[currentStepIndex]?.label || 'Processing...'}
            </motion.p>

            <motion.div variants={itemVariants} className="w-full max-w-md mx-auto space-y-3 px-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <motion.div
                    key={step.label}
                    variants={progressStepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-200"
                    custom={index}
                    transition={{ delay: index * 0.1 }}
                  >
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300
                        ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={
                        isActive
                          ? {
                              duration: 0.8,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: 'easeInOut',
                            }
                          : {}
                      }
                    >
                      {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                    </motion.div>
                    <span
                      className={`font-medium ${
                        isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isActive && <Loader2 size={18} className="animate-spin text-blue-500 ml-auto" />}
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div variants={itemVariants} className="w-full max-w-md mx-auto space-y-1 px-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'circOut' }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right">{Math.round(progress)}% Complete</p>
            </motion.div>
          </motion.div>
        );
      case 'success':
      case 'add-company-success':
        return (
          <motion.div
            key="success"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6 text-center"
          >
            <motion.div variants={iconVariants} initial="initial" animate="animate" className="flex justify-center">
              <div className="relative">
                <CheckCircle2 className="w-24 h-24 text-green-500" strokeWidth={1.5} />
                {/* Subtle radiating circles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-0 left-0 w-full h-full rounded-full border-green-500 border-2"
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2 + i * 0.5, opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      delay: 0.5 + i * 0.2,
                      ease: 'easeOut',
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-3xl font-semibold text-gray-800">
              {message}
            </motion.h2>
            <motion.p variants={itemVariants} className="text-gray-600 max-w-md mx-auto">
              {selectedCompany || status === 'add-company-success'
                ? 'You will be automatically redirected shortly. Feel free to proceed manually.'
                : 'Your account is set up. Please select a company to continue.'}
            </motion.p>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 max-w-lg mx-auto">
              <div
                className={`p-3 rounded-lg border ${
                  currentToken?.accessToken ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <ShieldCheck
                  className={`w-6 h-6 mx-auto mb-1 ${currentToken?.accessToken ? 'text-green-600' : 'text-gray-400'}`}
                />
                <p className="text-xs font-medium">Authentication</p>
                <p className={`text-xs ${currentToken?.accessToken ? 'text-green-600' : 'text-gray-500'}`}>
                  {currentToken?.accessToken ? 'Verified' : 'Pending'}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg border ${
                  currentUser?.id ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <User className={`w-6 h-6 mx-auto mb-1 ${currentUser?.id ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-xs font-medium">User Profile</p>
                <p className={`text-xs ${currentUser?.id ? 'text-green-600' : 'text-gray-500'}`}>
                  {currentUser?.id ? 'Loaded' : 'Pending'}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg border ${
                  selectedCompany ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <Briefcase className={`w-6 h-6 mx-auto mb-1 ${selectedCompany ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-xs font-medium">Company</p>
                <p className={`text-xs ${selectedCompany ? 'text-green-600' : 'text-gray-500'}`}>
                  {selectedCompany ? 'Selected' : 'Not Selected'}
                </p>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button
                onClick={manualRedirect}
                size="lg"
                className="w-full max-w-xs mx-auto bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-out transform hover:scale-105"
              >
                {selectedCompany || status === 'add-company-success' ? 'Go to Dashboard' : 'Select Company'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            key="error"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6 text-center"
          >
            <motion.div variants={iconVariants} initial="initial" animate="animate" className="flex justify-center">
              <AlertTriangle className="w-24 h-24 text-red-500" strokeWidth={1.5} />
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-3xl font-semibold text-gray-800">
              Connection Problem
            </motion.h2>
            <motion.p variants={itemVariants} className="text-red-600 bg-red-50 p-3 rounded-md max-w-md mx-auto">
              {message}
            </motion.p>
            <motion.div variants={itemVariants}>
              <Button
                onClick={() => router.push('/login')}
                size="lg"
                variant="outline"
                className="w-full max-w-xs mx-auto text-blue-600 border-blue-600 hover:bg-blue-50 text-base font-semibold py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-out transform hover:scale-105"
              >
                Return to Login
              </Button>
            </motion.div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-100">
      {/* Subtle background pattern - optional, can be removed for ultra-clean */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(0, 90, 255, 0.3)" />
            </pattern>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#smallGrid)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(0,90,255,0.07)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        className="relative z-10 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-xl mx-auto shadow-xl border-gray-200/80 bg-white/80 backdrop-blur-lg overflow-hidden">
          <CardHeader className="border-b border-gray-100 p-6">
            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-800">QuickBooks Integration</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Secure Connection Process</CardDescription>
                </div>
              </div>
              {/* You can add a small logo here if you have one */}
            </motion.div>
          </CardHeader>
          <CardContent className="p-6 md:p-10 min-h-[450px] flex flex-col justify-center">
            <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
          </CardContent>

          {(status === 'error' || Object.keys(debug).length > 0 || apiResponse) && (
            <motion.div
              className="border-t border-gray-100 bg-slate-25"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: status === 'error' ? 0.5 : 1.5,
                duration: 0.5,
              }}
            >
              <Collapsible open={showDetails} onOpenChange={setShowDetails} className="px-6 py-3">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 font-medium rounded-md"
                  >
                    <Info size={14} className="mr-2" />
                    <span>{showDetails ? 'Hide' : 'Show'} Technical Details</span>
                    <ChevronDown
                      size={16}
                      className={`ml-2 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="mt-3 p-4 bg-gray-50 rounded-md border border-gray-200 text-xs"
                  >
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-1">Processing Status</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <p>
                            <span className="text-gray-500">Current State:</span>{' '}
                            <Badge variant={status === 'error' ? 'destructive' : 'default'}>{status}</Badge>
                          </p>
                          <p>
                            <span className="text-gray-500">Redirect Ready:</span>{' '}
                            <span className={readyToRedirect ? 'text-green-600 font-medium' : ''}>
                              {readyToRedirect ? 'Yes' : 'No'}
                            </span>
                          </p>
                        </div>
                      </div>
                      {apiResponse && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-1">Last API Response:</h4>
                          <pre className="bg-white p-2 rounded border border-gray-200 overflow-auto max-h-32 font-mono text-gray-600">
                            {JSON.stringify(apiResponse, null, 2)}
                          </pre>
                        </div>
                      )}
                      {Object.keys(debug).length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-1">Debug Log:</h4>
                          <pre className="bg-white p-2 rounded border border-gray-200 overflow-auto max-h-32 font-mono text-gray-600">
                            {JSON.stringify(debug, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          )}
        </Card>
        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} Your Company Name. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'circOut' }}
        className="text-center"
      >
        <Card className="w-full max-w-md shadow-lg border-gray-200/80 bg-white/90 backdrop-blur-md p-8 rounded-xl">
          <motion.div
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-md"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 15, -10, 0] }}
            transition={{
              duration: 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          >
            <Building2 className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">QuickBooks Integration</h1>
          <p className="text-gray-500 mb-5">Initializing secure connection, please wait...</p>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
                repeatType: 'loop',
              }}
              style={{ width: '100%' }}
            />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function QuickbooksCallbackPage() {
  return (
    // Suspense should ideally wrap a component that might suspend,
    // CallbackHandler itself does data fetching that might warrant Suspense if it were structured differently
    // For Next.js 13+ app router, useSearchParams() itself triggers Suspense boundary.
    <Suspense fallback={<LoadingFallback />}>
      <CallbackHandler />
    </Suspense>
  );
}
