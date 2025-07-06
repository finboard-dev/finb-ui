"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutDashboardIcon, SearchIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

// Mock dashboard data - in a real app, this would come from an API
const availableDashboards = [
  {
    id: "XERO_DASH_001",
    name: "Xero Financial Dashboard",
    description: "Main financial overview dashboard",
  },
];

export default function DashboardSelectPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDashboards, setFilteredDashboards] =
    useState(availableDashboards);

  useEffect(() => {
    const filtered = availableDashboards.filter(
      (dashboard) =>
        dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dashboard.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDashboards(filtered);
  }, [searchTerm]);

  const handleDashboardSelect = (dashboardId: string) => {
    router.push(`/dashboard/${dashboardId}`);
  };

  const handleCreateNew = () => {
    // In a real app, this would create a new dashboard
    toast.info("Create new dashboard functionality coming soon!");
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Select Dashboard
          </h1>
          <p className="text-slate-600">
            Choose a dashboard to view or create a new one
          </p>
        </div>

        {/* Search and Create */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-white relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search dashboards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleCreateNew}
            className="flex bg-primary text-white items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            New Dashboard
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map((dashboard) => (
            <Card
              key={dashboard.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:border-blue-300"
              onClick={() => handleDashboardSelect(dashboard.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <LayoutDashboardIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-800">
                      {dashboard.name}
                    </CardTitle>
                    <p className="text-sm text-slate-500">ID: {dashboard.id}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-4">
                  {dashboard.description}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDashboardSelect(dashboard.id);
                  }}
                >
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredDashboards.length === 0 && (
          <div className="text-center py-12">
            <LayoutDashboardIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No dashboards found
            </h3>
            <p className="text-slate-500 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Get started by creating your first dashboard"}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="mr-2"
              >
                Clear Search
              </Button>
            )}
            <Button onClick={handleCreateNew}>Create Dashboard</Button>
          </div>
        )}
      </div>
    </div>
  );
}
