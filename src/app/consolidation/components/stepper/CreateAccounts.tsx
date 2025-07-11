"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Plus, Trash, Loader2 } from "lucide-react";
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
import {
  Account,
  ACCOUNT_COLUMNS,
  Mapping,
  REPORT_TYPE_COLUMNS,
  REPORT_TYPES,
} from "../../types/consolidationUiMapping";
import {
  useMappingForAccountByType,
  useSaveMappings,
} from "@/hooks/query-hooks/useConsolidationApi";
import { useSelector } from "react-redux";

interface CreateAccountsProps {
  onNext: () => void;
  selectedCompanyId: string;
  onAutoSaveStateChange?: (isAutoSaving: boolean) => void;
}

export interface CreateAccountsRef {
  handleSave: () => Promise<boolean>;
  isLoading: boolean;
  saveLoading: boolean;
}

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
  scrollToRef,
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
  scrollToRef: React.RefObject<{ [key: string]: HTMLDivElement | null }>;
}) {
  const isTopLevel = level === 0;
  const [inputValue, setInputValue] = React.useState(account.title);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isEditing = editingId === account.account_id;

  // Debug logging
  if (isEditing) {
    console.log(
      "Account is in editing mode:",
      account.account_id,
      "Level:",
      level,
      "Title:",
      account.title
    );
  }

  React.useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling to parent accounts
    console.log(
      "Clicking account:",
      account.account_id,
      "Level:",
      level,
      "Title:",
      account.title
    );
    setEditingId(account.account_id);
  };
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

  return (
    <div
      ref={(el) => {
        if (scrollToRef.current) {
          scrollToRef.current[account.account_id] = el;
        }
      }}
      className={
        isTopLevel
          ? "bg-white border-[#EFF1F5] rounded-xl text-sm shadow-sm border mb-2 w-full min-w-[260px] max-w-md cursor-pointer"
          : "border-t border-[#EFF1F5] w-full cursor-pointer"
      }
      onClick={handleClick}
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
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(account.account_id);
              }}
              className="p-0 h-5 w-5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete account"
            >
              <Trash className="w-4 h-4" />
            </Button>
          )}
          {level < maxLevel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(account, undefined, colKey, level);
              }}
              className="p-0 h-5 w-5 text-[#1E925A] hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
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
              scrollToRef={scrollToRef}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const CreateAccounts = forwardRef<
  CreateAccountsRef,
  CreateAccountsProps
