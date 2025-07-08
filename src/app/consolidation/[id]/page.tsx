"use client";
import React, { useEffect, useState, useRef } from "react";
import { consolidationApi } from "@/lib/api/consolidation";
import { Plus, Trash, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Sidebar } from "../components/Sidebar";
import { ConsolidationHeader } from "../components/ConsolidationHeader";
import { Stepper } from "../components/Stepper";
import { ConsolidationMain } from "../components/ConsolidationMain";
import { ConsolidationFooter } from "../components/ConsolidationFooter";
import { CompanyModal } from "@/app/components/chat/sidebar/CompanyModal";
import { store } from "@/lib/store/store";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  Account,
  ACCOUNT_COLUMNS,
  Mapping,
  REPORT_TYPE_COLUMNS,
  REPORT_TYPES,
} from "../types/consolidationUiMapping";
import {
  useMappingForAccountByType,
  useSaveMappings,
} from "@/hooks/query-hooks/useConsolidationApi";

function AccountCardRecursive({
  account,
  level,
  maxLevel,
  colKey,
  onAddChild,
  onEdit,
  onDelete,
  editingId,
  setEditingId,
}: {
  account: Account;
  level: number;
  maxLevel: number;
  colKey: string;
  onAddChild: (
    account: Account,
    parent?: Account,
    colKey?: string,
    level?: number
  ) => void;
  onEdit: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
}) {
  const isTopLevel = level === 0;
  const [inputValue, setInputValue] = React.useState(account.title);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isEditing = editingId === account.account_id;
  React.useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);
  const handleEdit = () => setEditingId(account.account_id);
  const handleBlur = () => {
    setEditingId(null);
    if (inputValue.trim() && inputValue !== account.title) {
      onEdit(account.account_id, inputValue.trim());
    } else {
      setInputValue(account.title);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBlur();
    else if (e.key === "Escape") {
      setEditingId(null);
      setInputValue(account.title);
    }
  };
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      className={
        isTopLevel
          ? "bg-white border-gray-200 rounded-sm text-sm shadow-sm border mb-2 w-full min-w-[260px] max-w-md"
          : "border-t border-gray-200 w-full"
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex items-center justify-between py-3 group pr-4"
        style={
          !isTopLevel ? { paddingLeft: `${level * 24}px` } : { paddingLeft: 16 }
        }
      >
        {isEditing ? (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={50}
            className="font-medium text-sm text-black bg-transparent border-b border-gray-200 px-0 py-0 h-7 focus:outline-none"
          />
        ) : (
          <span className="font-medium text-sm text-black">
            {account.title}
          </span>
        )}
        <div className="flex items-center gap-1 ml-2">
          {hovered && !isEditing && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="p-0 h-5 w-5 text-gray-400 hover:text-[#1E925A]"
                title="Edit account"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(account.account_id)}
                className="p-0 h-5 w-5 text-gray-400 hover:text-red-500"
                title="Delete account"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </>
          )}
          {level < maxLevel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAddChild(account, undefined, colKey, level)}
              className="p-0 h-5 w-5 text-[#1E925A] hover:bg-transparent"
              title="Add nested account"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      {account.children && account.children.length > 0 && (
        <div>
          {account.children.map((child: Account) => (
            <AccountCardRecursive
              key={child.account_id}
              account={child}
              level={level + 1}
              maxLevel={maxLevel}
              colKey={colKey}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConsolidationPage() {
  const router = useRouter();
  const params = useParams();
  const saveMapping = useSaveMappings();
  const [selectedTab, setSelectedTab] = useState<string>(REPORT_TYPES[0].value);
  const [mappingData, setMappingData] = useState<Mapping>({});
  const [localMapping, setLocalMapping] = useState<Mapping>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedCompanyId = useSelector(
    (state: any) => state.user.selectedCompany?.id
  );
  const consolidationId = params.id as string;
  const companies = store.getState().user.companies;
  const realmId = companies.find(
    (company: any) => company.id === selectedCompanyId
  )?.realmId;

  // Sync URL with selectedCompany
  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== consolidationId) {
      router.replace(`/consolidation/${selectedCompanyId}`);
    }
  }, [selectedCompanyId, consolidationId, router]);

  const { data, isLoading, isError } = useMappingForAccountByType(
    selectedCompanyId,
    selectedTab
  );

  useEffect(() => {
    if (data?.data?.mapping) {
      setMappingData(data.data.mapping);
      setLocalMapping(data.data.mapping);
    }
  }, [data]);

  // Add new root account
  const handleAddRootAccount = (colKey: string) => {
    setLocalMapping((prev: Mapping) => {
      const newAccount: Account = {
        account_id: Math.random().toString(36).slice(2),
        realm_id: null,
        title: "New Account",
        children: [],
        mapped_account: [],
      };
      return {
        ...prev,
        [colKey]: prev[colKey] ? [...prev[colKey], newAccount] : [newAccount],
      };
    });
    setEditingId(Math.random().toString(36).slice(2));
  };

  // Add child account (nesting)
  const handleAddChildAccount = (
    parentAccount: Account,
    parentObj: Account | null = null,
    colKey: string | null = null,
    level: number = 0
  ) => {
    // Find the column key if not provided
    if (!colKey) {
      for (const col of ACCOUNT_COLUMNS) {
        if (localMapping[col.key]) {
          const found = findAccountAndAdd(
            localMapping[col.key],
            parentAccount.account_id,
            level
          );
          if (found) {
            setLocalMapping((prev) => ({ ...prev }));
            return;
          }
        }
      }
    } else {
      // Add to the provided column
      const updated = localMapping[colKey] ? [...localMapping[colKey]] : [];
      findAccountAndAdd(updated, parentAccount.account_id, level);
      setLocalMapping((prev) => ({ ...prev, [colKey]: updated }));
    }
  };

  // Helper: Recursively find account and add child
  function findAccountAndAdd(
    accounts: Account[],
    id: string,
    level: number
  ): boolean {
    for (let acc of accounts) {
      if (acc.account_id === id) {
        if (!acc.children) acc.children = [];
        acc.children.push({
          account_id: Math.random().toString(36).slice(2),
          realm_id: null,
          title: "New Account",
          children: [],
          mapped_account: [],
        });
        return true;
      }
      if (acc.children && acc.children.length > 0) {
        const found = findAccountAndAdd(acc.children, id, level + 1);
        if (found) return true;
      }
    }
    return false;
  }

  // Edit account name
  const handleEditAccount = (id: string, newTitle: string) => {
    setLocalMapping((prev: Mapping) => {
      const updateTitle = (accounts: Account[]): Account[] =>
        accounts.map((acc) =>
          acc.account_id === id
            ? { ...acc, title: newTitle }
            : {
                ...acc,
                children: acc.children ? updateTitle(acc.children) : [],
              }
        );
      const updated: Mapping = {};
      for (const key in prev) {
        updated[key] = updateTitle(prev[key]);
      }
      return updated;
    });
  };

  // Delete account (and its children)
  const handleDeleteAccount = (id: string) => {
    setLocalMapping((prev: Mapping) => {
      const removeAccount = (accounts: Account[]): Account[] =>
        accounts.filter((acc) => {
          if (acc.account_id === id) return false;
          acc.children = acc.children ? removeAccount(acc.children) : [];
          return true;
        });
      const updated: Mapping = {};
      for (const key in prev) {
        updated[key] = removeAccount(prev[key]);
      }
      return updated;
    });
  };

  console.log(localMapping, "localMapping");

  const handleNext = () => {
    const payload = {
      realm_id: selectedCompanyId,
      report_type: selectedTab,
      mapping: localMapping,
    };
    saveMapping.mutate(payload);
    if (saveMapping.isSuccess) {
      useMappingForAccountByType(selectedCompanyId, selectedTab).refetch();
    }
    if (saveMapping.isError) {
      console.log("error");
    }
  };

  return (
    <>
      <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content + Footer wrapper */}
        <ConsolidationMain>
          {/* Header */}
          <ConsolidationHeader />
          {/* Stepper */}
          <Stepper currentStep={0} />
          {/* Consolidation Name & Report Type Card */}
          <div className="px-10 pt-8 bg-white shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex gap-8 items-end w-full minw-full mx-auto">
              <div className="flex flex-col flex-1 max-w-[220px]">
                <Label
                  className="text-xs font-medium text-[#767A8B] mb-2 tracking-wide"
                  htmlFor="consolidation-name"
                >
                  CONSOLIDATION NAME
                </Label>
                <Input
                  id="consolidation-name"
                  type="text"
                  placeholder='e.g., "Q1 Global Consolidation"'
                  className="text-sm text-gray-700 placeholder-gray-400 bg-white"
                />
              </div>
              <div className="flex flex-col min-w-[180px]">
                <Label
                  className="text-xs font-medium text-[#767A8B] mb-2 tracking-wide"
                  htmlFor="report-type"
                >
                  REPORT TYPE
                </Label>
                <Select value={selectedTab} onValueChange={setSelectedTab}>
                  <SelectTrigger className="text-sm bg-white">
                    <SelectValue />
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
            </div>
          </div>
          {/* Main Content Area: Account Columns */}
          <div className="flex-1 min-h-0 px-10 py-8 bg-white overflow-hidden">
            <div className="h-full overflow-x-auto">
              {isLoading ? (
                <div className="flex flex-1 items-center justify-center min-h-[400px]">
                  <Loader2 className="animate-spin w-10 h-10 text-[#1E925A]" />
                </div>
              ) : (
                <div className="flex gap-6 w-max h-full pb-20">
                  {(REPORT_TYPE_COLUMNS[selectedTab] || []).map((col) => (
                    <div
                      key={col.key}
                      className="min-w-[260px] max-w-xs bg-white flex flex-col h-full"
                    >
                      {/* Fixed Header */}
                      <div className="px-4 pt-4 pb-2 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-black">
                            {col.label}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddRootAccount(col.key)}
                            className="p-0 h-6 w-6 text-[#1E925A] hover:bg-transparent"
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                        <div className="border-b border-gray-200" />
                      </div>

                      {/* Scrollable Content */}
                      <div className="flex-1 min-h-0 px-4 overflow-y-auto">
                        {localMapping[col.key] &&
                          localMapping[col.key].length > 0 && (
                            <div className="space-y-2">
                              {localMapping[col.key].map((account: Account) => (
                                <AccountCardRecursive
                                  key={account.account_id}
                                  account={account}
                                  level={0}
                                  maxLevel={3}
                                  colKey={col.key}
                                  onAddChild={handleAddChildAccount}
                                  onEdit={handleEditAccount}
                                  onDelete={handleDeleteAccount}
                                  editingId={editingId}
                                  setEditingId={setEditingId}
                                />
                              ))}
                            </div>
                          )}
                      </div>

                      {/* Fixed Footer */}
                      <div className="px-4 pb-4 shrink-0">
                        <Button
                          variant="ghost"
                          className="flex items-center text-gray-400 w-full px-0 py-2 font-medium text-base hover:bg-transparent justify-start"
                          onClick={() => handleAddRootAccount(col.key)}
                        >
                          <Plus className="w-5 h-5 mr-1" /> New Account
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ConsolidationMain>
        {/* Footer Buttons */}
        <ConsolidationFooter
          onNext={handleNext}
          isLoading={saveMapping.isPending}
        />
      </div>
      <CompanyModal />
    </>
  );
}
