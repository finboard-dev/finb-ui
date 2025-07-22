"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ArrowLeft, RefreshCw } from "lucide-react";

interface DashboardNotFoundProps {
  dashboardId?: string;
}

export default function DashboardNotFound({
  dashboardId,
}: DashboardNotFoundProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => setIsAnimating(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Animated Search Icon */}
        <div className="mb-8 relative">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full transition-all duration-700 ${
              isAnimating ? "scale-110 shadow-lg" : "scale-100"
            }`}
          >
            <Search
              className={`w-12 h-12 text-gray-400 transition-all duration-700 ${
                isAnimating ? "animate-pulse" : ""
              }`}
            />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Dashboard Not Found
        </h1>

        <p className="text-gray-600 mb-2">
          {dashboardId ? (
            <>
              The dashboard{" "}
              <span className="font-mono text-gray-800">"{dashboardId}"</span>{" "}
              could not be found.
            </>
          ) : (
            "No dashboard ID was provided."
          )}
        </p>

        <p className="text-gray-500 text-sm mb-8">
          It may have been deleted, moved, or you may not have access to it.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            href="/dashboard/select"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Go to Dashboard Selection
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
          >
            <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-200" />
            Try Again
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Need help? Contact your administrator or check your dashboard
            permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
