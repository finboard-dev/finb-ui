"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
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
import { ChevronUp, ChevronDown, SearchIcon, ListFilter } from "lucide-react";
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
  accountId: string,
  companyId: string
): string | null {
  for (const typeKey of Object.keys(mappingTree)) {
    const stack = [...mappingTree[typeKey]];
    while (stack.length) {
      const node = stack.pop();
      if (node.mapped_account && node.mapped_account.length > 0) {
        for (const mapped of node.mapped_account) {
          if (
            mapped.account_id === accountId &&
            mapped.realm_id === companyId
          ) {
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
  accountId: string,
  companyId: string
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
          if (
            mapped.account_id === accountId &&
            mapped.realm_id === companyId
          ) {
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
  companyId?: string,
  reportType?: string
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

  // Only search in the current report type's account types
  const currentReportTypeOptions =
    REPORT_TYPE_COLUMNS[reportType || "ProfitAndLoss"] || [];
  for (const typeOpt of currentReportTypeOptions) {
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

// Helper to get the last child name from a nested path
function getLastChildName(path: string): string {
  if (!path || typeof path !== "string") return "";
  const segments = path.split(" > ");
  return segments[segments.length - 1] || path;
}

export const LinkAccounts = forwardRef(function LinkAccounts(
  { onNext, selectedCompanyId }: LinkAccountsProps,
  ref
) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [mappedSelections, setMappedSelections] = useState<{
    [rowId: string]: string;
  }>({});
  const [eliminationStates, setEliminationStates] = useState<{
    [rowId: string]: boolean;
  }>({});
  const [showOnlyUnmapped, setShowOnlyUnmapped] = useState(false);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [companyFilterOpen, setCompanyFilterOpen] = useState(false);
  const [selectedCompanyFilter, setSelectedCompanyFilter] =
    useState<string>("all");
  const [nameFilterValue, setNameFilterValue] = useState<string>("");
  const typeFilterRef = useRef<HTMLDivElement>(null);
  const companyFilterRef = useRef<HTMLDivElement>(null);

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

  // Memoized function to process accounts for a company
  const processCompanyAccounts = useCallback(
    (companyId: string, companyName: string) => {
      if (!accountsData?.data?.[companyId]?.[reportType]) return [];

      const companyData = accountsData.data[companyId];
      const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
      const allRows: any[] = [];

      for (const typeOpt of typeOptions) {
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

            const rowId = `${row.id}-${typeOpt.key}-${companyId}`;

            const eliminate =
              eliminationStates[rowId] !== undefined
                ? eliminationStates[rowId]
                : mappingData?.data?.mapping
                ? findEliminationState(
                    mappingData.data.mapping,
                    row.id,
                    companyId,
                    reportType
                  )
                : false;

            return {
              id: rowId,
              name: renderAccountPath(namePath),
              originalName: namePath, // Store the original string name for filtering
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
    [accountsData, reportType, mappingData, selectedCompanyId]
  );

  // Memoized rows computation
  const rows = useMemo(() => {
    if (!accountsData?.data) return [];

    const allRows: any[] = [];
    Object.keys(accountsData.data).forEach((companyId) => {
      const company = companiesData?.find((c: any) => c.id === companyId);
      const companyName = company?.name || "Unknown Company";
      allRows.push(...processCompanyAccounts(companyId, companyName));
    });
    return allRows;
  }, [
    accountsData,
    selectedCompanyId,
    companiesData,
    processCompanyAccounts,
    eliminationStates,
  ]);

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
        accountId,
        rowCompanyId
      );
      if (mappedToId) {
        const mappedAccountInfo = findMappedAccountInfo(
          mappingData.data.mapping,
          accountId,
          rowCompanyId
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
    }
  }, [mappingData, rows, selectedCompanyId, mappedSelections]);

  // Close type filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        typeFilterRef.current &&
        !typeFilterRef.current.contains(event.target as Node)
      ) {
        setTypeFilterOpen(false);
      }
      if (
        companyFilterRef.current &&
        !companyFilterRef.current.contains(event.target as Node)
      ) {
        setCompanyFilterOpen(false);
      }
    };

    if (typeFilterOpen || companyFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [typeFilterOpen, companyFilterOpen]);

  // Handlers
  const handleEliminateChange = useCallback((id: string, value: boolean) => {
    setEliminationStates((prev) => {
      const newState = { ...prev, [id]: value };
      return newState;
    });
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
          // Also explicitly set eliminate to false for this row
          newStates[rowId] = false;
          return newStates;
        });
      } else {
        setMappedSelections((prev) => ({ ...prev, [rowId]: mappedId }));
      }
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

  // Handlers without silent save
  const handleReportTypeChange = useCallback((newReportType: string) => {
    setReportType(newReportType);
  }, []);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (showOnlyUnmapped && mappedSelections[row.id]) return false;

      if (selectedCompanyFilter !== "all") {
        const rowCompanyId = (row as any).companyId;
        if (rowCompanyId !== selectedCompanyFilter) return false;
      }

      if (nameFilterValue) {
        // For nested names, search in the last child name
        const originalName = (row as any).originalName || "";
        const lastChildName = getLastChildName(originalName);
        if (
          !lastChildName.toLowerCase().includes(nameFilterValue.toLowerCase())
        ) {
          return false;
        }
      }

      if (selectedTypeFilter !== "all" && row.type !== selectedTypeFilter) {
        return false;
      }

      return true;
    });
  }, [
    rows,
    showOnlyUnmapped,
    mappedSelections,
    selectedTypeFilter,
    selectedCompanyFilter,
    nameFilterValue,
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

  // Unique types for dropdown
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    rows.forEach((row) => {
      if (row.type) {
        types.add(row.type);
      }
    });
    return Array.from(types).sort();
  }, [rows]);

  useImperativeHandle(ref, () => ({
    async handleSave() {
      const payload = createSavePayload();
      return saveMapping.mutateAsync(payload);
    },
  }));

  return (
    <>
      <div className="px-10 pt-8 bg-white shrink-0">
        <div className="flex-wrap bg-white border border-gray-200 rounded-2xl p-4 flex gap-8 items-end w-full minw-full mx-auto">
          {(() => {
            const filters = [
              {
                label: "REPORT TYPE",
                value: reportType,
                onChange: handleReportTypeChange,
                options: REPORT_TYPES.map((rt) => ({
                  value: rt.value,
                  label: rt.label,
                })),
                placeholder: "Select report type",
              },
            ];

            return filters.map((filter, index) => (
              <div key={index} className="flex flex-col min-w-56">
                <Label className="text-xs font-medium text-[#767A8B] mb-2 tracking-wide">
                  {filter.label}
                </Label>
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
                    label: "Search by Name",
                    className:
                      "text-left border-l px-4 py-3 border-b border-r border-[#EFF1F5] font-normal text-sec text-sm relative",
                    showSort: true,
                    icon: <SearchIcon className="w-4 h-4 text-sec" />,
                    content: (
                      <div className="flex items-center gap-2 w-full">
                        <Input
                          type="text"
                          placeholder="Search by name..."
                          value={nameFilterValue}
                          onChange={(e) => setNameFilterValue(e.target.value)}
                          className="text-sm h-8 bg-transparent border-none shadow-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-none p-0 flex-1 focus:bg-transparent focus:shadow-none"
                        />
                        <SearchIcon className="w-4 h-4 text-sec flex-shrink-0" />
                        {nameFilterValue && (
                          <button
                            onClick={() => setNameFilterValue("")}
                            className="text-gray-400 hover:text-gray-600 text-sm"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ),
                  },
                  {
                    label: "Type",
                    className:
                      "text-left px-4 py-3 border-b border-r border-[#EFF1F5] font-normal text-sec text-sm relative cursor-pointer",
                    showSort: true,
                    icon: <ChevronDown className="w-4 h-4 text-sec" />,
                    content: (
                      <div
                        className="flex items-center justify-between gap-2 w-full"
                        onClick={() => setTypeFilterOpen(!typeFilterOpen)}
                        ref={typeFilterRef}
                      >
                        <span>Type</span>
                        <div className="flex items-center gap-1">
                          <ListFilter
                            className={`w-4 h-4 ${
                              selectedTypeFilter !== "all"
                                ? "text-blue-600"
                                : "text-sec"
                            }`}
                          />
                        </div>
                        {typeFilterOpen && typeFilterRef.current && (
                          <div
                            className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-[9999] min-w-48 py-1"
                            style={{
                              top:
                                typeFilterRef.current.getBoundingClientRect()
                                  .bottom + 4,
                              left:
                                typeFilterRef.current.getBoundingClientRect()
                                  .left +
                                typeFilterRef.current.getBoundingClientRect()
                                  .width /
                                  2 -
                                96, // Center the dropdown (96px = min-w-48 / 2)
                            }}
                          >
                            <div
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setSelectedTypeFilter("all");
                                setTypeFilterOpen(false);
                              }}
                            >
                              All Types
                            </div>
                            {uniqueTypes.map((type) => (
                              <div
                                key={type}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => {
                                  setSelectedTypeFilter(type);
                                  setTypeFilterOpen(false);
                                }}
                              >
                                {type}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    label: "Company",
                    className:
                      "text-left px-4 py-3 border-b border-r border-[#EFF1F5] font-normal text-sec text-sm relative cursor-pointer",
                    showSort: true,
                    icon: <ChevronDown className="w-4 h-4 text-sec" />,
                    content: (
                      <div
                        className="flex items-center justify-between gap-2 w-full"
                        onClick={() => setCompanyFilterOpen(!companyFilterOpen)}
                        ref={companyFilterRef}
                      >
                        <span>Company</span>
                        <div className="flex items-center gap-1">
                          <ListFilter
                            className={`w-4 h-4 ${
                              selectedCompanyFilter !== "all"
                                ? "text-blue-600"
                                : "text-sec"
                            }`}
                          />
                        </div>
                        {companyFilterOpen && companyFilterRef.current && (
                          <div
                            className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-[9999] min-w-48 py-1"
                            style={{
                              top:
                                companyFilterRef.current.getBoundingClientRect()
                                  .bottom + 4,
                              left:
                                companyFilterRef.current.getBoundingClientRect()
                                  .left +
                                companyFilterRef.current.getBoundingClientRect()
                                  .width /
                                  2 -
                                96, // Center the dropdown (96px = min-w-48 / 2)
                            }}
                          >
                            <div
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                setSelectedCompanyFilter("all");
                                setCompanyFilterOpen(false);
                              }}
                            >
                              All Companies
                            </div>
                            {uniqueCompanies.map(([companyId, companyName]) => (
                              <div
                                key={companyId}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => {
                                  setSelectedCompanyFilter(companyId);
                                  setCompanyFilterOpen(false);
                                }}
                              >
                                {companyName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    label: "Mapped To",
                    className:
                      "text-left px-4 py-3 border-b border-[#EFF1F5] border-l border-r font-normal text-sec text-sm",
                    showSort: true,
                    icon: (
                      <div className="flex flex-col">
                        <ChevronUp className="w-3 h-3 text-sec -mb-1" />
                        <ChevronDown className="w-3 h-3 text-sec" />
                      </div>
                    ),
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
                        {column.icon && column.icon}
                        {/* {column.showSort && (
                          <div className="flex flex-col">
                            <ChevronUp className="w-3 h-3 text-sec -mb-1" />
                            <ChevronDown className="w-3 h-3 text-sec" />
                          </div>
                        )} */}
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
});
