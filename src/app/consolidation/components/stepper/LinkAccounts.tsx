"use client";
import React, { useState, useEffect } from "react";
import { ConsolidationFooter } from "../ConsolidationFooter";
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
  ReportTypes,
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
  onBack: () => void;
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

// Utility: Recursively find an account node by account_id in the accounts tree (from useChartOfAccounts)
function findSourceAccount(
  accountsData: any,
  selectedCompanyId: string,
  reportType: string,
  accountId: string
): any | null {
  if (!accountsData?.data?.[selectedCompanyId]?.[reportType]) return null;
  const typeOptions = Object.keys(
    accountsData.data[selectedCompanyId][reportType]
  );
  for (const typeKey of typeOptions) {
    const rootNode = accountsData.data[selectedCompanyId][reportType][typeKey];
    if (rootNode) {
      const found = findAccountRecursive([rootNode], accountId);
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
            return node.account_id; // This node is the mapped-to account
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

export function LinkAccounts({
  onNext,
  onBack,
  selectedCompanyId,
}: LinkAccountsProps) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [company, setCompany] = useState("");
  const [searchName, setSearchName] = useState("");
  const [accountType, setAccountType] = useState("none"); // Default to 'none'
  const companiesData = store?.getState()?.user?.companies;
  const { data: accountsData, isLoading: accountsLoading } =
    useChartOfAccounts(selectedCompanyId);
  const { data: mappingData, isLoading: mappingLoading } =
    useMappingForAccountByType(selectedCompanyId, reportType);
  const saveMapping = useSaveMappings();
  const [rows, setRows] = useState<any[]>([]);
  const selectedCompany = store?.getState()?.user?.selectedCompany;

  // Compute account type options based on selected report type
  const accountTypeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
  // Find the label for the current accountType
  const accountTypeLabel =
    accountTypeOptions.find((opt) => opt.key === accountType)?.label ||
    accountType;

  // When reportType changes, update accountType to 'none'
  useEffect(() => {
    setAccountType("none");
  }, [reportType]);

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

  // Helper to flatten mapping tree (same as flattenAccounts, but for mapping structure)
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

  // Compute mapping options for the dropdown
  let mappingOptions: { id: string; name: string }[] = [];
  if (
    mappingData &&
    mappingData.data &&
    mappingData.data.mapping &&
    ((accountType !== "none" && mappingData.data.mapping[accountType]) ||
      accountType === "none")
  ) {
    if (accountType !== "none") {
      mappingOptions = flattenMappingTree(
        mappingData.data.mapping[accountType] || []
      );
    } else {
      // All account types
      const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
      for (const typeOpt of typeOptions) {
        mappingOptions = mappingOptions.concat(
          flattenMappingTree(mappingData.data.mapping[typeOpt.key] || [])
        );
      }
    }
  }

  useEffect(() => {
    if (
      accountType !== "none" &&
      accountsData &&
      accountsData.data &&
      selectedCompanyId &&
      accountsData.data[selectedCompanyId] &&
      accountsData.data[selectedCompanyId][reportType] &&
      accountsData.data[selectedCompanyId][reportType][accountType]
    ) {
      const rootNode =
        accountsData.data[selectedCompanyId][reportType][accountType];
      const flatRows = flattenAccounts(rootNode);
      setRows(
        flatRows
          .filter((row) => row.name !== rootNode.title) // skip the root node itself
          .map((row) => {
            let namePath = row.name;
            if (namePath.startsWith(rootNode.title + " > ")) {
              namePath = namePath.slice((rootNode.title + " > ").length);
            }
            return {
              id: row.id,
              name: renderAccountPath(namePath),
              type: accountTypeLabel, // Use label instead of key
              company: store?.getState()?.user?.selectedCompany?.name || "",
              mappedTo: <span className="text-muted-foreground">Unmapped</span>,
              eliminate: false,
              checked: false,
            };
          })
      );
    } else if (
      accountType === "none" &&
      accountsData &&
      accountsData.data &&
      selectedCompanyId &&
      accountsData.data[selectedCompanyId] &&
      accountsData.data[selectedCompanyId][reportType]
    ) {
      // Show all accounts for all account types
      const allRows: any[] = [];
      const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
      for (const typeOpt of typeOptions) {
        const rootNode =
          accountsData.data[selectedCompanyId][reportType][typeOpt.key];
        if (!rootNode) continue;
        const flatRows = flattenAccounts(rootNode);
        allRows.push(
          ...flatRows
            .filter((row) => row.name !== rootNode.title)
            .map((row) => {
              let namePath = row.name;
              if (namePath.startsWith(rootNode.title + " > ")) {
                namePath = namePath.slice((rootNode.title + " > ").length);
              }
              return {
                id: row.id + "-" + typeOpt.key,
                name: renderAccountPath(namePath),
                type: typeOpt.label,
                company: store?.getState()?.user?.selectedCompany?.name || "",
                mappedTo: (
                  <span className="text-muted-foreground">Unmapped</span>
                ),
                eliminate: false,
                checked: false,
              };
            })
        );
      }
      setRows(allRows);
    } else if (accountType === "none") {
      setRows([]);
    }

    // Pre-populate mappedSelections with previously linked accounts and elimination states
    if (mappingData?.data?.mapping) {
      const initialMappedSelections: { [rowId: string]: string } = {};
      // Use the latest rows (after setRows) for mapping
      let currentRows = [];
      if (
        accountType !== "none" &&
        accountsData &&
        accountsData.data &&
        selectedCompanyId &&
        accountsData.data[selectedCompanyId] &&
        accountsData.data[selectedCompanyId][reportType] &&
        accountsData.data[selectedCompanyId][reportType][accountType]
      ) {
        const rootNode =
          accountsData.data[selectedCompanyId][reportType][accountType];
        currentRows = flattenAccounts(rootNode)
          .filter((row) => row.name !== rootNode.title)
          .map((row) => ({ id: row.id }));
      } else if (
        accountType === "none" &&
        accountsData &&
        accountsData.data &&
        selectedCompanyId &&
        accountsData.data[selectedCompanyId] &&
        accountsData.data[selectedCompanyId][reportType]
      ) {
        const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
        for (const typeOpt of typeOptions) {
          const rootNode =
            accountsData.data[selectedCompanyId][reportType][typeOpt.key];
          if (!rootNode) continue;
          const flatRows = flattenAccounts(rootNode);
          currentRows.push(
            ...flatRows
              .filter((row) => row.name !== rootNode.title)
              .map((row) => ({ id: row.id + "-" + typeOpt.key }))
          );
        }
      }

      currentRows.forEach((row) => {
        const accountId = row.id.split("-")[0];
        const mappedToId = findMappedToAccountId(
          mappingData.data.mapping,
          accountId
        );
        if (mappedToId) {
          initialMappedSelections[row.id] = mappedToId;

          // Find the elimination state for this account
          const eliminationState = findEliminationState(
            mappingData.data.mapping,
            accountId
          );

          // Update the row's elimination state
          setRows((prevRows) =>
            prevRows.map((prevRow) =>
              prevRow.id === row.id
                ? { ...prevRow, eliminate: eliminationState }
                : prevRow
            )
          );
        }
      });
      setMappedSelections(initialMappedSelections);
    }
  }, [accountsData, selectedCompanyId, reportType, accountType, mappingData]);

  // Handler for eliminate switch
  const handleEliminateChange = (id: string, value: boolean) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, eliminate: value } : row))
    );
  };

  // Handler for checkbox
  const handleCheckboxChange = (id: string, value: boolean) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, checked: value } : row))
    );
  };
  const [mappedSelections, setMappedSelections] = useState<{
    [rowId: string]: string;
  }>({});

  // Handler for mapped to change
  const handleMappedToChange = (rowId: string, mappedId: string) => {
    if (mappedId === "unmapped") {
      // Remove the mapping when "Unmapped" is selected
      setMappedSelections((prev) => {
        const newSelections = { ...prev };
        delete newSelections[rowId];
        return newSelections;
      });
      // Reset elimination state when unmapping
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowId ? { ...row, eliminate: false } : row
        )
      );
    } else {
      setMappedSelections((prev) => ({ ...prev, [rowId]: mappedId }));
    }
  };

  // Handler for report type change with silent save
  const handleReportTypeChange = async (newReportType: string) => {
    // Save current mapping silently before changing report type
    const payload = createSavePayload();
    try {
      await saveMapping.mutateAsync(payload);
      console.log("Mapping saved silently before report type change");
    } catch (error) {
      console.error("Error saving mapping before report type change:", error);
    }

    // Change report type
    setReportType(newReportType);
  };

  // Handler for account type change with silent save
  const handleAccountTypeChange = async (newAccountType: string) => {
    // Save current mapping silently before changing account type
    const payload = createSavePayload();
    try {
      await saveMapping.mutateAsync(payload);
      console.log("Mapping saved silently before account type change");
    } catch (error) {
      console.error("Error saving mapping before account type change:", error);
    }

    // Change account type
    setAccountType(newAccountType);
  };

  // Helper to find account object by ID in the accounts data
  const findAccountById = (accountId: string): any => {
    if (!accountsData?.data?.[selectedCompanyId]?.[reportType]) return null;

    const searchInType = (typeKey: string, node: ChartOfAccountNode): any => {
      if (node.account_id === accountId) {
        return {
          mapped_account: [],
          account_id: node.account_id,
          children: [],
          title: node.title,
        };
      }

      for (const child of node.children || []) {
        const found = searchInType(typeKey, child);
        if (found) return found;
      }
      return null;
    };

    // Search in all account types
    const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
    for (const typeOpt of typeOptions) {
      const rootNode =
        accountsData.data[selectedCompanyId][reportType][typeOpt.key];
      if (rootNode) {
        const found = searchInType(typeOpt.key, rootNode);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to find mapping account object by ID in the mapping data
  const findMappingAccountById = (mappingId: string): any => {
    if (!mappingData?.data?.mapping) return null;

    const searchInMapping = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node.account_id === mappingId) {
          return {
            mapped_account: [],
            account_id: node.account_id,
            children: [],
            title: node.title,
          };
        }

        if (node.children && node.children.length > 0) {
          const found = searchInMapping(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    // Search in all account types
    const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
    for (const typeOpt of typeOptions) {
      const nodes = mappingData.data.mapping[typeOpt.key] || [];
      const found = searchInMapping(nodes);
      if (found) return found;
    }
    return null;
  };

  // Helper to find elimination state for a specific account ID
  const findEliminationState = (mapping: any, accountId: string): boolean => {
    const searchInNodes = (nodes: any[]): boolean | null => {
      for (const node of nodes) {
        // Check if this node has the account mapped
        const mappedAccount = node.mapped_account?.find(
          (acc: any) => acc.account_id === accountId
        );
        if (mappedAccount) {
          return mappedAccount.is_eliminated || false;
        }

        // Search in children
        if (node.children && node.children.length > 0) {
          const found = searchInNodes(node.children);
          if (found !== null) return found;
        }
      }
      return null;
    };

    // Search in all account types
    const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
    for (const typeOpt of typeOptions) {
      const nodes = mapping[typeOpt.key] || [];
      const found = searchInNodes(nodes);
      if (found !== null) return found;
    }
    return false; // Default to false if not found
  };

  // Create payload for save mappings
  const createSavePayload = () => {
    // Deep copy of the mapping tree
    const payload: any = {
      realm_id: selectedCompanyId,
      report_type: reportType,
      mapping: mappingData?.data?.mapping
        ? JSON.parse(JSON.stringify(mappingData.data.mapping))
        : {},
    };

    // First, remove all accounts that are no longer mapped (were unmapped)
    const allAccountIds = rows.map((row) => row.id.split("-")[0]);
    const mappedAccountIds = Object.keys(mappedSelections).map(
      (rowId) => rowId.split("-")[0]
    );
    const unmappedAccountIds = allAccountIds.filter(
      (accountId) => !mappedAccountIds.includes(accountId)
    );

    // Remove unmapped accounts from all mapping nodes
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

    // Remove unmapped accounts from all account types
    const typeOptions = REPORT_TYPE_COLUMNS[reportType] || [];
    for (const typeOpt of typeOptions) {
      if (payload.mapping[typeOpt.key]) {
        for (const accountId of unmappedAccountIds) {
          removeAccountFromAllNodes(payload.mapping[typeOpt.key], accountId);
        }
      }
    }

    // For each mapping selection
    for (const [rowId, mappedId] of Object.entries(mappedSelections)) {
      // rowId is like "6-income" or just "6"
      // mappedId is the account_id of the target node in the mapping tree

      // Find the typeKey from the row (if you store it, otherwise parse from rowId or rows)
      const row = rows.find((r) => r.id === rowId);
      if (!row) continue;
      const typeKey = getTypeKeyFromLabel(row.type);
      if (!typeKey || !payload.mapping[typeKey]) continue;

      // Find the target node in the mapping tree (deep copy)
      const targetNode = findAccountRecursive(
        payload.mapping[typeKey],
        mappedId
      );
      if (!targetNode) continue;

      // Find the full source account object from the accounts tree
      const sourceAccount = findSourceAccount(
        accountsData,
        selectedCompanyId,
        reportType,
        rowId.split("-")[0]
      );
      if (!sourceAccount) continue;

      // Use realmId from the constant (line 31)
      const realmId = selectedCompanyId;

      // Build the mapped account object as required by backend
      const mappedAccountObject = {
        account_id: sourceAccount.account_id,
        realm_id: realmId,
        title: sourceAccount.title,
        is_eliminated: row.eliminate || false,
      };

      // Check if this account is already mapped to avoid duplicates
      const existingIndex = targetNode.mapped_account.findIndex(
        (existing: any) => existing.account_id === sourceAccount.account_id
      );

      if (existingIndex !== -1) {
        // Update existing mapping with new elimination state
        targetNode.mapped_account[existingIndex] = mappedAccountObject;
      } else {
        // Add new mapping
        targetNode.mapped_account.push(mappedAccountObject);
      }
    }

    console.log("Final payload:", payload);
    return payload;
  };

  const handleSaveAndNext = async () => {
    try {
      const payload = createSavePayload();
      await saveMapping.mutateAsync(payload);
      onNext();
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <>
      <div className="px-10 pt-8 bg-white shrink-0">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-8 items-end w-full minw-full mx-auto">
          <div className="flex flex-col min-w-56">
            <Label
              className="text-xs font-medium text-[#767A8B] mb-2 tracking-wide"
              htmlFor="report-type"
            >
              REPORT TYPE
            </Label>
            <Select value={reportType} onValueChange={handleReportTypeChange}>
              <SelectTrigger className="text-sm min-w-56 bg-white">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCompany?.isMultiEntity && (
            <div className="flex flex-col min-w-[220px]">
              <Label
                className="text-xs font-medium text-[#767A8B] mb-2 tracking-wide"
                htmlFor="connected-company"
              >
                CONNECTED COMPANY
              </Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger className="text-sm bg-white">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  {companiesData?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col min-w-[220px]">
            <Label
              className="text-xs font-medium text-[#767A8B] mb-2 tracking-wide"
              htmlFor="search-name"
            >
              SEARCH NAME
            </Label>
            <Input
              id="search-name"
              type="text"
              placeholder="Filter by account name"
              className="text-sm text-gray-700 placeholder-gray-400 bg-white"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <div className="flex flex-col min-w-[220px]">
            <Label
              className="text-xs font-medium text-[#767A8B] mb-2 tracking-wide"
              htmlFor="account-type"
            >
              ACCOUNT TYPE
            </Label>
            <Select value={accountType} onValueChange={handleAccountTypeChange}>
              <SelectTrigger className="text-sm bg-white">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="none" value="none">
                  None
                </SelectItem>
                {accountTypeOptions.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="px-10 bg-white pt-6 pb-2">
        <div className="w-full border-l border-r border-b border-t rounded-2xl bg-white overflow-hidden">
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
            <thead>
              <tr className="bg-white">
                <th className="px-4 py-3 border-b border-[#EFF1F5]">
                  <div className="w-4 h-4 border border-[#d1d5db] rounded-sm bg-white"></div>
                </th>
                <th className="text-left border-l px-4 py-3 border-b border-r border-[#EFF1F5] font-normal text-sec text-sm">
                  <div className="flex items-center justify-between gap-2">
                    Account Name
                    <div className="flex flex-col">
                      <ChevronUp className="w-3 h-3 text-sec -mb-1" />
                      <ChevronDown className="w-3 h-3 text-sec" />
                    </div>
                  </div>
                </th>
                <th className="text-left px-4 py-3 border-b border-r border-[#EFF1F5] font-normal text-sec text-sm">
                  <div className="flex items-center justify-between gap-2">
                    Type
                    <div className="flex flex-col">
                      <ChevronUp className="w-3 h-3 text-sec -mb-1" />
                      <ChevronDown className="w-3 h-3 text-sec" />
                    </div>
                  </div>
                </th>
                <th className="text-left px-4 py-3 border-b border-r border-[#EFF1F5] font-normal text-sec text-sm">
                  <div className="flex items-center justify-between gap-2">
                    Company
                    <div className="flex flex-col">
                      <ChevronUp className="w-3 h-3 text-sec -mb-1" />
                      <ChevronDown className="w-3 h-3 text-sec" />
                    </div>
                  </div>
                </th>
                <th className="text-left px-4 py-3 border-b border-[#EFF1F5] border-l border-r font-normal text-sec text-sm">
                  <div className="flex items-center justify-between gap-2">
                    Mapped To
                    <div className="flex flex-col">
                      <ChevronUp className="w-3 h-3 text-sec -mb-1" />
                      <ChevronDown className="w-3 h-3 text-sec" />
                    </div>
                  </div>
                </th>
                <th className="text-center px-4 py-3 border-b border-[#EFF1F5] font-normal text-sec text-sm">
                  <div className="flex items-center justify-center gap-2">
                    Eliminate
                  </div>
                </th>
              </tr>
            </thead>
          </table>

          {/* Scrollable Body */}
          <div style={{ maxHeight: 370, overflowY: "auto" }}>
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
                {rows.map((row) => {
                  return (
                    <tr key={row.id} className="hover:bg-[#fafbfc] border-b">
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={row.checked}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(row.id, checked as boolean)
                          }
                          className="w-4 h-4 data-[state=checked]:bg-white data-[state=checked]:text-[#007aff] data-[state=checked]:border-[#007aff]"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm border-l ">
                        {row.name}
                      </td>
                      <td className="px-4 py-4 text-sm text-sec font-light">
                        {row.type}
                      </td>
                      <td className="px-4 py-4 text-sm text-sec font-light">
                        {row.company}
                      </td>
                      <td className="px-4 py-4 border-l border-r border-[#EFF1F5] text-sm">
                        <div className="max-w-full overflow-hidden">
                          {(() => {
                            const typeKey = getTypeKeyFromLabel(row.type);
                            let rowMappingOptions: {
                              id: string;
                              name: string;
                            }[] = [];
                            if (
                              mappingData &&
                              mappingData.data &&
                              mappingData.data.mapping &&
                              typeKey &&
                              mappingData.data.mapping[typeKey]
                            ) {
                              rowMappingOptions = flattenMappingTree(
                                mappingData.data.mapping[typeKey] || []
                              );
                            }

                            const selectedValue = mappedSelections[row.id];
                            const selectedOption = rowMappingOptions.find(
                              (opt) => opt.id === selectedValue
                            );
                            const displayText = selectedOption
                              ? selectedOption.name
                              : "Unmapped";
                            const isMapped = !!selectedValue;

                            return (
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
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-center">
                        <Switch
                          checked={row.eliminate}
                          onCheckedChange={(checked) =>
                            handleEliminateChange(row.id, checked)
                          }
                          disabled={!mappedSelections[row.id]}
                          className="data-[state=unchecked]:bg-[#e5e7eb] data-[state=checked]:bg-[#007aff] h-5 w-9 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            !mappedSelections[row.id]
                              ? "Map an account first to enable elimination"
                              : ""
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConsolidationFooter
        onBack={onBack}
        onNext={handleSaveAndNext}
        isLoading={saveMapping.isPending}
      />
    </>
  );
}
