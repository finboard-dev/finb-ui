"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, LayoutGrid, FileText, Grid, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Navigation items matching the image
  const navItems = [
    { icon: Home, href: "/" },
    { icon: LayoutGrid, href: "/dashboard" },
    { icon: FileText, href: "/documents" },
    { icon: Grid, href: "/apps" },
    { icon: User, href: "/profile" },
  ];

  // Handle mouse entering the left edge of the screen
  const handleEdgeEnter = () => {
    setIsExpanded(true);
  };

  // Handle mouse leaving the sidebar
  const handleSidebarLeave = () => {
    setIsExpanded(false);
  };

  return (
    <>
      {/* Edge detection area */}
      <div
        className="fixed top-0 left-0 w-4 h-full z-40 pointer-events-auto"
        onMouseEnter={handleEdgeEnter}
      />

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none p-3 z-50">
        <div
          className={cn(
            "w-16 h-full bg-[#222327] rounded-lg shadow-lg flex flex-col items-center py-6 pointer-events-auto transition-transform duration-300 ease-in-out",
            isExpanded ? "translate-x-0" : "-translate-x-20"
          )}
          onMouseLeave={handleSidebarLeave}
        >
          {/* Logo area */}
          <div className="mb-12">
            <div className="text-white font-bold text-2xl">N</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col items-center space-y-8">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                target="_self"
                className={cn(
                  "text-gray-400 hover:text-white transition-colors p-2",
                  activeItem === index && "text-white"
                )}
                onClick={() => setActiveItem(index)}
              >
                <item.icon className="h-6 w-6" />
              </Link>
            ))}
          </nav>

          {/* User profile at bottom */}
          <div className="mt-auto">
            <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-300" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
