"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  REPORT_TYPES,
  REPORT_TYPE_COLUMNS,
} from "../../types/consolidationUiMapping";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  useChartOfAccounts,
  useMappingForAccountByType,
} from "@/hooks/query-hooks/useConsolidationApi";
import { store } from "@/lib/store/store";

interface ReviewFinalizeProps {
  selectedCompanyId: string;
}

// Helper to render account path with correct styles
function renderAccountPath(path: string) {
  const segments = path.split(" > ");
  return (
    <span>
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <span key={idx}>
            {!isLast && <span className="text-muted-foreground">{seg}</span>}
            {isLast && <span className="text-primary font-medium">{seg}</span>}
            {idx < segments.length - 1 && (
              <span className="text-muted-foreground"> {">"} </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

// Helper to flatten accounts tree (same as LinkAccounts)
function flattenAccounts(
  node: any,
  parentPath: string[] = []
): { id: string; name: string }[] {
  const currentPath = [...parentPath, node.title];
  let rows = [
    {
      id: node.account_id,
      name: currentPath.join(" > "),
    },
  ];
  for (const child of node.children) {
    rows = rows.concat(flattenAccounts(child, currentPath));
  }
  return rows;
}

// Helper to flatten mapping tree
function flattenMappingTree(
  nodes: any[],
  parentPath: string[] = []
): { id: string; name: string }[] {
  let rows: { id: string; name: string }[] = [];
  for (const node of nodes) {
    const currentPath = [...parentPath, node.title];
    rows.push({ id: node.account_id, name: currentPath.join(" > ") });
    if (node.children && node.children.length > 0) {
      rows = rows.concat(flattenMappingTree(node.children, currentPath));
    }
  }
  return rows;
}

// Helper to find mapped accounts for a given master account
function findMappedAccountsForMaster(
  mappingData: any,
  masterAccountId: string,
  companyId: string
): any[] {
  const mappedAccounts: any[] = [];

  for (const typeKey of Object.keys(mappingData)) {
    const stack = [...mappingData[typeKey]];
    while (stack.length) {
      const node = stack.pop();
      if (node.account_id === masterAccountId && node.mapped_account) {
        // Filter mapped accounts for this specific company
        const companyMappedAccounts = node.mapped_account.filter(
          (acc: any) => acc.realm_id === companyId
        );
        mappedAccounts.push(...companyMappedAccounts);
      }
      if (node.children && node.children.length > 0) {
        stack.push(...node.children);
      }
    }
  }

  return mappedAccounts;
}

// Helper to get account full path by ID from accounts data
function getAccountPathById(
  accountsData: any,
  accountId: string,
  companyId: string,
  reportType: string
): string {
  const companyData = accountsData?.data?.[companyId]?.[reportType];
  if (!companyData) return "Unknown Account";

  for (const typeKey of Object.keys(companyData)) {
    const findAccountPathRecursive = (
      node: any,
      parentPath: string[] = []
    ): string | null => {
      const currentPath = [...parentPath, node.title];
      if (node.account_id === accountId) {
        return currentPath.join(" > ");
      }
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const found = findAccountPathRecursive(child, currentPath);
          if (found) return found;
        }
      }
      return null;
    };

    const found = findAccountPathRecursive(companyData[typeKey]);
    if (found) return found;
  }

  return "Unknown Account";
}

export function ReviewFinalize({ selectedCompanyId }: ReviewFinalizeProps) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);

  const companiesData = store?.getState()?.user?.companies;
  const { data: accountsData, isLoading: accountsLoading } =
    useChartOfAccounts(selectedCompanyId);
  const { data: mappingData, isLoading: mappingLoading } =
    useMappingForAccountByType(selectedCompanyId, reportType);

  // Get all master COA accounts (mapped accounts)
  const masterCOAAccounts = useMemo(() => {
    if (!mappingData?.data?.mapping) return [];

    const allMasterAccounts: { id: string; name: string; type: string }[] = [];
    const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];

    for (const typeOpt of typeOptions) {
      const typeKey = typeOpt.key;
      const nodes = mappingData.data.mapping[typeKey] || [];
      const flatAccounts = flattenMappingTree(nodes);

      flatAccounts.forEach((account) => {
        allMasterAccounts.push({
          id: account.id,
          name: account.name,
          type: typeOpt.label,
        });
      });
    }

    return allMasterAccounts;
  }, [mappingData, reportType]);

  // Get companies that have mappings
  const companiesWithMappings = useMemo(() => {
    if (!mappingData?.data?.mapping || !companiesData) return [];

    const companiesWithData: { id: string; name: string }[] = [];

    companiesData.forEach((company: any) => {
      const companyId = company.id;
      let hasMappings = false;

      // Check if this company has any mappings
      for (const typeKey of Object.keys(mappingData.data.mapping)) {
        const stack = [...mappingData.data.mapping[typeKey]];
        while (stack.length) {
          const node = stack.pop();
          if (node.mapped_account && node.mapped_account.length > 0) {
            const hasCompanyMappings = node.mapped_account.some(
              (acc: any) => acc.realm_id === companyId
            );
            if (hasCompanyMappings) {
              hasMappings = true;
              break;
            }
          }
          if (node.children && node.children.length > 0) {
            stack.push(...node.children);
          }
        }
        if (hasMappings) break;
      }

      if (hasMappings) {
        companiesWithData.push({
          id: companyId,
          name: company.name,
        });
      }
    });

    return companiesWithData;
  }, [mappingData, companiesData]);

  // Get mapped accounts for each master account and company
  const getMappedAccountsForMasterAndCompany = useCallback(
    (masterAccountId: string, companyId: string) => {
      if (!mappingData?.data?.mapping || !accountsData?.data) return [];

      const mappedAccounts = findMappedAccountsForMaster(
        mappingData.data.mapping,
        masterAccountId,
        companyId
      );

      return mappedAccounts.map((mappedAcc) => {
        // Find the full path for this account from the accounts data
        const companyData = accountsData.data[companyId];
        const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
        let fullPath = mappedAcc.title; // fallback to title

        for (const typeOpt of typeOptions) {
          const rootNode = companyData?.[reportType]?.[typeOpt.key];
          if (!rootNode) continue;

          const flatAccounts = flattenAccounts(rootNode);
          const foundAccount = flatAccounts.find(
            (acc) => acc.id === mappedAcc.account_id
          );
          if (foundAccount) {
            fullPath = foundAccount.name;
            break;
          }
        }

        return {
          id: mappedAcc.account_id,
          name: fullPath,
          isEliminated: mappedAcc.is_eliminated,
        };
      });
    },
    [mappingData, accountsData, reportType]
  );

  const handleReportTypeChange = (newReportType: string) => {
    setReportType(newReportType);
  };

  return (
    <>
      <div className="px-10 pt-8 bg-white shrink-0">
        <div className="flex-wrap bg-white border border-gray-200 rounded-2xl p-4 flex gap-8 items-end w-full minw-full mx-auto">
          <div className="flex flex-col min-w-56">
            <Label className="text-xs font-medium text-[#767A8B] mb-2 tracking-wide">
              REPORT TYPE
            </Label>
            <Select value={reportType} onValueChange={handleReportTypeChange}>
              <SelectTrigger className="text-sm min-w-full bg-white">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((rt: any) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="px-10 bg-white pt-4 pb-2">
        <div className="w-full border rounded-2xl bg-white overflow-hidden">
          {/* Fixed Header */}
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-80" />
              {companiesWithMappings.map((company) => (
                <col key={company.id} className="w-48" />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-white h-14">
                <th className="text-left px-4 py-3 border-b border-[#EFF1F5] font-normal text-sec text-sm w-80">
                  <div className="flex items-center justify-between gap-2">
                    <span>Master COA</span>
                    <div className="flex flex-col">
                      <ChevronUp className="w-3 h-3 text-sec -mb-1" />
                      <ChevronDown className="w-3 h-3 text-sec" />
                    </div>
                  </div>
                </th>
                {companiesWithMappings.map((company) => (
                  <th
                    key={company.id}
                    className="text-left px-4 py-3 border-b border-l border-[#EFF1F5] font-normal text-sec text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{company.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          </table>

          {/* Scrollable Body */}
          <div style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
            {accountsLoading || mappingLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007aff] mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">
                    Loading review data...
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full border-collapse table-fixed">
                <colgroup>
                  <col className="w-80" />
                  {companiesWithMappings.map((company) => (
                    <col key={company.id} className="w-48" />
                  ))}
                </colgroup>
                <tbody>
                  {masterCOAAccounts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={companiesWithMappings.length + 1}
                        className="px-4 py-12 text-center"
                      >
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">
                            No mappings found
                          </p>
                          <p className="text-xs text-gray-400">
                            Create mappings in the Link Accounts step first
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    masterCOAAccounts.map((masterAccount, index) => {
                      const isLastRow = index === masterCOAAccounts.length - 1;

                      return (
                        <tr
                          key={masterAccount.id}
                          className={`hover:bg-[#fafbfc] ${
                            !isLastRow ? "border-b" : ""
                          }`}
                        >
                          <td className="px-4 py-4 text-sm">
                            {renderAccountPath(masterAccount.name)}
                          </td>
                          {companiesWithMappings.map((company) => {
                            const mappedAccounts =
                              getMappedAccountsForMasterAndCompany(
                                masterAccount.id,
                                company.id
                              );

                            return (
                              <td
                                key={company.id}
                                className="px-4 py-4 text-sm border-l border-[#EFF1F5]"
                              >
                                {mappedAccounts.length > 0 ? (
                                  <div className="space-y-1">
                                    {mappedAccounts.map((mappedAcc) => (
                                      <div
                                        key={mappedAcc.id}
                                        className="text-xs p-1 rounded bg-gray-50 text-gray-700 border border-gray-200"
                                      >
                                        {renderAccountPath(mappedAcc.name)}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    No mappings
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