>(({ onNext, selectedCompanyId, onAutoSaveStateChange }, ref) => {
  const saveMapping = useSaveMappings();
  const [selectedTab, setSelectedTab] = useState<string>(REPORT_TYPES[0].value);
  const [mappingData, setMappingData] = useState<Mapping>({});
  const [localMapping, setLocalMapping] = useState<Mapping>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const scrollToRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isInitialLoad = useRef(true);
  const hasUserChanges = useRef(false);
  const prevLocalMapping = useRef<Mapping>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const { data, isLoading, isError } = useMappingForAccountByType(
    selectedCompanyId,
    selectedTab
  );

  useEffect(() => {
    if (data?.data?.mapping) {
      setMappingData(data.data.mapping);
      setLocalMapping(data.data.mapping);
      isInitialLoad.current = true;
      hasUserChanges.current = false;
    }
  }, [data]);

  // Function to save current mapping
  const saveCurrentMapping = async (reportType: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const payload = {
        realm_id: selectedCompanyId,
        report_type: reportType,
        mapping: localMapping,
      };

      saveMapping.mutate(payload, {
        onSuccess: () => {
          console.log(
            `Mapping saved successfully for report type: ${reportType}`
          );
          resolve(true);
        },
        onError: (error) => {
          console.error("Error saving mapping:", error);
          resolve(false);
        },
      });
    });
  };

  // Handle report type change with silent save
  const handleReportTypeChange = (newReportType: string) => {
    // Change report type immediately
    setSelectedTab(newReportType);
  };

  // Auto-save whenever localMapping changes (but not on initial load)
  useEffect(() => {
    // Skip if initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      prevLocalMapping.current = JSON.parse(JSON.stringify(localMapping));
      return;
    }

    // Skip if no user changes
    if (!hasUserChanges.current) {
      return;
    }

    // Check if there are actual changes
    const localMappingChanged =
      JSON.stringify(localMapping) !== JSON.stringify(prevLocalMapping.current);

    if (!localMappingChanged) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save to prevent rapid API calls
    saveTimeoutRef.current = setTimeout(() => {
      if (Object.keys(localMapping).length > 0) {
        setIsAutoSaving(true);
        onAutoSaveStateChange?.(true);

        const payload = {
          realm_id: selectedCompanyId,
          report_type: selectedTab,
          mapping: localMapping,
        };

        saveMapping.mutate(payload, {
          onSuccess: () => {
            console.log("Mapping auto-saved successfully");
            // Update previous values after successful save
            prevLocalMapping.current = JSON.parse(JSON.stringify(localMapping));
            hasUserChanges.current = false;
            setIsAutoSaving(false);
            onAutoSaveStateChange?.(false);
          },
          onError: (error) => {
            console.error("Error auto-saving mapping:", error);
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
  }, [localMapping, selectedCompanyId, selectedTab, onAutoSaveStateChange]);

  // Expose save functionality and loading state to parent component
  useImperativeHandle(
    ref,
    () => ({
      handleSave: async () => {
        return new Promise((resolve) => {
          const payload = {
            realm_id: selectedCompanyId,
            report_type: selectedTab,
            mapping: localMapping,
          };

          saveMapping.mutate(payload, {
            onSuccess: () => {
              // Don't navigate to next step, just save
              resolve(true);
            },
            onError: (error) => {
              console.error("Error saving mapping:", error);
              resolve(false);
            },
          });
        });
      },
      isLoading: saveMapping.isPending,
      saveLoading: saveMapping.isPending,
    }),
    [selectedCompanyId, selectedTab, localMapping, saveMapping]
  );

  // Add new root account
  const handleAddRootAccount = (colKey: string) => {
    const newAccountId = Math.random().toString(36).slice(2);
    setLocalMapping((prev: Mapping) => {
      const newAccount: Account = {
        account_id: newAccountId,
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
    setEditingId(newAccountId);
    hasUserChanges.current = true;

    // Scroll to the new account after a short delay to ensure DOM is updated
    setTimeout(() => {
      const element = scrollToRef.current[newAccountId];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
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
          const newAccountId = findAccountAndAdd(
            localMapping[col.key],
            parentAccount.account_id,
            level
          );
          if (newAccountId) {
            setLocalMapping((prev) => ({ ...prev }));
            setEditingId(newAccountId);
            hasUserChanges.current = true;

            // Scroll to the new account after a short delay
            setTimeout(() => {
              const element = scrollToRef.current[newAccountId];
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 100);
            return;
          }
        }
      }
    } else {
      // Add to the provided column
      const updated = localMapping[colKey] ? [...localMapping[colKey]] : [];
      const newAccountId = findAccountAndAdd(
        updated,
        parentAccount.account_id,
        level
      );
      setLocalMapping((prev) => ({ ...prev, [colKey]: updated }));
      if (newAccountId) {
        setEditingId(newAccountId);
        hasUserChanges.current = true;

        // Scroll to the new account after a short delay
        setTimeout(() => {
          const element = scrollToRef.current[newAccountId];
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    }
  };

  // Helper: Recursively find account and add child
  function findAccountAndAdd(
    accounts: Account[],
    id: string,
    level: number
  ): string | null {
    for (let acc of accounts) {
      if (acc.account_id === id) {
        if (!acc.children) acc.children = [];
        const newAccountId = Math.random().toString(36).slice(2);
        acc.children.push({
          account_id: newAccountId,
          realm_id: null,
          title: "New Account",
          children: [],
          mapped_account: [],
        });
        return newAccountId;
      }
      if (acc.children && acc.children.length > 0) {
        const found = findAccountAndAdd(acc.children, id, level + 1);
        if (found) return found;
      }
    }
    return null;
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
    hasUserChanges.current = true;
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
    hasUserChanges.current = true;
  };

  return (
    <>
      <div className="px-10 pt-8 bg-white shrink-0">
        <div className="flex-wrap bg-white border border-gray-200 rounded-2xl p-4 flex gap-8 items-end w-full minw-full mx-auto">
          <div className="flex flex-col flex-1 max-w-56">
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
          <div className="flex flex-col min-w-56">
            <Label
              className="text-xs font-medium text-[#767A8B] mb-2 tracking-wide"
              htmlFor="report-type"
            >
              REPORT TYPE
            </Label>
            <Select value={selectedTab} onValueChange={handleReportTypeChange}>
              <SelectTrigger className="text-sm min-w-full bg-white">
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
      <div className="flex-1 min-h-0 px-10 pt-5 bg-white overflow-hidden">
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
                  className="min-w-[260px] max-w-xs bg-[#FAFBFC] rounded-xl border border-[#EFF1F5] flex flex-col h-full"
                >
                  {/* Fixed Header */}
                  <div className="px-4 pt-4 pb-2 shrink-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-primary">
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
                              scrollToRef={scrollToRef}
                            />
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Fixed Footer */}
                  <div className="px-4 pb-4 shrink-0">
                    <Button
                      variant="ghost"
                      className="flex items-center text-sec w-full px-0 py-2 font-medium text-base hover:bg-transparent justify-start"
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
    </>
  );
});
