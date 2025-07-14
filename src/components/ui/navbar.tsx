"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  Building2,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { useAppSelector } from "@/lib/store/hooks";
import { selectSelectedCompany } from "@/lib/store/slices/userSlice";
import { useRouter } from "next/navigation";
import { useUrlParams } from "@/lib/utils/urlParams";
import { logout } from "@/lib/api/logout";
import { clearBearerToken } from "@/lib/auth/tokenUtils";
import { toast } from "sonner";
import { useClearReduxState } from "@/hooks/useClearReduxState";

interface NavbarProps {
  className?: string;
}

const Navbar: FC<NavbarProps> = ({ className = "" }) => {
  const clearReduxState = useClearReduxState();
  const { navigateToChatSettings, toggleComponentState } = useUrlParams();
  const router = useRouter();
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const user = useAppSelector((state) => state.user.user);
  const companyModalId = "company-selection";

  const handleLogout = async () => {
    try {
      await logout();
      clearBearerToken();
      await clearReduxState();
      router.push("/login");
      toast.success("Logged out successfully");
    } catch (e) {
      console.error("Error during logout:", e);
      alert("Error during logout. Please try again.");
    }
  };

  return (
    <nav
      className={`bg-white border-b border-gray-200 px-12 py-3 flex items-center justify-between sticky top-0 z-30 h-[4.06rem] flex-shrink-0 ${className}`}
    >
      {/* Left Section - Logo and Company */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {selectedCompany && (
          <Button
            variant="outline"
            id="company-select-button"
            onClick={(e) => {
              e.stopPropagation();
              toggleComponentState(companyModalId, true);
            }}
            className="w-fit flex cursor-pointer border-gray-200 bg-white text-text-primary justify-between items-center"
          >
            <div className="flex items-center ">
              <span className="truncate">
                {selectedCompany?.name || "Select Company"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Center Section - Search */}
      {/* <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations, reports..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
          />
        </div>
      </div> */}

      {/* Right Section - Actions and User */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        {/* <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Bell className="h-4 w-4" />
        </Button> */}

        {/* Help */}
        {/* <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={handleHelp}
        >
          <HelpCircle className="h-4 w-4" />
        </Button> */}

        {/* Settings */}
        {/* <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={handleSettings}
        >
          <Settings className="h-4 w-4" />
        </Button> */}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 w-9 rounded-full p-0 hover:bg-gray-100"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                  {user?.firstName?.[0] || user?.lastName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white shadow-lg border border-gray-200"
          >
            <DropdownMenuLabel className="font-medium text-gray-900">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* <DropdownMenuItem className="text-sm cursor-pointer text-gray-700 hover:bg-gray-100 focus:bg-gray-100">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem> */}
            <DropdownMenuItem
              onClick={() => navigateToChatSettings("data-connections")}
              className="text-sm cursor-pointer text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-sm cursor-pointer text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
