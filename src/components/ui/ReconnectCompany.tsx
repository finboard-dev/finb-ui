"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ReconnectCompany: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Account Disconnected</h2>
          <p className="text-gray-600 mb-4">
            Your QuickBooks account has been disconnected. Please reconnect to
            continue.
          </p>
          <Button>Reconnect Account</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReconnectCompany;
