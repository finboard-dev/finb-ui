"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { selectCompanies } from "@/lib/store/slices/userSlice";
import { disconnectConnection } from "@/lib/api/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Home, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const DisconnectPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const companies = useAppSelector(selectCompanies);
  console.log(companies);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  // Get realmId from URL parameters
  const realmId = searchParams.get("realmid");

  useEffect(() => {
    const handleDisconnect = async () => {
      // If no realmId provided, show error
      if (!realmId) {
        setError("Cannot find company to disconnect");
        return;
      }

      // Find company with matching realmId
      const company = companies.find((comp: any) => comp.realmId === realmId);

      if (!company) {
        setError("Company not found");
        return;
      }

      setCompanyName(company.name);
      setIsLoading(true);

      try {
        await disconnectConnection(company.id);
        setIsSuccess(true);
        toast.success("Company disconnected successfully");
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to disconnect company";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    handleDisconnect();
  }, [realmId, companies]);

  const handleGoHome = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-semibold mb-2">
              Disconnecting Company
            </h2>
            <p className="text-gray-600">
              {companyName
                ? `Disconnecting ${companyName}...`
                : "Disconnecting company..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2">Company Disconnected</h2>
            <p className="text-gray-600 mb-4">
              {companyName
                ? `${companyName} has been successfully disconnected.`
                : "Company has been successfully disconnected."}
            </p>
            <Button onClick={handleGoHome} className="w-full text-white">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2">Disconnect Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleGoHome} className="w-full text-white">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold mb-2">Processing...</h2>
          <p className="text-gray-600">
            Please wait while we process your request.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisconnectPage;
