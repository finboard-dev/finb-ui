"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText } from "lucide-react";

interface ReviewFinalizeProps {
  selectedCompanyId: string;
}

export function ReviewFinalize({ selectedCompanyId }: ReviewFinalizeProps) {
  return (
    <>
      <div className="px-10 pt-8 bg-white shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Review & Finalize
              </h2>
              <p className="text-sm text-gray-600">
                Review your consolidation setup and generate the final report
              </p>
            </div>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              Step 4 of 4
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#1E925A]" />
                  Setup Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Review the configuration for your consolidation setup.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">
                      Accounts Created
                    </span>
                    <Badge variant="outline" className="text-xs">
                      25 accounts
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Accounts Linked</span>
                    <Badge variant="outline" className="text-xs">
                      23 linked
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Eliminations</span>
                    <Badge variant="outline" className="text-xs">
                      10 configured
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1E925A]" />
                  Report Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Preview the consolidated financial statements that will be
                  generated.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Balance Sheet</span>
                    <Badge variant="outline" className="text-xs">
                      Ready
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">
                      Income Statement
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Ready
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Cash Flow</span>
                    <Badge variant="outline" className="text-xs">
                      Ready
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 px-10 pt-5 bg-white overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Final Review Interface
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md">
              This is where you'll review all your consolidation settings and
              generate the final report. You can preview the consolidated
              statements before finalizing.
            </p>
            <div className="flex gap-3 justify-center">
              <Button className="bg-[#1E925A] hover:bg-[#167a4a]">
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
