import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardLoadingProps {
  type: "structure" | "widgetData";
  message?: string;
}

export const DashboardLoading: React.FC<DashboardLoadingProps> = ({
  type,
  message,
}) => {
  const getLoadingMessage = () => {
    if (message) return message;

    switch (type) {
      case "structure":
        return "Loading dashboard structure...";
      case "widgetData":
        return "Loading widget data...";
      default:
        return "Loading...";
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <Card className="w-full border-none bg-white max-h-[400px] max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-center text-muted-foreground">
            {getLoadingMessage()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export const DashboardError: React.FC<{ error: string }> = ({ error }) => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Card className="w-full bg-white border-none max-h-[400px] max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-center text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    </div>
  );
};
