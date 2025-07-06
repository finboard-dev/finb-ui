"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLoading } from "./components/ui/DashboardLoading";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the dashboard selection page
    // This allows users to choose which dashboard to view
    router.replace("/dashboard/select");
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="flex select-none h-screen bg-slate-100 overflow-hidden">
      <DashboardLoading
        type="structure"
        message="Redirecting to dashboard..."
      />
    </div>
  );
}
