"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, ArrowRight } from "lucide-react";

interface AdjustEliminationsProps {
  onNext: () => void;
  onBack: () => void;
  selectedCompanyId: string;
}

export function AdjustEliminations({
  onNext,
  onBack,
  selectedCompanyId,
}: AdjustEliminationsProps) {
  return (
    <>
      <div className="px-10 pt-8 bg-white shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Adjust Eliminations
              </h2>
              <p className="text-sm text-gray-600">
                Configure eliminations for intercompany transactions and
                balances
              </p>
            </div>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
              Step 3 of 4
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#1E925A]" />
                  Intercompany Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Identify and configure eliminations for transactions between
                  related companies.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">
                      Receivables/Payables
                    </span>
                    <Badge variant="outline" className="text-xs">
                      5 transactions
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">
                      Revenue/Expenses
                    </span>
                    <Badge variant="outline" className="text-xs">
                      3 transactions
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Investments</span>
                    <Badge variant="outline" className="text-xs">
                      2 transactions
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-[#1E925A]" />
                  Elimination Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Set up automatic elimination rules for common intercompany
                  scenarios.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">100% Ownership</span>
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">
                      Partial Ownership
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Configure
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Custom Rules</span>
                    <Badge variant="outline" className="text-xs">
                      Available
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
              <Calculator className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Elimination Configuration Interface
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md">
              This is where you'll configure eliminations for intercompany
              transactions. The interface will allow you to set up automatic
              elimination rules and review transactions.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button onClick={onNext}>Continue to Step 4</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
