'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Shimmer } from '@/app/chat/components/chat/ui/shimmer/Shimmer';
import { Sidebar } from '@/components/ui/common/sidebar';
import { useAppSelector } from '@/lib/store/hooks';
import { selectIsComponentOpen } from '@/lib/store/slices/uiSlice';
import Navbar from '@/components/ui/common/navbar';

interface DashboardShimmerProps {
  className?: string;
}

export function DashboardShimmer({ className }: DashboardShimmerProps) {
  // Use component-based sidebar state
  const isSidebarOpen = useAppSelector((state) => selectIsComponentOpen(state, 'sidebar-chat'));
  const isSidebarCollapsed = !isSidebarOpen;

  // Generate random grid items to simulate dashboard layout
  const shimmerItems = [
    { x: 0, y: 0, w: 6, h: 4, type: 'kpi' },
    { x: 6, y: 0, w: 6, h: 4, type: 'kpi' },
    { x: 0, y: 4, w: 8, h: 6, type: 'graph' },
    { x: 8, y: 4, w: 4, h: 6, type: 'table' },
    { x: 0, y: 10, w: 12, h: 8, type: 'table' },
  ];

  return (
    <div className={cn('flex h-screen select-none', className)}>
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} />

      <div className="flex-1 flex flex-col">
        {/* Header Shimmer - Two parts like real header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 flex-shrink-0">
          {/* Top part - Navbar */}
          <Navbar
            className="h-[3.8rem] !px-4 !shadow-none"
            title="Dashboard"
            isCollapsed={isSidebarCollapsed}
            collpaseSidebar={() => {}}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Action buttons shimmer */}
              <Shimmer className="h-9 w-24 rounded-md" />
              <Shimmer className="h-9 w-28 rounded-md" />
              <Shimmer className="h-9 w-20 rounded-md" />
            </div>
          </Navbar>

          {/* Bottom part - Tab Navigation */}
          <div className="px-4 md:px-6 py-2">
            <div className="flex items-center justify-between">
              {/* Left side - Tabs */}
              <div className="flex items-center">
                {/* Scroll left button */}
                <Shimmer className="h-8 w-8 rounded-full" />

                {/* Tab container */}
                <div className="flex-1 mx-1 rounded-lg max-w-[400px]">
                  <div className="relative">
                    <div className="overflow-x-auto scrollbar-hide">
                      <div className="inline-flex gap-1 p-0.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-inner min-w-full">
                        {/* Tab shimmer items */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white shadow-md shadow-blue-100/30 text-blue-600 border border-blue-200/30">
                          <Shimmer className="w-2.5 h-2.5" />
                          <Shimmer className="h-3 w-16" />
                          <Shimmer className="w-1.5 h-1.5 rounded-full" />
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-transparent text-gray-600">
                          <Shimmer className="h-3 w-20" />
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-transparent text-gray-600">
                          <Shimmer className="h-3 w-14" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add new tab button */}
                <Shimmer className="h-8 w-8 rounded-md ml-2" />

                {/* Scroll right button */}
                <Shimmer className="h-8 w-8 rounded-full" />
              </div>

              {/* Right side - Version indicator and actions */}
              <div className="flex items-center gap-2">
                {/* Version indicator */}
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                  <Shimmer className="h-4 w-16" />
                  <Shimmer className="h-6 w-12 rounded" />
                </div>

                {/* Share button */}
                <Shimmer className="h-8 w-20 rounded-md" />

                {/* More options dropdown */}
                <Shimmer className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Date Controls Shimmer */}
        <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-6">
          <div className="flex items-center space-x-4">
            <Shimmer className="h-8 w-32" />
            <Shimmer className="h-8 w-24" />
            <Shimmer className="h-8 w-20" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Dashboard Controls (if editing) */}
          <div className="w-0 md:w-0 lg:w-0">{/* Controls panel would be here in edit mode */}</div>

          {/* Main Dashboard Grid */}
          <div className="flex-1 bg-gray-50 overflow-auto p-4">
            <div className="relative w-full h-full">
              {/* Grid container with responsive layout */}
              <div className="grid grid-cols-12 gap-4 auto-rows-min" style={{ minHeight: '600px' }}>
                {shimmerItems.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      'bg-white rounded-lg border border-gray-200 p-4 shadow-sm',
                      `col-span-${item.w} row-span-${item.h}`
                    )}
                    style={{
                      gridColumn: `span ${item.w}`,
                      gridRow: `span ${item.h}`,
                    }}
                  >
                    {/* Item header */}
                    <div className="flex items-center justify-between mb-3">
                      <Shimmer className="h-5 w-32" />
                      <div className="flex items-center space-x-2">
                        <Shimmer className="h-4 w-4 rounded" />
                        <Shimmer className="h-4 w-4 rounded" />
                      </div>
                    </div>

                    {/* Item content based on type */}
                    <div className="flex-1">
                      {item.type === 'kpi' && (
                        <div className="space-y-2">
                          <Shimmer className="h-8 w-20" />
                          <Shimmer className="h-4 w-16" />
                        </div>
                      )}

                      {item.type === 'graph' && (
                        <div className="space-y-3">
                          <Shimmer className="h-4 w-24" />
                          <div className="flex items-end space-x-1 h-32">
                            {Array.from({ length: 8 }).map((_, i) => (
                              <Shimmer key={i} className="flex-1" style={{ height: `${Math.random() * 60 + 20}%` }} />
                            ))}
                          </div>
                        </div>
                      )}

                      {item.type === 'table' && (
                        <div className="space-y-3">
                          <Shimmer className="h-4 w-32" />
                          <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="flex space-x-2">
                                <Shimmer className="h-4 flex-1" />
                                <Shimmer className="h-4 w-20" />
                                <Shimmer className="h-4 w-16" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
