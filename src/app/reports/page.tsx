"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { selectIsComponentOpen, toggleComponent } from "@/lib/store/slices/uiSlice";
import { Sidebar } from "@/components/ui/common/sidebar";
import { CompanyModal } from "@/components/ui/common/CompanyModal";
import Navbar from "@/components/ui/common/navbar";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronRight,
  ChevronDown,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useReports } from "@/hooks/query-hooks/useReports";
import { useInactiveCompany } from "@/hooks/useInactiveCompany";

// Format date strings for display in the table
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(
    new Set()
  );

  // Check if company is inactive
  const { isCompanyInactive, InactiveCompanyUI } = useInactiveCompany();

  const { data: reportsData, isLoading, error } = useReports();
  const isSidebarCollapsed = !useAppSelector((state) => selectIsComponentOpen(state, "sidebar-chat"));

  useEffect(() => {
    dispatch({
      type: "ui/initializeComponent",
      payload: { type: "sidebar", id: "sidebar-chat", isOpenFromUrl: true },
    });
  }, [dispatch]);

  const toggleExpanded = (packageId: string) => {
    setExpandedPackages((prev) => {
      const newSet = new Set(prev);
      newSet.has(packageId) ? newSet.delete(packageId) : newSet.add(packageId);
      return newSet;
    });
  };

  // Filter reports based on search term
  const filteredReports = useMemo(() => {
    if (!reportsData || !searchTerm) return reportsData || [];
    
    return reportsData.filter(pkg =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.reports.some(report => report.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [reportsData, searchTerm]);

  // If company is inactive, show the inactive company UI
  if (isCompanyInactive) {
    return <InactiveCompanyUI title="Reports" />;
  }

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading reports...</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <p className="text-red-600 mb-2">Failed to load reports</p>
        <p className="text-gray-600 text-sm">{error?.message}</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <tr>
      <td colSpan={6} className="py-12 px-6 text-center">
        <p className="text-sm text-gray-500 mb-1">No reports found</p>
        <p className="text-xs text-gray-400">Try adjusting your search</p>
      </td>
    </tr>
  );

  const columnWidths = ['300px', '180px', '160px', '160px', '180px', '120px'];
  const headers = ['Reports', 'Company', 'Last Updated', 'Created', 'Created By', 'Link'];

  return (
    <div className="flex select-none h-screen bg-slate-100 overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-x-hidden ml-0">
        <Navbar
          title="Reports"
          isCollapsed={isSidebarCollapsed}
          className="!h-[3.8rem]"
          collpaseSidebar={() => dispatch(toggleComponent({ id: "sidebar-chat" }))}
        />

        <main className="flex-1 overflow-auto bg-white p-6">
          {/* Search Section */}
          <div className="mb-6">
            <div className="py-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Find by report name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-gray-400 focus:ring-gray-400 selection:bg-blue-100 selection:text-blue-900"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {isLoading ? renderLoadingState() : error ? renderErrorState() : (
              <div className="h-[calc(100vh-280px)] flex flex-col">
                {/* Fixed Header */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] table-fixed">
                    <colgroup>
                      {columnWidths.map((width, index) => <col key={index} style={{ width }} />)}
                    </colgroup>
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {headers.map((header, index) => (
                          <th key={index} className="text-left py-3 px-6 text-sm font-medium text-gray-700">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto overflow-x-auto">
                  <table className="w-full min-w-[1000px] table-fixed">
                    <colgroup>
                      {columnWidths.map((width, index) => <col key={index} style={{ width }} />)}
                    </colgroup>
                    <tbody className="divide-y divide-gray-200">
                      {filteredReports.length === 0 ? renderEmptyState() : 
                        filteredReports.map((reportPackage) => (
                          <React.Fragment key={reportPackage.id}>
                            {/* Package Row */}
                            <tr className="hover:bg-gray-50">
                              <td className="py-3 px-6">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleExpanded(reportPackage.id)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    {expandedPackages.has(reportPackage.id) ? 
                                      <ChevronDown className="w-4 h-4 text-gray-600" /> :
                                      <ChevronRight className="w-4 h-4 text-gray-600" />
                                    }
                                  </button>
                                  <span className="text-sm text-gray-900 truncate">{reportPackage.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-6 text-sm text-gray-400">-</td>
                              <td className="py-3 px-6 text-sm text-gray-400">-</td>
                              <td className="py-3 px-6 text-sm text-gray-600">{formatDate(reportPackage.createdDate)}</td>
                              <td className="py-3 px-6 text-sm text-gray-600 truncate">{reportPackage.createdBy || '-'}</td>
                              <td className="py-3 px-6">
                                <a
                                  href={reportPackage.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              </td>
                            </tr>

                            {/* Report Rows */}
                            {expandedPackages.has(reportPackage.id) && 
                              reportPackage.reports
                                .filter(report => report.status === 'ACTIVE')
                                .map((report) => (
                                  <tr key={`${reportPackage.id}-${report.id}`} className="hover:bg-gray-50 bg-gray-25">
                                    <td className="py-3 px-6">
                                      <div className="flex items-center gap-2 ml-8">
                                        <FileText className="w-3 h-3 text-gray-500" />
                                        <span className="text-sm text-gray-900 truncate">{report.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-6 text-sm text-gray-600 truncate">{report.companyName || '-'}</td>
                                    <td className="py-3 px-6 text-sm text-gray-600">{report.lastSyncAt ? formatDate(report.lastSyncAt) : '-'}</td>
                                    <td className="py-3 px-6 text-sm text-gray-600">{formatDate(report.createdAt)}</td>
                                    <td className="py-3 px-6 text-sm text-gray-400">-</td>
                                    <td className="py-3 px-6 text-sm text-gray-400">-</td>
                                  </tr>
                                ))
                            }
                          </React.Fragment>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      <CompanyModal />
    </div>
  );
}
