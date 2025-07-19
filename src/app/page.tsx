"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useClickEventTracking } from "@/hooks/useClickTracking";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { selectDropDownLoading } from "@/lib/store/slices/loadingSlice";
import QuickbooksIcon from "@/../public/home/quickbooks.svg";
import chatIcon from "@/../public/images/icons/sidebarIcons/chat.svg";
import dashboardIcon from "@/../public/images/icons/sidebarIcons/dashboard.svg";
import ReportsIcon from "@/../public/images/icons/sidebarIcons/reports.svg";
import consolidationIcon from "@/../public/images/icons/sidebarIcons/consolidation.svg";
import componentsIcon from "@/../public/images/icons/sidebarIcons/components.svg";

import Navbar from "@/components/ui/common/navbar";
import { Button } from "@/components/ui/button";
import { MessageSquare, BarChart3, Save, Grid3X3 } from "lucide-react";
import Image from "next/image";

const stepItems = [
  // {
  //   id: "connect-quickbooks",
  //   label: "Connect QuickBooks",
  //   description: "Sync your financial data in one click",
  //   icon: (
  //     <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
  //       <Image src={QuickbooksIcon} alt="QuickBooks" width={16} height={16} />
  //     </div>
  //   ),
  //   href: "/oauth2redirect/quickbooks",
  //   buttonText: "Connect",
  //   stepNumber: 1,
  // },
  {
    id: "chat",
    label: "Fin Chat",
    description: "AI-powered financial assistant and chat interface",
    icon: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Image src={chatIcon} alt="Chat" width={16} height={16} />
      </div>
    ),
    href: "/chat",
    stepNumber: 1,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "View and manage your financial dashboards",
    icon: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Image src={dashboardIcon} alt="Dashboard" width={16} height={16} />
      </div>
    ),
    href: "/dashboard",
    stepNumber: 2,
  },
  {
    id: "components",
    label: "Components",
    description: "Browse and manage reusable UI components",
    icon: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Image src={componentsIcon} alt="Components" width={16} height={16} />
      </div>
    ),
    href: "/components",
    stepNumber: 3,
  },
  {
    id: "reports",
    label: "Reports",
    description: "Generate and view financial reports",
    icon: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Image src={ReportsIcon} alt="Reports" width={16} height={16} />
      </div>
    ),
    href: "/reports",
    stepNumber: 4,
  },
  {
    id: "consolidation",
    label: "Consolidation",
    description: "Account mapping and consolidation tools",
    icon: (
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
        <Image
          src={consolidationIcon}
          alt="Consolidation"
          width={24}
          height={24}
        />
      </div>
    ),
    href: "/consolidation",
    stepNumber: 5,
  },
];

const Page = () => {
  const router = useRouter();

  useClickEventTracking();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto bg-white p-6">
          <div className="max-w-5xl z-50 mx-auto">
            <div className="max-w-4xl mx-auto px-12">
              {/* Logo and Welcome Section */}
              <div className="text-center mb-12">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  {/* <div className="w-16 h-12 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">F</span>
                  </div> */}
                </div>

                {/* Welcome Title */}
                <h1 className="text-[2.13rem] font-bold text-gray-900 mb-4">
                  Welcome to FinB
                </h1>
                <p className="text-gray-600 text-sm max-w-2xl mx-auto">
                  Connect your data, generate insights with AI, and <br /> build
                  custom financial dashboards
                </p>
              </div>

              {/* Step Cards */}
              <div className="space-y-4 h-[calc(100vh-300px)] z-50 overflow-y-auto scroll-hidden">
                {stepItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-6 flex items-center justify-between cursor-pointer"
                    onClick={() => handleNavigation(item.href)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {item.label}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* <Button
                        variant="outline"
                        className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigation(item.href);
                        }}
                      >
                        Connect
                      </Button> */}
                      <span className="text-6xl font-light text-gray-200">
                        {item.stepNumber}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Page;
