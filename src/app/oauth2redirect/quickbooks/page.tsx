"use client";

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setUserData } from "@/lib/store/slices/userSlice";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getAndClearRedirectPath } from "@/lib/auth/authUtils";
import { AUTH_CONFIG } from "@/lib/auth/authConfig";
import { quickbooksService } from "@/lib/api/sso/quickbooks";

function CallbackHandler() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [debug, setDebug] = useState({});
  const [apiResponse, setApiResponse] = useState(null);
  const [readyToRedirect, setReadyToRedirect] = useState(false);

  // Get the current token from Redux to see if it's set - use optional chaining
  const currentToken = useAppSelector((state) => state?.user?.token || null);
  const currentUser = useAppSelector((state) => state?.user?.user || null);

  // Force a longer delay before redirecting
  const REDIRECT_DELAY_MS = 3000; // 3 seconds

  useEffect(() => {
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    if (params.state && params.code) {
      handleLogin(params);
    } else {
      setStatus("error");
      setMessage("Missing required parameters for SSO login");

      setDebug({
        ...debug,
        error: "Missing required parameters",
        params,
      });
    }
  }, [searchParams]);

  // Effect to handle redirection after we've confirmed token is in Redux
  useEffect(() => {
    if (readyToRedirect && currentToken?.accessToken) {
      const redirectPath =
          getAndClearRedirectPath() || AUTH_CONFIG.defaultRedirectPath;
      console.log(
          `Token verified in Redux store, redirecting to ${redirectPath}...`
      );
      router.push(redirectPath);
    }
  }, [readyToRedirect, currentToken, router]);

  // Add a new effect specifically for checking token status after delay
  useEffect(() => {
    // Only run this effect if status is success
    if (status === "success") {
      const timer = setTimeout(() => {
        console.log("Checking if token is in Redux store...");

        setDebug((prev) => ({
          ...prev,
          tokenInReduxAfterDelay: !!currentToken?.accessToken,
          currentReduxState: {
            token: currentToken,
            user: currentUser,
          },
        }));

        setReadyToRedirect(true);
      }, REDIRECT_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, [status, currentToken, currentUser]);

  const handleLogin = async (params: { realmId: string; code: string; }) => {
    try {
      setStatus("loading");
      console.log("Starting login process...");

      // Extract realmId properly
      const realmId = params.realmId === "null" ? null : params.realmId;

      // Call API for SSO login
      const response : any = await quickbooksService.ssoLogin(params.code, realmId);
      console.log("Received response from ssoLogin:", response);

      // Save the full API response for display
      setApiResponse(response);

      // Update debug information
      setDebug({
        ...debug,
        responseReceived: true,
        hasToken: !!response?.token,
        hasUser: !!response?.user,
        responseDetails: {
          tokenType: typeof response?.token,
          userType: typeof response?.user,
        }
      });

      if (response && response.token && response.user) {
        // Transform response data for Redux store - create new objects to avoid reference issues
        const userData = {
          token: {
            accessToken: response.token.accessToken,
            expiresIn: response.token.expiresIn,
            tokenType: response.token.tokenType,
          },
          user: { ...response.user }
        };

        console.log("Dispatching user data to Redux:", userData);

        try {
          // Dispatch to Redux with clean data object
          dispatch(setUserData(userData));

          // Verify the data was set in Redux after a short delay
          setTimeout(() => {
            const storeToken = currentToken;
            console.log("Verifying token in Redux after dispatch:",
                storeToken ? "Token exists" : "Token missing");

            setDebug(prev => ({
              ...prev,
              reduxVerification: {
                tokenSet: !!storeToken,
                userSet: !!currentUser
              }
            }));

            // Update state to show success
            setStatus("success");
            setMessage("Login successful! Will redirect in a few seconds...");
          }, 500);
        } catch (dispatchError) {
          console.error("Error dispatching to Redux:", dispatchError);
          setStatus("error");
          setMessage(
              dispatchError instanceof Error
                  ? `Redux error: ${dispatchError.message}`
                  : "An error occurred while updating application state"
          );
          setDebug((prev) => ({
            ...prev,
            dispatchError:
                dispatchError instanceof Error
                    ? dispatchError.message
                    : "Unknown dispatch error",
          }));
        }
      } else {
        console.error("Invalid response format:", response);
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      setStatus("error");
      setMessage(
          error instanceof Error
              ? error.message
              : "An error occurred during login process"
      );

      setDebug({
        ...debug,
        error: error instanceof Error ? error.message : "Unknown error",
        errorObject: error,
      });
    }
  };

  // Function to manually trigger redirect
  const manualRedirect = () => {
    const redirectPath =
        getAndClearRedirectPath() || AUTH_CONFIG.defaultRedirectPath;
    console.log(`Manually redirecting to ${redirectPath}...`);
    router.push(redirectPath);
  };

  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            QuickBooks Integration
          </h1>

          {status === "loading" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600">Processing your login...</p>
              </div>
          )}

          {status === "success" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <p className="text-green-600 font-medium">{message}</p>

                {/* Current token status */}
                <div className="mt-4 p-3 bg-gray-50 rounded w-full">
                  <p className="font-medium">
                    Token in Redux: {currentToken?.accessToken ? "✅ Yes" : "❌ No"}
                  </p>
                  <p className="font-medium">
                    User in Redux: {currentUser?.id ? "✅ Yes" : "❌ No"}
                  </p>
                </div>

                {/* Manual redirect button */}
                <button
                    onClick={manualRedirect}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Continue Manually
                </button>
              </div>
          )}

          {status === "error" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </div>
                <p className="text-red-600 font-medium">Login failed</p>
                <p className="text-gray-600 text-center">{message}</p>
                <button
                    onClick={() => router.push("/login")}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Return to Login
                </button>
              </div>
          )}

          {/* Always show debug in this version */}
          <div className="mt-8 p-4 border border-gray-200 rounded">
            <h2 className="text-lg font-medium text-gray-700 mb-2">
              Debug Information
            </h2>
            <div className="text-sm overflow-auto max-h-64">
              <p>
                <strong>Status:</strong> {status}
              </p>
              <p>
                <strong>Message:</strong> {message}
              </p>
              <p>
                <strong>Current Redux Token:</strong>{" "}
                {currentToken?.accessToken
                    ? `${currentToken.accessToken.substring(0, 10)}...`
                    : "Not set"}
              </p>
              <p>
                <strong>Ready to Redirect:</strong>{" "}
                {readyToRedirect ? "Yes" : "No"}
              </p>

              <div className="mt-4">
                <h3 className="font-medium">API Response:</h3>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-36">
                {apiResponse
                    ? JSON.stringify(apiResponse, null, 2)
                    : "No response yet"}
              </pre>
              </div>

              <div className="mt-4">
                <h3 className="font-medium">Debug State:</h3>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-36">
                {JSON.stringify(debug, null, 2)}
              </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            QuickBooks Integration
          </h1>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
  );
}

export default function QuickbooksCallbackPage() {
  return (
      <Suspense fallback={<LoadingFallback />}>
        <CallbackHandler />
      </Suspense>
  );
}