"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  REPORT_TYPES,
  REPORT_TYPE_COLUMNS,
} from "../../types/consolidationUiMapping";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  useChartOfAccounts,
  useMappingForAccountByType,
  useSaveMappings,
} from "@/hooks/query-hooks/useConsolidationApi";
import { store } from "@/lib/store/store";

// Types for Chart of Accounts API
export type ChartOfAccountNode = {
  mapped_account: any[];
  account_id: string;
  children: ChartOfAccountNode[];
  title: string;
};

export type ChartOfAccountsResponse = {
  code: string;
  message: string;
  data: {
    [companyId: string]: {
      [reportType: string]: {
        [accountType: string]: ChartOfAccountNode;
      };
    };
  };
};

interface LinkAccountsProps {
  onNext: () => void;
  selectedCompanyId: string;
  onAutoSaveStateChange?: (isAutoSaving: boolean) => void;
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

// Helper to get the type key from the label
function getTypeKeyFromLabel(label: string): string | undefined {
  const allTypes = Object.values(REPORT_TYPE_COLUMNS).flat();
  const found = allTypes.find((t) => t.label === label);
  return found?.key;
}

// Utility: Recursively find an account node by account_id in a tree
function findAccountRecursive(nodes: any[], accountId: string): any | null {
  for (const node of nodes) {
    if (node.account_id === accountId) return node;
    if (node.children && node.children.length > 0) {
      const found = findAccountRecursive(node.children, accountId);
      if (found) return found;
    }
  }
  return null;
}

// Utility: Find the mapped-to account for a given accountId in the mapping tree
function findMappedToAccountId(
  mappingTree: any,
  accountId: string
): string | null {
  for (const typeKey of Object.keys(mappingTree)) {
    const stack = [...mappingTree[typeKey]];
    while (stack.length) {
      const node = stack.pop();
      if (node.mapped_account && node.mapped_account.length > 0) {
        for (const mapped of node.mapped_account) {
          if (mapped.account_id === accountId) {
            return node.account_id;
          }
        }
      }
      if (node.children && node.children.length > 0) {
        stack.push(...node.children);
      }
    }
  }
  return null;
}

// Utility: Find mapped account info (including realm_id) for a given accountId
function findMappedAccountInfo(
  mappingTree: any,
  accountId: string
): {
  account_id: string;
  realm_id: string;
  title: string;
  is_eliminated: boolean;
} | null {
  for (const typeKey of Object.keys(mappingTree)) {
    const stack = [...mappingTree[typeKey]];
    while (stack.length) {
      const node = stack.pop();
      if (node.mapped_account && node.mapped_account.length > 0) {
        for (const mapped of node.mapped_account) {
          if (mapped.account_id === accountId) {
            return mapped;
          }
        }
      }
      if (node.children && node.children.length > 0) {
        stack.push(...node.children);
      }
    }
  }
  return null;
}

// Helper to find elimination state for a specific account ID and company
function findEliminationState(
  mapping: any,
  accountId: string,
  companyId?: string
): boolean {
  const searchInNodes = (nodes: any[]): boolean | null => {
    for (const node of nodes) {
      const mappedAccount = node.mapped_account?.find((acc: any) => {
        if (companyId) {
          return acc.account_id === accountId && acc.realm_id === companyId;
        }
        return acc.account_id === accountId;
      });
      if (mappedAccount) {
        return mappedAccount.is_eliminated || false;
      }

      if (node.children && node.children.length > 0) {
        const found = searchInNodes(node.children);
        if (found !== null) return found;
      }
    }
    return null;
  };

  const typeOptions = Object.values(REPORT_TYPE_COLUMNS).flat();
  for (const typeOpt of typeOptions) {
    const nodes = mapping[typeOpt.key] || [];
    const found = searchInNodes(nodes);
    if (found !== null) return found;
  }
  return false;
}

// Helper to flatten accounts tree
function flattenAccounts(
  node: ChartOfAccountNode,
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

export function LinkAccounts({
  onNext,
  selectedCompanyId,
  onAutoSaveStateChange,
}: LinkAccountsProps) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [company, setCompany] = useState("");
  const [searchName, setSearchName] = useState("");
  const [accountType, setAccountType] = useState("none");
  const [mappedSelections, setMappedSelections] = useState<{
    [rowId: string]: string;
  }>({});
  const [eliminationStates, setEliminationStates] = useState<{
    [rowId: string]: boolean;
  }>({});
  const [showOnlyUnmapped, setShowOnlyUnmapped] = useState(false);
  const isInitialLoad = useRef(true);
  const hasUserChanges = useRef(false);
  const prevMappedSelections = useRef<{ [rowId: string]: string }>({});
  const prevEliminationStates = useRef<{ [rowId: string]: boolean }>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const companiesData = store?.getState()?.user?.companies;
  const { data: accountsData, isLoading: accountsLoading } =
    useChartOfAccounts(selectedCompanyId);
  const { data: mappingData, isLoading: mappingLoading } =
    useMappingForAccountByType(selectedCompanyId, reportType);
  const saveMapping = useSaveMappings();

  const selectedCompanyIdToUse = store?.getState()?.user?.selectedCompany?.id;
  const selectedCompanyInfo = companiesData?.find(
    (c: any) => c.id === selectedCompanyIdToUse
  );

  // Compute account type options based on selected report type
  const accountTypeOptions = REPORT_TYPE_COLUMNS[reportType] || [];

  // Memoized function to process accounts for a company
  const processCompanyAccounts = useCallback(
    (companyId: string, companyName: string) => {
      if (!accountsData?.data?.[companyId]?.[reportType]) return [];

      const companyData = accountsData.data[companyId];
      const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
      const allRows: any[] = [];

      for (const typeOpt of typeOptions) {
        if (accountType !== "none" && typeOpt.key !== accountType) continue;

        const rootNode = companyData[reportType][typeOpt.key];
        if (!rootNode) continue;

        const flatRows = flattenAccounts(rootNode);
        const processedRows = flatRows
          .filter((row) => row.name !== rootNode.title)
          .map((row) => {
            let namePath = row.name;
            if (namePath.startsWith(rootNode.title + " > ")) {
              namePath = namePath.slice((rootNode.title + " > ").length);
            }

            const rowId =
              accountType === "none"
                ? `${row.id}-${typeOpt.key}-${companyId}`
                : row.id;

            const eliminate =
              eliminationStates[rowId] !== undefined
                ? eliminationStates[rowId]
                : mappingData?.data?.mapping
                ? findEliminationState(
                    mappingData.data.mapping,
                    row.id,
                    companyId
                  )
                : false;

            return {
              id: rowId,
              name: renderAccountPath(namePath),
              type: typeOpt.label,
              company: companyName,
              companyId: companyId,
              mappedTo: <span className="text-muted-foreground">Unmapped</span>,
              eliminate: eliminate,
              checked: false,
            };
          });

        allRows.push(...processedRows);
      }

      return allRows;
    },
    [accountsData, reportType, accountType, mappingData, selectedCompanyId]
  );

  // Memoized rows computation
  const rows = useMemo(() => {
    if (!accountsData?.data) return [];

    if (accountType === "none") {
      const allRows: any[] = [];
      Object.keys(accountsData.data).forEach((companyId) => {
        const company = companiesData?.find((c: any) => c.id === companyId);
        const companyName = company?.name || "Unknown Company";
        allRows.push(...processCompanyAccounts(companyId, companyName));
      });
      return allRows;
    } else {
      const company = companiesData?.find(
        (c: any) => c.id === selectedCompanyId
      );
      const companyName =
        company?.name || store?.getState()?.user?.selectedCompany?.name || "";
      return processCompanyAccounts(selectedCompanyId, companyName);
    }
  }, [
    accountsData,
    selectedCompanyId,
    accountType,
    companiesData,
    processCompanyAccounts,
    eliminationStates,
  ]);

  // Memoized mapping options
  const mappingOptions = useMemo(() => {
    if (!mappingData?.data?.mapping) return [];

    if (accountType !== "none") {
      return flattenMappingTree(mappingData.data.mapping[accountType] || []);
    } else {
      const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
      let allOptions: { id: string; name: string }[] = [];
      for (const typeOpt of typeOptions) {
        allOptions = allOptions.concat(
          flattenMappingTree(mappingData.data.mapping[typeOpt.key] || [])
        );
      }
      return allOptions;
    }
  }, [mappingData, accountType, reportType]);

  // Apply mappings from API data
  useEffect(() => {
    if (!mappingData?.data?.mapping || rows.length === 0) return;

    const currentMappedSelections = { ...mappedSelections };
    let hasChanges = false;

    rows.forEach((row) => {
      const parts = row.id.split("-");
      const accountId = parts[0];
      const rowCompanyId = (row as any).companyId || selectedCompanyId;

      const mappedToId = findMappedToAccountId(
        mappingData.data.mapping,
        accountId
      );
      if (mappedToId) {
        const mappedAccountInfo = findMappedAccountInfo(
          mappingData.data.mapping,
          accountId
        );

        if (mappedAccountInfo && mappedAccountInfo.realm_id === rowCompanyId) {
          if (!currentMappedSelections[row.id]) {
            currentMappedSelections[row.id] = mappedToId;
            hasChanges = true;
          }
        }
      }
    });

    if (hasChanges) {
      setMappedSelections(currentMappedSelections);
      isInitialLoad.current = true;
      hasUserChanges.current = false;
    }
  }, [mappingData, rows, selectedCompanyId, mappedSelections]);

  // Reset account type when report type changes
  useEffect(() => {
    setAccountType("none");
  }, [reportType]);

  // Handlers
  const handleEliminateChange = useCallback((id: string, value: boolean) => {
    console.log("Eliminate change:", id, value);
    setEliminationStates((prev) => {
      const newState = { ...prev, [id]: value };
      console.log("New elimination states:", newState);
      return newState;
    });
    hasUserChanges.current = true;
  }, []);

  const handleCheckboxChange = useCallback((id: string, value: boolean) => {
    // Checkbox state is not persisted, so we can just update the local state
    // This would need to be handled differently if checkbox state needs to be saved
  }, []);

  const handleMappedToChange = useCallback(
    (rowId: string, mappedId: string) => {
      if (mappedId === "unmapped") {
        setMappedSelections((prev) => {
          const newSelections = { ...prev };
          delete newSelections[rowId];
          return newSelections;
        });
        // Reset elimination state when unmapping
        setEliminationStates((prev) => {
          const newStates = { ...prev };
          delete newStates[rowId];
          return newStates;
        });
      } else {
        setMappedSelections((prev) => ({ ...prev, [rowId]: mappedId }));
      }
      hasUserChanges.current = true;
    },
    []
  );

  // Create payload for save mappings
  const createSavePayload = useCallback(() => {
    const payload: any = {
      realm_id: selectedCompanyId,
      report_type: reportType,
      mapping: mappingData?.data?.mapping
        ? JSON.parse(JSON.stringify(mappingData.data.mapping))
        : {},
    };

    // Remove unmapped accounts
    const allAccountIds = rows.map((row) => row.id.split("-")[0]);
    const mappedAccountIds = Object.keys(mappedSelections).map(
      (rowId) => rowId.split("-")[0]
    );
    const unmappedAccountIds = allAccountIds.filter(
      (accountId) => !mappedAccountIds.includes(accountId)
    );

    const removeAccountFromAllNodes = (nodes: any[], accountId: string) => {
      for (const node of nodes) {
        if (node.mapped_account) {
          node.mapped_account = node.mapped_account.filter(
            (acc: any) => acc.account_id !== accountId
          );
        }
        if (node.children && node.children.length > 0) {
          removeAccountFromAllNodes(node.children, accountId);
        }
      }
    };

    const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
    for (const typeOpt of typeOptions) {
      if (payload.mapping[typeOpt.key]) {
        for (const accountId of unmappedAccountIds) {
          removeAccountFromAllNodes(payload.mapping[typeOpt.key], accountId);
        }
      }
    }

    // Add/update mappings
    for (const [rowId, mappedId] of Object.entries(mappedSelections)) {
      const row = rows.find((r) => r.id === rowId);
      if (!row) continue;

      const typeKey = getTypeKeyFromLabel(row.type);
      if (!typeKey || !payload.mapping[typeKey]) continue;

      const targetNode = findAccountRecursive(
        payload.mapping[typeKey],
        mappedId
      );
      if (!targetNode) continue;

      const companyId = (row as any).companyId || selectedCompanyId;
      const sourceAccount = findAccountRecursive(
        accountsData?.data?.[companyId]?.[reportType]?.[typeKey]
          ? [accountsData.data[companyId][reportType][typeKey]]
          : [],
        rowId.split("-")[0]
      );
      if (!sourceAccount) continue;

      const mappedAccountObject = {
        account_id: sourceAccount.account_id,
        realm_id: companyId,
        title: sourceAccount.title,
        is_eliminated:
          eliminationStates[rowId] !== undefined
            ? eliminationStates[rowId]
            : row.eliminate || false,
      };

      const existingIndex = targetNode.mapped_account.findIndex(
        (existing: any) => existing.account_id === sourceAccount.account_id
      );

      if (existingIndex !== -1) {
        targetNode.mapped_account[existingIndex] = mappedAccountObject;
      } else {
        targetNode.mapped_account.push(mappedAccountObject);
      }
    }

    return payload;
  }, [
    selectedCompanyId,
    reportType,
    mappingData,
    rows,
    mappedSelections,
    accountsData,
  ]);

  // Auto-save whenever payload changes (but not on initial load)
  useEffect(() => {
    // Skip if initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      prevMappedSelections.current = { ...mappedSelections };
      prevEliminationStates.current = { ...eliminationStates };
      return;
    }

    // Skip if no user changes
    if (!hasUserChanges.current) {
      return;
    }

    // Check if there are actual changes
    const mappedSelectionsChanged =
      JSON.stringify(mappedSelections) !==
      JSON.stringify(prevMappedSelections.current);
    const eliminationStatesChanged =
      JSON.stringify(eliminationStates) !==
      JSON.stringify(prevEliminationStates.current);

    if (!mappedSelectionsChanged && !eliminationStatesChanged) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save to prevent rapid API calls
    saveTimeoutRef.current = setTimeout(() => {
      if (
        Object.keys(mappedSelections).length > 0 ||
        Object.keys(eliminationStates).length > 0
      ) {
        setIsAutoSaving(true);
        onAutoSaveStateChange?.(true);

        const payload = createSavePayload();
        saveMapping.mutate(payload, {
          onSuccess: () => {
            console.log("Link accounts auto-saved successfully");
            // Update previous values after successful save
            prevMappedSelections.current = { ...mappedSelections };
            prevEliminationStates.current = { ...eliminationStates };
            hasUserChanges.current = false;
            setIsAutoSaving(false);
            onAutoSaveStateChange?.(false);
          },
          onError: (error) => {
            console.error("Error auto-saving link accounts:", error);
            setIsAutoSaving(false);
            onAutoSaveStateChange?.(false);
          },
        });
      }
    }, 500); // 500ms debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [mappedSelections, eliminationStates, onAutoSaveStateChange]);

  // Handlers without silent save
  const handleReportTypeChange = useCallback((newReportType: string) => {
    setReportType(newReportType);
  }, []);

  const handleAccountTypeChange = useCallback((newAccountType: string) => {
    setAccountType(newAccountType);
  }, []);

  const handleCompanyChange = useCallback((newCompany: string) => {
    setCompany(newCompany);
  }, []);

  const handleSaveAndNext = useCallback(async () => {
    try {
      const payload = createSavePayload();
      await saveMapping.mutateAsync(payload);
      onNext();
      return true;
    } catch (error) {
      return false;
    }
  }, [createSavePayload, saveMapping, onNext]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (showOnlyUnmapped && mappedSelections[row.id]) return false;

      if (company && company !== "all" && selectedCompanyInfo?.isMultiEntity) {
        const rowCompanyId = (row as any).companyId;
        if (rowCompanyId !== company) return false;
      }

      if (searchName) {
        const rowName = typeof row.name === "string" ? row.name : "";
        if (!rowName.toLowerCase().includes(searchName.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [
    rows,
    showOnlyUnmapped,
    mappedSelections,
    company,
    selectedCompanyInfo,
    searchName,
  ]);

  // Unique companies for dropdown
  const uniqueCompanies = useMemo(() => {
    const companies = new Map();
    rows.forEach((row) => {
      const companyId = (row as any).companyId;
      const companyName = row.company;
      if (companyId && companyName) {
        companies.set(companyId, companyName);
      }
    });
    return Array.from(companies.entries());
  }, [rows]);

  return (
    <>
      <div className="px-10 pt-8 bg-white shrink-0">
        <div className="flex-wrap bg-white border border-gray-200 rounded-2xl p-4 flex gap-8 items-end w-full minw-full mx-auto">
          {(() => {
            const filters = [
              {
                label: "REPORT TYPE",
                type: "select" as const,
                value: reportType,
                onChange: handleReportTypeChange,
                options: REPORT_TYPES.map((rt) => ({
                  value: rt.value,
                  label: rt.label,
                })),
                placeholder: "Select report type",
              },
              ...(selectedCompanyInfo?.isMultiEntity
                ? [
                    {
                      label: "CONNECTED COMPANY",
                      type: "select" as const,
                      value: company,
                      onChange: handleCompanyChange,
                      options: [
                        { value: "all", label: "All Companies" },
                        ...uniqueCompanies.map(([companyId, companyName]) => ({
                          value: companyId,
                          label: companyName,
                        })),
                      ],
                      placeholder: "Filter by company",
                    },
                  ]
                : []),
              {
                label: "SEARCH NAME",
                type: "input" as const,
                value: searchName,
                onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchName(e.target.value),
                placeholder: "Filter by account name",
              },
              {
                label: "ACCOUNT TYPE",
                type: "select" as const,
                value: accountType,
                onChange: handleAccountTypeChange,
                options: [
                  { value: "none", label: "Not Selected" },
                  ...accountTypeOptions.map((opt) => ({
                    value: opt.key,
                    label: opt.label,
                  })),
                ],
                placeholder: "Select account type",
              },
            ];

            return filters.map((filter, index) => (
              <div key={index} className="flex flex-col min-w-56">
                <Label className="text-xs font-medium text-[#767A8B] mb-2 tracking-wide">
                  {filter.label}
                </Label>
                {filter.type === "select" ? (
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger className="text-sm min-w-full bg-white">
                      <SelectValue placeholder={filter.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    placeholder={filter.placeholder}
                    className="text-sm text-gray-700 placeholder-gray-400 bg-white"
                    value={filter.value}
                    onChange={filter.onChange}
                  />
                )}
              </div>
            ));
          })()}
        </div>
      </div>

      <div className="px-10 bg-white pt-4 pb-2">
        <div className="flex-1 pb-4 pt-3 justify-between w-full items-center">
          <div className="flex items-center text-sm text-sec font-medium justify-end gap-2">
            SHOW ONLY UNMAPPED
            <Switch
              className="data-[state=unchecked]:bg-[#e5e7eb] data-[state=checked]:bg-[#007aff] h-5 w-9"
              checked={showOnlyUnmapped}
              onCheckedChange={setShowOnlyUnmapped}
            />
          </div>
        </div>

        <div className="w-full border rounded-2xl bg-white overflow-hidden">
          {/* Fixed Header */}
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-12" />
              <col className="w-80" />
              <col className="w-32" />
              <col className="w-40" />
              <col className="w-48" />
              <col className="w-32" />
            </colgroup>
            <thead className="">
              <tr className="bg-white h-14">
                {[
                  {
                    label: "",
                    className: "px-4 py-3 border-b border-[#EFF1F5]",
                    content: (
                      <div className="w-4 h-4 border border-[#d1d5db] rounded-sm bg-white"></div>
                    ),
                  },
                  {
                    label: "Account Name",
                    className:
                      "text-left border-l px-4 py-3 border-b border-r border-[#EFF1F5] font-normal text-sec text-sm",
                    showSort: true,
                  },
                  {
                    label: "Type",
                    className:
                      "text-left px-4 py-3 border-b border-r border-[#EFF1F5] font-normal text-sec text-sm",
                    showSort: true,
                  },
                  {
                    label: "Company",
                    className:
                      "text-left px-4 py-3 border-b border-r border-[#EFF1F5] font-normal text-sec text-sm",
                    showSort: true,
                  },
                  {
                    label: "Mapped To",
                    className:
                      "text-left px-4 py-3 border-b border-[#EFF1F5] border-l border-r font-normal text-sec text-sm",
                    showSort: true,
                  },
                  {
                    label: "Eliminate",
                    className:
                      "text-center px-4 py-3 border-b border-[#EFF1F5] font-normal text-sec text-sm",
                    showSort: false,
                  },
                ].map((column, index) => (
                  <th key={index} className={column.className}>
                    {column.content || (
                      <div
                        className={`flex items-center ${
                          column.showSort ? "justify-between" : "justify-center"
                        } gap-2`}
                      >
                        {column.label}
                        {column.showSort && (
                          <div className="flex flex-col">
                            <ChevronUp className="w-3 h-3 text-sec -mb-1" />
                            <ChevronDown className="w-3 h-3 text-sec" />
                          </div>
                        )}
                      </div>
                    )}
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
                  <p className="text-sm text-gray-500">Loading accounts...</p>
                </div>
              </div>
            ) : (
              <table className="w-full select-none border-collapse table-fixed">
                <colgroup>
                  <col className="w-12" />
                  <col className="w-80" />
                  <col className="w-32" />
                  <col className="w-40" />
                  <col className="w-48" />
                  <col className="w-32" />
                </colgroup>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">
                            {showOnlyUnmapped
                              ? "No unmapped accounts found"
                              : "No accounts found"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {showOnlyUnmapped
                              ? "All accounts have been mapped"
                              : "Try adjusting your filters"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, index) => {
                      const isLastRow = index === filteredRows.length - 1;
                      const typeKey = getTypeKeyFromLabel(row.type);
                      const rowMappingOptions =
                        mappingData?.data?.mapping && typeKey
                          ? flattenMappingTree(
                              mappingData.data.mapping[typeKey] || []
                            )
                          : [];
                      const selectedValue = mappedSelections[row.id];
                      const selectedOption = rowMappingOptions.find(
                        (opt) => opt.id === selectedValue
                      );
                      const displayText = selectedOption
                        ? selectedOption.name
                        : "Unmapped";
                      const isMapped = !!selectedValue;

                      const cells = [
                        {
                          content: (
                            <Checkbox
                              checked={row.checked}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(row.id, checked as boolean)
                              }
                              className="w-4 h-4 data-[state=checked]:bg-white data-[state=checked]:text-[#007aff] data-[state=checked]:border-[#007aff]"
                            />
                          ),
                          className: "px-4 py-4",
                        },
                        {
                          content: row.name,
                          className: "px-4 py-4 text-sm border-l",
                        },
                        {
                          content: row.type,
                          className: "px-4 py-4 text-sm text-sec font-light",
                        },
                        {
                          content: row.company,
                          className: "px-4 py-4 text-sm text-sec font-light",
                        },
                        {
                          content: (
                            <div className="max-w-full overflow-hidden">
                              <Select
                                value={selectedValue || ""}
                                onValueChange={(val) =>
                                  handleMappedToChange(row.id, val)
                                }
                              >
                                <SelectTrigger className="text-sm bg-transparent focus:ring-0 focus:ring-offset-0 focus:outline-none border-none shadow-none p-0 h-auto w-full flex items-center [&>svg:not(.custom-chevron)]:hidden">
                                  <span
                                    className={`truncate block flex-1 text-left ${
                                      isMapped ? "text-[#007AFF]" : "text-sec"
                                    }`}
                                    title={displayText}
                                  >
                                    {displayText.length > 20
                                      ? `${displayText.substring(0, 20)}...`
                                      : displayText}
                                  </span>
                                  <ChevronDown className="w-4 h-4 text-sec ml-2 flex-shrink-0 custom-chevron" />
                                </SelectTrigger>
                                <SelectContent
                                  style={{
                                    maxHeight: 300,
                                    overflowY: "auto",
                                  }}
                                >
                                  <SelectItem key="unmapped" value="unmapped">
                                    <span className="text-sec">Unmapped</span>
                                  </SelectItem>
                                  {rowMappingOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.id}>
                                      {renderAccountPath(opt.name)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ),
                          className:
                            "px-4 py-4 border-l border-r border-[#EFF1F5] text-sm",
                        },
                        {
                          content: (
                            <Switch
                              checked={
                                eliminationStates[row.id] !== undefined
                                  ? eliminationStates[row.id]
                                  : row.eliminate
                              }
                              onCheckedChange={(checked) => {
                                console.log("Switch clicked:", row.id, checked);
                                handleEliminateChange(row.id, checked);
                              }}
                              disabled={!mappedSelections[row.id]}
                              className="data-[state=unchecked]:bg-[#e5e7eb] data-[state=checked]:bg-[#007aff] h-5 w-9 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                !mappedSelections[row.id]
                                  ? "Map an account first to enable elimination"
                                  : ""
                              }
                            />
                          ),
                          className: "px-4 py-4 text-sm text-center",
                        },
                      ];

                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-[#fafbfc] ${
                            !isLastRow ? "border-b" : ""
                          }`}
                        >
                          {cells.map((cell, cellIndex) => (
                            <td key={cellIndex} className={cell.className}>
                              {cell.content}
                            </td>
                          ))}
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
