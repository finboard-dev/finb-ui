"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangleIcon, ArrowLeftIcon, HomeIcon } from "lucide-react";

export default function DashboardNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <AlertTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-slate-800">
            Dashboard Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-600">
            The dashboard you're looking for doesn't exist or you don't have
            permission to access it.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => router.push("/dashboard/select")}
              className="w-full"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Browse Dashboards
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
