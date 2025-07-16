"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Plus, Trash, Loader2, GripVertical } from "lucide-react";
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
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDndContext, // Import useDndContext
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type Account,
  ACCOUNT_COLUMNS,
  type Mapping,
  REPORT_TYPE_COLUMNS,
  REPORT_TYPES,
} from "../../types/consolidationUiMapping"; // Adjust path as needed
import {
  useMappingForAccountByType,
  useSaveMappings,
} from "@/hooks/query-hooks/useConsolidationApi"; // Adjust path as needed

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
  isDragOverlay = false,
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
  isDragOverlay?: boolean;
}) {
  const isTopLevel = level === 0;
  const [inputValue, setInputValue] = React.useState(account.title);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isEditing = editingId === account.account_id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: account.account_id,
    data: {
      account: account,
      colKey: colKey,
      level: level,
    },
  });

  // Use useDroppable to check if an item is being dragged *over* this specific account card
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: account.account_id, // Use the same ID as sortable for droppable context
    data: {
      account: account,
      colKey: colKey,
      level: level,
      type: "account", // Add a type to distinguish from column droppables
    },
  });

  // Combine refs
  const combinedRef = (el: HTMLDivElement | null) => {
    if (!isDragOverlay) {
      setNodeRef(el); // for sortable
      setDroppableNodeRef(el); // for droppable
      if (scrollToRef.current) {
        scrollToRef.current[account.account_id] = el;
      }
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  React.useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Determine if the current active dragged item can be dropped here
  const { active } = useDndContext();
  const activeData = active?.data.current;
  const isDragValidTarget =
    activeData && activeData.colKey === colKey && isOver;

  return (
    <div
      ref={combinedRef} // Use the combined ref here
      style={!isDragOverlay ? style : undefined}
      className={`
        ${
          isTopLevel
            ? "bg-white border-[#EFF1F5] rounded-xl text-sm shadow-sm border mb-2 w-full min-w-[260px] max-w-md cursor-pointer"
            : "border-t border-[#EFF1F5] w-full cursor-pointer"
        }
        ${isDragging ? "opacity-50" : ""}
        ${
          isDragOverlay
            ? "rotate-2 shadow-xl bg-white border-2 border-blue-400"
            : ""
        }
        ${
          isDragValidTarget
            ? "border-dashed border-2 border-green-400 bg-green-50" // Visual cue for valid drop on account
            : ""
        }
      `}
      onClick={!isDragOverlay ? handleClick : undefined}
    >
      <div
        className="flex items-center justify-between py-3 group pr-4"
        style={
          !isTopLevel
            ? { paddingLeft: `${level * 24 + 16}px` }
            : { paddingLeft: 16 }
        }
      >
        <div className="flex items-center flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="mr-2 p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>

          {isEditing ? (
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              maxLength={50}
              className="font-medium text-sm text-black bg-transparent border-b border-gray-200 px-0 py-0 h-7 focus:outline-none flex-1"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="font-medium text-sm text-black flex-1">
              {account.title}
            </span>
          )}
        </div>

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

// Droppable Column Component
function DroppableColumn({
  col,
  children,
  onAddRootAccount,
}: {
  col: { key: string; label: string };
  children: React.ReactNode;
  onAddRootAccount: (colKey: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${col.key}`,
    data: {
      colKey: col.key,
      type: "column",
    },
  });

  // Access the active (dragged) item's data
  const { active } = useDndContext();
  const isDragActiveInThisColumn =
    active?.data.current?.colKey === col.key && isOver;

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[260px] max-w-xs bg-[#FAFBFC] rounded-xl border border-[#EFF1F5] flex flex-col h-full transition-colors ${
        isOver ? "border-blue-400 bg-blue-50" : ""
      }
      ${
        isDragActiveInThisColumn
          ? "border-green-500 bg-green-50 shadow-md" // Stronger visual for valid drop zone
          : ""
      }`}
    >
      {/* Fixed Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm text-primary">{col.label}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddRootAccount(col.key)}
            className="p-0 h-6 w-6 text-[#1E925A] hover:bg-transparent"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <div className="border-b border-gray-200" />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 px-4 overflow-y-auto">{children}</div>

      {/* Fixed Footer */}
      <div className="px-4 pb-4 shrink-0">
        <Button
          variant="ghost"
          className="flex items-center text-sec w-full px-0 py-2 font-medium text-base hover:bg-transparent justify-start"
          onClick={() => onAddRootAccount(col.key)}
        >
          <Plus className="w-5 h-5 mr-1" /> New Account
        </Button>
      </div>
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedAccount, setDraggedAccount] = useState<Account | null>(null);
  const scrollToRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isInitialLoad = useRef(true);
  const hasUserChanges = useRef(false);
  const prevLocalMapping = useRef<Mapping>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const preDragState = useRef<Mapping>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

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

  // Helper function to deep clone an account with all its children
  const deepCloneAccount = (account: Account): Account => {
    return {
      ...account,
      children: account.children ? account.children.map(deepCloneAccount) : [],
    };
  };

  // Helper function to find and extract account from tree (preserving children)
  const extractAccountFromTree = (
    accounts: Account[],
    accountId: string
  ): { newAccounts: Account[]; extractedAccount: Account | null } => {
    let extractedAccount: Account | null = null;

    const newAccounts = accounts.filter((account) => {
      if (account.account_id === accountId) {
        extractedAccount = deepCloneAccount(account);
        return false;
      }
      return true;
    });

    // If not found at root level, search in children
    if (!extractedAccount) {
      const updatedAccounts = newAccounts.map((account) => {
        if (account.children && account.children.length > 0) {
          const result = extractAccountFromTree(account.children, accountId);
          if (result.extractedAccount) {
            extractedAccount = result.extractedAccount;
            return { ...account, children: result.newAccounts };
          }
        }
        return account;
      });
      return { newAccounts: updatedAccounts, extractedAccount };
    }

    return { newAccounts, extractedAccount };
  };

  // Helper function to insert account as child of target
  const insertAccountAsChild = (
    accounts: Account[],
    targetId: string,
    accountToInsert: Account
  ): Account[] => {
    return accounts.map((account) => {
      if (account.account_id === targetId) {
        return {
          ...account,
          children: [...(account.children || []), accountToInsert],
        };
      }
      if (account.children && account.children.length > 0) {
        return {
          ...account,
          children: insertAccountAsChild(
            account.children,
            targetId,
            accountToInsert
          ),
        };
      }
      return account;
    });
  };

  // Helper function to check if account is descendant of another
  const isDescendant = (parent: Account, childId: string): boolean => {
    if (parent.account_id === childId) return true;
    if (parent.children) {
      return parent.children.some((child) => isDescendant(child, childId));
    }
    return false;
  };

  // Helper function to get account level in tree
  const getAccountLevel = (
    accounts: Account[],
    accountId: string,
    currentLevel = 0
  ): number => {
    for (const account of accounts) {
      if (account.account_id === accountId) {
        return currentLevel;
      }
      if (account.children && account.children.length > 0) {
        const level = getAccountLevel(
          account.children,
          accountId,
          currentLevel + 1
        );
        if (level !== -1) return level;
      }
    }
    return -1;
  };

  // Helper function to get max depth of subtree
  const getMaxDepth = (account: Account): number => {
    if (!account.children || account.children.length === 0) {
      return 0;
    }
    return 1 + Math.max(...account.children.map(getMaxDepth));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Store the current state before drag starts
    preDragState.current = JSON.parse(JSON.stringify(localMapping));

    const activeData = active.data.current;
    if (activeData && activeData.account) {
      setDraggedAccount(deepCloneAccount(activeData.account));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setDraggedAccount(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !activeData.colKey) {
      // If activeData or its colKey is missing, we can't process the drag
      return;
    }

    const sourceColKey = activeData.colKey;
    const draggedAccountId = active.id as string;

    console.log(
      "Drag end - Source:",
      sourceColKey,
      "Dragged ID:",
      draggedAccountId,
      "Over:",
      over.id
    );

    let targetColKey: string | null = null;
    let targetAccountId: string | null = null;

    // Determine the target column based on where it's dropped
    if (overData && overData.type === "column") {
      // Dropped directly on a column (empty space)
      targetColKey = overData.colKey;
    } else if (overData && overData.account) {
      // Dropped on another account
      targetColKey = overData.colKey;
      targetAccountId = over.id as string;
    }

    // --- Fix for 'null' cannot be used as an index type and cross-column prevention ---
    // If there's no valid target column key, or it's a cross-column drop,
    // revert the item to its original position in the source column.
    if (!targetColKey || targetColKey !== sourceColKey) {
      console.log(
        `Cannot drop account into a different report type column or an invalid target. Source: ${sourceColKey}, Target: ${targetColKey}`
      );

      // For invalid drops, restore the pre-drag state
      setLocalMapping(preDragState.current);
      hasUserChanges.current = true;
      return; // Stop processing further as the drop is invalid
    }
    // --- End of fix ---

    // If we reach here, targetColKey is guaranteed to be a string and equal to sourceColKey.
    // So, it's safe to use targetColKey for indexing.

    // Extract account first to ensure it exists
    // We get `extractedAccount` again because the previous `extractedAccount` might have
    // been from a temporary state or for the revert logic.
    // Now we are sure we are processing a valid within-column drop.
    const currentSourceAccounts = [...(localMapping[sourceColKey] || [])];
    const { newAccounts: updatedSourceAccounts, extractedAccount } =
      extractAccountFromTree(currentSourceAccounts, draggedAccountId);

    if (!extractedAccount) {
      console.log("Could not find account to move after valid target check.");
      return;
    }

    // Handle dropping on another account within the same column (nesting)
    if (targetAccountId) {
      // targetColKey is implicitly sourceColKey here
      // Prevent dropping parent on its own descendant
      if (
        activeData.account &&
        isDescendant(activeData.account, targetAccountId)
      ) {
        console.log("Cannot drop: would create circular reference");
        // Revert if circular reference is detected - restore pre-drag state
        setLocalMapping(preDragState.current);
        hasUserChanges.current = true;
        return;
      }

      // Check nesting limits
      const targetLevel = getAccountLevel(
        localMapping[targetColKey] || [], // targetColKey is string here
        targetAccountId
      );
      const draggedDepth = getMaxDepth(activeData.account);

      if (targetLevel + 1 + draggedDepth > 3) {
        console.log("Cannot drop: would exceed maximum nesting level");
        // Revert if nesting limit is exceeded - restore pre-drag state
        setLocalMapping(preDragState.current);
        hasUserChanges.current = true;
        return;
      }

      // Perform the actual move and nesting
      setLocalMapping((prev) => {
        const newMapping = { ...prev };
        newMapping[sourceColKey] = updatedSourceAccounts; // Remove from original position
        const targetAccounts = [...(newMapping[targetColKey] || [])]; // targetColKey is string here
        const finalTargetAccounts = insertAccountAsChild(
          targetAccounts,
          targetAccountId,
          extractedAccount
        );
        newMapping[targetColKey] = finalTargetAccounts; // targetColKey is string here
        return newMapping;
      });
      hasUserChanges.current = true;
      return;
    }

    // Handle dropping on a column container (empty space in the *same* column) as a root account
    // This is the default if not dropped on another account for nesting, but within the same column.
    setLocalMapping((prev) => {
      const newMapping = { ...prev };
      // First, ensure it's removed from its previous nested/root position
      newMapping[sourceColKey] = updatedSourceAccounts;

      // Then, add to the target column (which is the source column here) as a root account
      const targetAccounts = [...(newMapping[targetColKey] || [])]; // targetColKey is string here
      // Only add if not already present at the root level to prevent duplicates
      if (
        !targetAccounts.some(
          (acc) => acc.account_id === extractedAccount.account_id
        )
      ) {
        targetAccounts.push(extractedAccount);
      }
      newMapping[targetColKey] = targetAccounts; // targetColKey is string here
      return newMapping;
    });
    hasUserChanges.current = true;
  };

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
    parentObj: Account | null = null, // This parameter seems unused, consider removing
    colKey: string | null = null,
    level = 0
  ) => {
    // Check if the parent account is already at the maximum nesting level
    if (level >= 3) {
      console.warn("Cannot add child: maximum nesting level reached.");
      return;
    }

    // Find the column key if not provided
    if (!colKey) {
      // This logic will find the column key by iterating through all columns
      // It assumes the parentAccount exists in one of the columns
      for (const col of ACCOUNT_COLUMNS) {
        if (localMapping[col.key]) {
          const newAccountId = findAccountAndAdd(
            localMapping[col.key],
            parentAccount.account_id,
            0 // Always start from level 0 when searching
          );
          if (newAccountId) {
            setLocalMapping((prev) => ({ ...prev })); // Trigger re-render with updated nested structure
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
      // Add to the provided column (more direct if colKey is known)
      const updated = localMapping[colKey] ? [...localMapping[colKey]] : [];
      const newAccountId = findAccountAndAdd(
        updated,
        parentAccount.account_id,
        0 // Always start from level 0 when searching
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
    for (const acc of accounts) {
      if (acc.account_id === id) {
        // Add child to this account (level check is handled in parent function)
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
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 w-max h-full pb-20">
                {(REPORT_TYPE_COLUMNS[selectedTab] || []).map((col) => (
                  <DroppableColumn
                    key={col.key}
                    col={col}
                    onAddRootAccount={handleAddRootAccount}
                  >
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
                  </DroppableColumn>
                ))}
              </div>

              <DragOverlay>
                {draggedAccount && (
                  <AccountCardRecursive
                    account={draggedAccount}
                    level={0}
                    maxLevel={3}
                    colKey="" // colKey not strictly necessary for overlay, but keeps prop consistent
                    onAddChild={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    editingId={null}
                    setEditingId={() => {}}
                    scrollToRef={scrollToRef}
                    isDragOverlay={true}
                  />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
    </>
  );
});
