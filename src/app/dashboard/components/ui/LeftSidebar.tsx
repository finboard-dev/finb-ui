"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  MessageCircleCodeIcon,
  ComponentIcon,
  BarChartBigIcon,
  GitForkIcon,
  SettingsIcon,
  BuildingIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  FilePlus2Icon,
  ListChecksIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const navItems = [
  { href: "/fin-chat", label: "Fin Chat", icon: MessageCircleCodeIcon },
  { href: "/components", label: "Components", icon: ComponentIcon },
  { href: "/reports", label: "Reports", icon: BarChartBigIcon },
  { href: "/mapping", label: "Mapping", icon: GitForkIcon },
];

interface AppSidebarProps {
  savedDashboards?: { id: string; name: string }[];
  onLoadDashboard?: (id: string) => void;
  currentDashboardId?: string | null;
  onNewDashboard?: () => void;
  isEditing?: boolean;
  collapsible?: boolean;
}

export default function AppSidebar({
  savedDashboards,
  onLoadDashboard,
  currentDashboardId,
  onNewDashboard,
  isEditing,
  collapsible = true,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isDashboardSectionOpen, setIsDashboardSectionOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (pathname === "/dashboard") {
      setIsDashboardSectionOpen(true);
    }
  }, [pathname]);

  const NavLink = ({
    href,
    icon: Icon,
    label,
    isCurrent,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    isCurrent: boolean;
  }) => {
    return (
      <Button
        variant={isCurrent ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start text-sm font-medium",
          isCurrent
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
        asChild
      >
        <Link
          href={href}
          className="flex items-center gap-3 rounded-md px-3 py-2"
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">{label}</span>
        </Link>
      </Button>
    );
  };

  return (
    <>
      {isSidebarOpen ? (
        <aside className="w-60 h-screen bg-gray-50 border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40">
          <div className="px-5 py-5 border-b border-gray-200 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <BuildingIcon className="h-7 w-7 text-blue-600 flex-shrink-0" />
              <h1 className="text-xl font-bold text-gray-800 truncate">
                FinB AI
              </h1>
            </Link>
            {collapsible && (
              <Button
                onClick={() => setIsSidebarOpen(false)}
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
            )}
          </div>

          <nav className="flex-grow px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
            {/* Dashboard Collapsible Section */}
            <Collapsible
              open={isDashboardSectionOpen}
              onOpenChange={setIsDashboardSectionOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={
                    pathname === "/dashboard" ||
                    savedDashboards?.some((d) => d.id === currentDashboardId)
                      ? "secondary"
                      : "ghost"
                  }
                  className={cn(
                    "w-full text-sm font-medium justify-between pr-2",
                    pathname === "/dashboard" ||
                      savedDashboards?.some((d) => d.id === currentDashboardId)
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3"
                    onClick={(e) => {
                      if (pathname !== "/dashboard" && !currentDashboardId)
                        onNewDashboard?.();
                      else if (
                        pathname === "/dashboard" &&
                        !currentDashboardId &&
                        !isEditing
                      )
                        onNewDashboard?.();
                    }}
                  >
                    <LayoutDashboardIcon className="h-5 w-5 flex-shrink-0" />
                    <span>Dashboard</span>
                  </Link>
                  {isDashboardSectionOpen ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-1 space-y-1 pl-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 pl-3"
                  onClick={() => {
                    onNewDashboard?.();
                    if (pathname !== "/dashboard") {
                      /* Consider navigation */
                    }
                  }}
                >
                  <FilePlus2Icon className="h-4 w-4 mr-2" />
                  New Dashboard
                </Button>
                {savedDashboards && savedDashboards.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase">
                      Saved
                    </h4>
                    {savedDashboards.map((dashboard) => (
                      <Button
                        key={dashboard.id}
                        variant={
                          currentDashboardId === dashboard.id
                            ? "secondary"
                            : "ghost"
                        }
                        className={cn(
                          "w-full justify-start text-xs font-medium truncate pl-3",
                          currentDashboardId === dashboard.id
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        )}
                        onClick={() => onLoadDashboard?.(dashboard.id)}
                        title={dashboard.name}
                      >
                        <ListChecksIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{dashboard.name}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Other Navigation Items */}
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isCurrent={pathname === item.href}
              />
            ))}
          </nav>

          {/* Settings */}
          <div className="mt-auto p-3 border-t border-gray-200">
            <NavLink
              href="/dashboard/settings"
              icon={SettingsIcon}
              label="Settings"
              isCurrent={pathname === "/dashboard/settings"}
            />
          </div>
        </aside>
      ) : (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50">
          <Button
            onClick={() => setIsSidebarOpen(true)}
            variant="outline"
            className="bg-white rounded-r-lg rounded-l-none px-2 py-6 text-sm text-gray-600 hover:bg-gray-50 border-gray-300 shadow-lg flex flex-col items-center h-auto gap-1 hover:border-gray-400"
          >
            <ChevronRightIcon className="w-5 h-5" />
            <span className="[writing-mode:vertical-rl] transform rotate-180 text-xs font-medium tracking-wider uppercase">
              Menu
            </span>
          </Button>
        </div>
      )}
    </>
  );
}
