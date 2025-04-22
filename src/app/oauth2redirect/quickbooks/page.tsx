"use client";

import { ssoLogin } from "@/lib/api/sso/quickbooks";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function QuickbooksCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [queryParams, setQueryParams] = useState({});
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setQueryParams(params);

    if (params.state && params.code) {
      handleLogin(params);
    } else {
      setStatus("error");
      setMessage("Missing required parameters for SSO login");
    }
  }, [searchParams]);

  useEffect(() => {
    let timer: string | number | NodeJS.Timeout | undefined;
    if (status === "success" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (status === "success" && countdown === 0) {
      router.push("/");
    }
    return () => clearTimeout(timer);
  }, [status, countdown, router]);

  const handleLogin = async (params: any) => {
    try {
      const response = await ssoLogin(
        params.state,
        params.code,
        params?.realmId === "null" ? null : params?.realmId
      );

      switch (response.code) {
        case "LOGIN_SUCCESS":
          setStatus("success");
          setMessage("Login successful!");
          break;

        case "LOGIN_USER_NOT_VERIFIED":
          setStatus("redirect");
          setMessage("Account needs verification");
          window.location.href = response.redirectUrl;
          break;

        case "LOGIN_FAILED":
        case "LOGIN_ERROR":
          setStatus("error");
          setMessage(response.message || "Login failed");
          break;

        default:
          setStatus("error");
          setMessage("Unknown response from server");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred during login process");
      console.error("Error handling login:", error);
    }
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
            <p className="text-gray-600">Processing your request...</p>
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
            <p className="text-green-600 font-medium">Login successful!</p>
            <p className="text-gray-500 text-center">
              Redirecting to dashboard in {countdown} seconds...
            </p>
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

        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 border border-gray-200 rounded">
            <h2 className="text-lg font-medium text-gray-700 mb-2">
              Debug Information
            </h2>
            <div className="text-sm mb-2">
              <span className="font-medium">Status:</span> {status}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
