"use client";

import { format } from "date-fns";
import { ChevronRight, Calendar, User, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dashboard } from "@/lib/api/dashboard";

interface DashboardCardProps {
  dashboard: Dashboard;
  onClick: (dashboardId: string) => void;
  isSelected?: boolean;
}

export function DashboardCard({
  dashboard,
  onClick,
  isSelected = false,
}: DashboardCardProps) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy 'at' h:mm a");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-gray-200 hover:border-primary/30 bg-white"
      )}
      onClick={() => onClick(dashboard.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Left side - Dashboard info */}
          <div className="flex-1 space-y-4">
            {/* Title and Creator */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors">
                {dashboard.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Created by {dashboard.createdBy.name}</span>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(dashboard.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Updated {formatDate(dashboard.updatedAt)}</span>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Draft
              </span>
              {dashboard.publishedVersionId && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Published
                </span>
              )}
            </div>
          </div>

          {/* Right side - Avatar and chevron */}
          <div className="flex flex-col items-end gap-4">
            {/* Animated Chevron */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-primary/10 transition-all duration-300">
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
            </div>
          </div>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
      </CardContent>
    </Card>
  );
}
