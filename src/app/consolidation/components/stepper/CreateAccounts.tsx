"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from "react";
import { Plus, Loader2 } from "lucide-react";
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
  type Account,
  ACCOUNT_COLUMNS,
  type Mapping,
  REPORT_TYPE_COLUMNS,
  REPORT_TYPES,
} from "../../types/consolidationUiMapping";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useMappingForAccountByType,
  useSaveMappings,
} from "@/hooks/query-hooks/useConsolidationApi";

// Import SortableTree components from the test page
import {
  Announcements,
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
  MeasuringStrategy,
  DropAnimation,
  Modifier,
  defaultDropAnimation,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";

// Types for SortableTree
interface TreeItem {
  id: UniqueIdentifier;
  children: TreeItem[];
  collapsed?: boolean;
  title?: string;
}

type TreeItems = TreeItem[];

interface FlattenedItem extends TreeItem {
  parentId: UniqueIdentifier | null;
  depth: number;
  index: number;
}

type SensorContext = React.MutableRefObject<{
  items: FlattenedItem[];
  offset: number;
}>;

interface CreateAccountsProps {
  onNext: () => void;
  selectedCompanyId: string;
}

export interface CreateAccountsRef {
  handleSave: () => Promise<boolean>;
  isLoading: boolean;
  saveLoading: boolean;
}

// Utility functions for SortableTree
const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth);
}

function getProjection(
  items: FlattenedItem[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const maxDepth = getMaxDepth({ previousItem });
  const minDepth = getMinDepth({ nextItem });
  let depth = projectedDepth;

  // Ensure depth doesn't exceed 4 levels
  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  // Additional check to ensure we never exceed 4 levels
  depth = Math.min(depth, 4);

  return { depth, maxDepth, minDepth, parentId: getParentId() };

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.parentId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}

function getMaxDepth({ previousItem }: { previousItem: FlattenedItem }) {
  if (previousItem) {
    // Limit nesting to 4 levels maximum
    return Math.min(previousItem.depth + 1, 4);
  }
  return 0;
}

function getMinDepth({ nextItem }: { nextItem: FlattenedItem }) {
  if (nextItem) {
    return nextItem.depth;
  }
  return 0;
}

function flatten(
  items: TreeItems,
  parentId: UniqueIdentifier | null = null,
  depth = 0
): FlattenedItem[] {
  return items.reduce<FlattenedItem[]>((acc, item, index) => {
    return [
      ...acc,
      { ...item, parentId, depth, index },
      ...flatten(item.children, item.id, depth + 1),
    ];
  }, []);
}

function flattenTree(items: TreeItems): FlattenedItem[] {
  return flatten(items);
}

function buildTree(flattenedItems: FlattenedItem[]): TreeItems {
  const root: TreeItem = { id: "root", children: [] };
  const nodes: Record<string, TreeItem> = { [root.id]: root };
  const items = flattenedItems.map((item) => ({ ...item, children: [] }));

  for (const item of items) {
    const { id, children } = item;
    const parentId = item.parentId ?? root.id;
    const parent = nodes[parentId] ?? findItem(items, parentId);

    nodes[id] = { id, children };
    parent.children.push(item);
  }

  return root.children;
}

function findItem(items: TreeItem[], itemId: UniqueIdentifier) {
  return items.find(({ id }) => id === itemId);
}

function findItemDeep(
  items: TreeItems,
  itemId: UniqueIdentifier
): TreeItem | undefined {
  for (const item of items) {
    const { id, children } = item;

    if (id === itemId) {
      return item;
    }

    if (children.length) {
      const child = findItemDeep(children, itemId);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

function removeItem(items: TreeItems, id: UniqueIdentifier) {
  const newItems = [];

  for (const item of items) {
    if (item.id === id) {
      continue;
    }

    if (item.children.length) {
      item.children = removeItem(item.children, id);
    }

    newItems.push(item);
  }

  return newItems;
}

function setProperty<T extends keyof TreeItem>(
  items: TreeItems,
  id: UniqueIdentifier,
  property: T,
  setter: (value: TreeItem[T]) => TreeItem[T]
): TreeItems {
  return items.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        [property]: setter(item[property]),
      };
    }

    if (item.children.length) {
      return {
        ...item,
        children: setProperty(item.children, id, property, setter),
      };
    }

    return item;
  });
}

function countChildren(items: TreeItem[], count = 0): number {
  return items.reduce((acc, { children }) => {
    if (children.length) {
      return countChildren(children, acc + 1);
    }
    return acc + 1;
  }, count);
}

function getChildCount(items: TreeItems, id: UniqueIdentifier) {
  const item = findItemDeep(items, id);
  return item ? countChildren(item.children) : 0;
}

function removeChildrenOf(items: FlattenedItem[], ids: UniqueIdentifier[]) {
  const excludeParentIds = [...ids];

  return items.filter((item) => {
    if (item.parentId && excludeParentIds.includes(item.parentId)) {
      if (item.children.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }
    return true;
  });
}

// Keyboard coordinates
const sortableTreeKeyboardCoordinates: (
  context: SensorContext,
  indicator: boolean,
  indentationWidth: number
) => any =
  (context, indicator, indentationWidth) =>
  (
    event: any,
    {
      currentCoordinates,
      context: {
        active,
        over,
        collisionRect,
        droppableRects,
        droppableContainers,
      },
    }: any
  ) => {
    const directions = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    const horizontal = ["ArrowLeft", "ArrowRight"];

    if (directions.includes(event.code)) {
      if (!active || !collisionRect) {
        return;
      }

      event.preventDefault();

      const {
        current: { items, offset },
      } = context;

      if (horizontal.includes(event.code) && over?.id) {
        const { depth, maxDepth, minDepth } = getProjection(
          items,
          active.id,
          over.id,
          offset,
          indentationWidth
        );

        switch (event.code) {
          case "ArrowLeft":
            if (depth > minDepth) {
              return {
                ...currentCoordinates,
                x: currentCoordinates.x - indentationWidth,
              };
            }
            break;
          case "ArrowRight":
            if (depth < maxDepth) {
              return {
                ...currentCoordinates,
                x: currentCoordinates.x + indentationWidth,
              };
            }
            break;
        }

        return undefined;
      }

      const containers: any[] = [];

      droppableContainers.forEach((container: any) => {
        if (container?.disabled || container.id === over?.id) {
          return;
        }

        const rect = droppableRects.get(container.id);

        if (!rect) {
          return;
        }

        switch (event.code) {
          case "ArrowDown":
            if (collisionRect.top < rect.top) {
              containers.push(container);
            }
            break;
          case "ArrowUp":
            if (collisionRect.top > rect.top) {
              containers.push(container);
            }
            break;
        }
      });

      const collisions = closestCenter({
        active,
        collisionRect,
        pointerCoordinates: null,
        droppableRects,
        droppableContainers: containers,
      });
      let closestId = collisions[0]?.id;

      if (closestId && over?.id) {
        const activeRect = droppableRects.get(active.id);
        const newRect = droppableRects.get(closestId);
        const newDroppable = droppableContainers.get(closestId);

        if (activeRect && newRect && newDroppable) {
          const newIndex = items.findIndex(({ id }) => id === closestId);
          const newItem = items[newIndex];
          const activeIndex = items.findIndex(({ id }) => id === active.id);
          const activeItem = items[activeIndex];

          if (newItem && activeItem) {
            const { depth } = getProjection(
              items,
              active.id,
              closestId,
              (newItem.depth - activeItem.depth) * indentationWidth,
              indentationWidth
            );
            const isBelow = newIndex > activeIndex;
            const modifier = isBelow ? 1 : -1;
            const offset = indicator
              ? (collisionRect.height - activeRect.height) / 2
              : 0;

            const newCoordinates = {
              x: newRect.left + depth * indentationWidth,
              y: newRect.top + modifier * offset,
            };

            return newCoordinates;
          }
        }
      }
    }

    return undefined;
  };

// Tree Item Component
interface TreeItemProps
  extends Omit<React.HTMLAttributes<HTMLLIElement>, "id"> {
  childCount?: number;
  clone?: boolean;
  collapsed?: boolean;
  depth: number;
  disableInteraction?: boolean;
  disableSelection?: boolean;
  ghost?: boolean;
  handleProps?: any;
  indicator?: boolean;
  indentationWidth: number;
  value: string;
  title?: string;
  isEditing?: boolean;
  onCollapse?(): void;
  onRemove?(): void;
  onEdit?(): void;
  onAddChild?(): void;
  onTitleChange?(newTitle: string): void;
  wrapperRef?(node: HTMLLIElement): void;
}

const TreeItem = React.forwardRef<HTMLDivElement, TreeItemProps>(
  (
    {
      childCount,
      clone,
      depth,
      disableSelection,
      disableInteraction,
      ghost,
      handleProps,
      indentationWidth,
      indicator,
      collapsed,
      onCollapse,
      onRemove,
      onEdit,
      onAddChild,
      onTitleChange,
      style,
      value,
      title,
      isEditing,
      wrapperRef,
      ...props
    },
    ref
  ) => {
    const [editValue, setEditValue] = React.useState(title || "New Account");
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleEditSubmit = () => {
      if (onTitleChange) {
        onTitleChange(editValue);
      }
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleEditSubmit();
      } else if (e.key === "Escape") {
        setEditValue(title || "New Account");
        if (onTitleChange) {
          onTitleChange(title || "New Account");
        }
      }
    };

    return (
      <li
        className={`list-none box-border pl-[calc(var(--spacing))] mb-[-1px] ${
          clone ? "inline-block pointer-events-none p-0 pl-[10px] pt-[5px]" : ""
        } ${
          ghost
            ? indicator
              ? "opacity-100 relative z-[1] mb-[-1px]"
              : "opacity-50"
            : ""
        } ${disableSelection ? "select-none" : ""} ${
          disableInteraction ? "pointer-events-none" : ""
        }`}
        ref={wrapperRef}
        style={
          {
            "--spacing": `${indentationWidth * depth}px`,
          } as React.CSSProperties
        }
        {...props}
      >
        <div
          className={`group relative flex items-center p-[var(--vertical-padding,10px)] pr-[10px] bg-white border border-[#dedede] text-[#222] box-border ${
            clone
              ? "pr-[24px] rounded-[4px] shadow-[0px_15px_15px_0_rgba(34,33,81,0.1)]"
              : ""
          } ${
            ghost && indicator
              ? 'relative p-0 h-[8px] border-[#2389ff] bg-[#56a1f8] before:absolute before:left-[-8px] before:top-[-4px] before:block before:content-[""] before:w-[12px] before:h-[12px] before:rounded-full before:border before:border-[#2389ff] before:bg-white'
              : ""
          } ${!clone && onEdit ? "cursor-pointer hover:bg-gray-50" : ""}`}
          ref={ref}
          style={style}
          onClick={!clone && onEdit ? onEdit : undefined}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Handle {...handleProps} onClick={(e) => e.stopPropagation()} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Drag to reorder</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {onCollapse && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Action
                    onClick={(e) => {
                      e.stopPropagation();
                      onCollapse();
                    }}
                    className={`transition-transform duration-[250ms] ease-in-out ${
                      collapsed ? "rotate-[-90deg]" : ""
                    }`}
                  >
                    <svg
                      width="10"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 70 41"
                    >
                      <path d="M30.76 39.2402C31.885 40.3638 33.41 40.995 35 40.995C36.59 40.995 38.115 40.3638 39.24 39.2402L68.24 10.2402C69.2998 9.10284 69.8768 7.59846 69.8494 6.04406C69.822 4.48965 69.1923 3.00657 68.093 1.90726C66.9937 0.807959 65.5106 0.178263 63.9562 0.150837C62.4018 0.123411 60.8974 0.700397 59.76 1.76024L35 26.5102L10.24 1.76024C9.10259 0.700397 7.59822 0.123411 6.04381 0.150837C4.4894 0.178263 3.00632 0.807959 1.90702 1.90726C0.807714 3.00657 0.178019 4.48965 0.150593 6.04406C0.123167 7.59846 0.700153 9.10284 1.75999 10.2402L30.76 39.2402Z" />
                    </svg>
                  </Action>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{collapsed ? "Expand" : "Collapse"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={handleEditKeyDown}
              className="flex-1 pl-0 bg-transparent outline-none text-[#222] min-w-0 border-b border-gray-400 pb-1"
            />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-1 pl-[0.5rem] whitespace-nowrap text-ellipsis overflow-hidden min-w-0 cursor-default">
                    {title || value}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{title || value}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {!clone && (
            <div
              className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {onAddChild && depth < 4 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Add onClick={onAddChild} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add child account</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {onRemove && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Dustbin onClick={onRemove} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove account</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}

          {clone && childCount && childCount > 1 ? (
            <span className="absolute top-[-10px] right-[-10px] flex items-center justify-center w-[24px] h-[24px] rounded-full bg-[#2389ff] text-[0.8rem] font-semibold text-white">
              {childCount}
            </span>
          ) : null}
        </div>
      </li>
    );
  }
);

TreeItem.displayName = "TreeItem";

// Action Component
interface ActionProps extends React.HTMLAttributes<HTMLButtonElement> {
  active?: {
    fill: string;
    background: string;
  };
  cursor?: React.CSSProperties["cursor"];
}

const Action = React.forwardRef<HTMLButtonElement, ActionProps>(
  ({ active, className, cursor, style, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        className={`flex w-[12px] p-[15px] items-center justify-center flex-none touch-none cursor-[var(--cursor,pointer)] rounded-[5px] border-none outline-none appearance-none bg-transparent [-webkit-tap-highlight-color:transparent] hover:bg-[var(--action-background,rgba(0,0,0,0.05))] hover:svg:fill-[#6f7b88] active:bg-[var(--background,rgba(0,0,0,0.05))] active:svg:fill-[var(--fill,#788491)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(255,255,255,0),0_0px_0px_2px_#4c9ffe] [&>svg]:flex-none [&>svg]:m-auto [&>svg]:h-full [&>svg]:overflow-visible [&>svg]:fill-[#919eab] ${className}`}
        tabIndex={0}
        style={
          {
            ...style,
            cursor,
            "--fill": active?.fill,
            "--background": active?.background,
          } as React.CSSProperties
        }
      >
        {children}
      </button>
    );
  }
);

Action.displayName = "Action";

// Handle Component
const Handle = React.forwardRef<HTMLButtonElement, ActionProps>(
  (props, ref) => {
    return (
      <Action
        ref={ref}
        cursor="grab"
        data-cypress="draggable-handle"
        {...props}
      >
        <svg
          viewBox="0 0 20 20"
          width="12"
          height="12"
          className="flex-none m-auto h-full overflow-visible fill-[#919eab] hover:fill-[#6f7b88]"
        >
          <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
        </svg>
      </Action>
    );
  }
);

Handle.displayName = "Handle";

// Dustbin Component
function Dustbin(props: ActionProps) {
  return (
    <Action
      {...props}
      active={{
        fill: "rgba(255, 70, 70, 0.95)",
        background: "rgba(255, 70, 70, 0.1)",
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-none m-auto h-full overflow-visible fill-[#919eab] hover:fill-[#6f7b88]"
      >
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
      </svg>
    </Action>
  );
}

// Edit Component
function Edit(props: ActionProps) {
  return (
    <Action
      {...props}
      active={{
        fill: "rgba(59, 130, 246, 0.95)",
        background: "rgba(59, 130, 246, 0.1)",
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-none m-auto h-full overflow-visible fill-[#919eab] hover:fill-[#6f7b88]"
      >
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      </svg>
    </Action>
  );
}

// Add Component
function Add(props: ActionProps) {
  return (
    <Action
      {...props}
      active={{
        fill: "rgba(34, 197, 94, 0.95)",
        background: "rgba(34, 197, 94, 0.1)",
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-none m-auto h-full overflow-visible fill-[#919eab] hover:fill-[#6f7b88]"
      >
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
    </Action>
  );
}

// Sortable Tree Item Component
interface SortableTreeItemProps extends TreeItemProps {
  id: UniqueIdentifier;
}

const SortableTreeItem = React.forwardRef<
  HTMLDivElement,
  SortableTreeItemProps
>(({ id, depth, ...props }, ref) => {
  const {
    attributes,
    isDragging,
    isSorting,
    listeners,
    setDraggableNodeRef,
    setDroppableNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    animateLayoutChanges: ({ isSorting, wasDragging }) =>
      isSorting || wasDragging ? false : true,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <TreeItem
      ref={setDraggableNodeRef}
      wrapperRef={setDroppableNodeRef}
      style={style}
      depth={depth}
      ghost={isDragging}
      disableSelection={iOS}
      disableInteraction={isSorting}
      handleProps={{
        ...attributes,
        ...listeners,
      }}
      {...props}
    />
  );
});

SortableTreeItem.displayName = "SortableTreeItem";

// Data conversion utilities
function convertAccountToTreeItem(
  account: Account,
  columnKey: string
): TreeItem {
  return {
    id: `${columnKey}-${account.account_id}`, // Make IDs unique per column
    children: account.children.map((child) =>
      convertAccountToTreeItem(child, columnKey)
    ),
    // Store the title in a custom property for display
    title: account.title,
  } as TreeItem & { title: string };
}

function convertTreeItemToAccount(
  treeItem: TreeItem & { title?: string },
  columnKey: string
): Account {
  // Extract the original account_id from the column-prefixed ID
  const accountId = treeItem.id.toString().replace(`${columnKey}-`, "");
  return {
    account_id: accountId,
    realm_id: null,
    title: treeItem.title || accountId,
    children: treeItem.children.map((child) =>
      convertTreeItemToAccount(child, columnKey)
    ),
    mapped_account: [],
  };
}

// Column Container Component (simplified, no drag drop logic)
function ColumnContainer({
  col,
  children,
  onAddRootAccount,
}: {
  col: { key: string; label: string };
  children: React.ReactNode;
  onAddRootAccount: (colKey: string) => void;
}) {
  return (
    <div className="w-[380px] bg-[#FAFBFC] rounded-xl border border-[#EFF1F5] flex flex-col h-full">
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

// SortableTree Component for each column
interface SortableTreeProps {
  collapsible?: boolean;
  defaultItems?: TreeItems;
  indentationWidth?: number;
  indicator?: boolean;
  removable?: boolean;
  onItemsChange?: (items: TreeItems) => void;
  autoEditId?: UniqueIdentifier | null;
  onAddChild?: (parentId: UniqueIdentifier) => void;
}

function SortableTree({
  collapsible,
  defaultItems = [],
  indicator = false,
  indentationWidth = 60,
  removable,
  onItemsChange,
  autoEditId,
  onAddChild,
}: SortableTreeProps) {
  const [items, setItems] = useState(() => defaultItems);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [currentPosition, setCurrentPosition] = useState<{
    parentId: UniqueIdentifier | null;
    overId: UniqueIdentifier;
  } | null>(null);
  const [editingId, setEditingId] = useState<UniqueIdentifier | null>(null);
  const isUpdatingRef = useRef(false);
  const isEditingRef = useRef(false);
  const treeId = useRef(Math.random().toString(36).slice(2)); // Unique ID for each tree instance

  // Auto-edit when autoEditId is provided
  useEffect(() => {
    if (autoEditId && !editingId) {
      setEditingId(autoEditId);
      isEditingRef.current = true;
    }
  }, [autoEditId, editingId]);

  // Clear autoEditId after it's been used
  useEffect(() => {
    if (autoEditId && editingId === autoEditId) {
      // Clear the autoEditId after it's been used
      setTimeout(() => {
        // This will be handled by the parent component
      }, 100);
    }
  }, [autoEditId, editingId]);

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);
    const collapsedItems = flattenedTree.reduce<UniqueIdentifier[]>(
      (acc, { children, collapsed, id }) => {
        const shouldCollapse = collapsed === true && children.length > 0;
        return shouldCollapse ? [...acc, id] : acc;
      },
      []
    );

    const result = removeChildrenOf(
      flattenedTree,
      activeId != null ? [activeId, ...collapsedItems] : collapsedItems
    );
    return result;
  }, [activeId, items]);

  const projected =
    activeId && overId
      ? getProjection(
          flattenedItems,
          activeId,
          overId,
          offsetLeft,
          indentationWidth
        )
      : null;

  const sensorContext: SensorContext = useRef({
    items: flattenedItems,
    offset: offsetLeft,
  });

  const [coordinateGetter] = useState(() =>
    sortableTreeKeyboardCoordinates(sensorContext, indicator, indentationWidth)
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );

  const sortedIds = useMemo(
    () => flattenedItems.map(({ id }: FlattenedItem) => id),
    [flattenedItems]
  );

  const activeItem = activeId
    ? flattenedItems.find(({ id }: FlattenedItem) => id === activeId)
    : null;

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft,
    };
  }, [flattenedItems, offsetLeft]);

  // Update internal state when defaultItems changes (from parent)
  useEffect(() => {
    // Only update if the items are actually different to prevent unnecessary updates
    // Compare structure and titles, but ignore editing state
    const compareItems = (items1: TreeItems, items2: TreeItems): boolean => {
      const normalizeItems = (
        items: TreeItems
      ): Array<{ id: UniqueIdentifier; title?: string; children: any[] }> => {
        return items.map((item) => ({
          id: item.id,
          title: item.title,
          children: normalizeItems(item.children),
          // Ignore collapsed state for comparison
        }));
      };

      return (
        JSON.stringify(normalizeItems(items1)) ===
        JSON.stringify(normalizeItems(items2))
      );
    };

    if (!compareItems(defaultItems, items)) {
      isUpdatingRef.current = true;
      setItems(defaultItems);
      // Reset the flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [defaultItems]);

  // Notify parent of items change
  useEffect(() => {
    if (onItemsChange && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      onItemsChange(items);
      // Reset the flag after a short delay to allow for state updates
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [items, onItemsChange]);

  const announcements: Announcements = {
    onDragStart({ active }) {
      return `Picked up ${active.id}.`;
    },
    onDragMove({ active, over }) {
      return getMovementAnnouncement("onDragMove", active.id, over?.id);
    },
    onDragOver({ active, over }) {
      return getMovementAnnouncement("onDragOver", active.id, over?.id);
    },
    onDragEnd({ active, over }) {
      return getMovementAnnouncement("onDragEnd", active.id, over?.id);
    },
    onDragCancel({ active }) {
      return `Moving was cancelled. ${active.id} was dropped in its original position.`;
    },
  };

  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  const dropAnimationConfig: DropAnimation = {
    keyframes({ transform }) {
      return [
        { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
        {
          opacity: 0,
          transform: CSS.Transform.toString({
            ...transform.final,
            x: transform.final.x + 5,
            y: transform.final.y + 5,
          }),
        },
      ];
    },
    easing: "ease-out",
    sideEffects({ active }) {
      active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: defaultDropAnimation.duration,
        easing: defaultDropAnimation.easing,
      });
    },
  };

  return (
    <DndContext
      accessibility={{ announcements }}
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        {flattenedItems.length === 0 ? (
          <div className="text-center text-gray-500 py-4 text-sm">
            No accounts yet. Click the + button to add one.
          </div>
        ) : (
          flattenedItems.map(
            ({ id, children, collapsed, depth }: FlattenedItem) => {
              const hasCollapse = collapsible && children.length > 0;
              // Find the original item to get the title - search recursively
              const findItemWithTitle = (
                items: TreeItems,
                targetId: UniqueIdentifier
              ): (TreeItem & { title?: string }) | undefined => {
                for (const item of items) {
                  if (item.id === targetId) {
                    return item as TreeItem & { title?: string };
                  }
                  if (item.children.length > 0) {
                    const found = findItemWithTitle(item.children, targetId);
                    if (found) return found;
                  }
                }
                return undefined;
              };

              const originalItem = findItemWithTitle(items, id);
              return (
                <SortableTreeItem
                  key={id}
                  id={id}
                  value={id.toString()}
                  title={originalItem?.title}
                  depth={id === activeId && projected ? projected.depth : depth}
                  indentationWidth={indentationWidth}
                  indicator={indicator}
                  collapsed={originalItem?.collapsed || false}
                  isEditing={editingId === id}
                  onCollapse={
                    hasCollapse ? () => handleCollapse(id) : undefined
                  }
                  onRemove={removable ? () => handleRemove(id) : undefined}
                  onEdit={() => handleEdit(id)}
                  onAddChild={() => handleAddChild(id)}
                  onTitleChange={(newTitle) => handleTitleChange(id, newTitle)}
                />
              );
            }
          )
        )}
        {createPortal(
          <DragOverlay
            dropAnimation={dropAnimationConfig}
            modifiers={indicator ? [adjustTranslate] : undefined}
          >
            {activeId && activeItem ? (
              <SortableTreeItem
                id={activeId}
                depth={activeItem.depth}
                clone
                childCount={getChildCount(items, activeId) + 1}
                value={activeId.toString()}
                title={(() => {
                  const findItemWithTitle = (
                    items: TreeItems,
                    targetId: UniqueIdentifier
                  ): (TreeItem & { title?: string }) | undefined => {
                    for (const item of items) {
                      if (item.id === targetId) {
                        return item as TreeItem & { title?: string };
                      }
                      if (item.children.length > 0) {
                        const found = findItemWithTitle(
                          item.children,
                          targetId
                        );
                        if (found) return found;
                      }
                    }
                    return undefined;
                  };
                  return findItemWithTitle(items, activeId)?.title;
                })()}
                indentationWidth={indentationWidth}
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </DndContext>
  );

  function handleDragStart({ active: { id: activeId } }: DragStartEvent) {
    setActiveId(activeId);
    setOverId(activeId);

    const activeItem = flattenedItems.find(({ id }) => id === activeId);

    if (activeItem) {
      setCurrentPosition({
        parentId: activeItem.parentId,
        overId: activeId,
      });
    }

    document.body.style.setProperty("cursor", "grabbing");
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over?.id ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    resetState();

    if (projected && over) {
      const { depth, parentId } = projected;
      const clonedItems: FlattenedItem[] = JSON.parse(
        JSON.stringify(flattenTree(items))
      );
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];

      clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      const newItems = buildTree(sortedItems);

      setItems(newItems);
    }
  }

  function handleDragCancel() {
    resetState();
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);
    setCurrentPosition(null);

    document.body.style.setProperty("cursor", "");
  }

  function handleRemove(id: UniqueIdentifier) {
    setItems((items) => removeItem(items, id));
  }

  function handleCollapse(id: UniqueIdentifier) {
    setItems((items) => {
      const newItems = setProperty(items, id, "collapsed", (value) => {
        return !value;
      });
      return newItems;
    });
  }

  function handleEdit(id: UniqueIdentifier) {
    setEditingId(id);
    isEditingRef.current = true;
  }

  function handleTitleChange(id: UniqueIdentifier, newTitle: string) {
    setItems((items) => {
      const newItems = setProperty(items, id, "title", () => newTitle);
      return newItems;
    });
    setEditingId(null);
    isEditingRef.current = false;
  }

  function handleAddChild(parentId: UniqueIdentifier) {
    if (onAddChild) {
      // Use the parent callback to handle adding child accounts
      onAddChild(parentId);
    } else {
      // Fallback to internal logic if no callback provided
      const newId = Math.random().toString(36).slice(2);
      const newItem: TreeItem = {
        id: newId,
        children: [],
        title: "New Account",
      };

      setItems((items) => {
        const addChildToItem = (items: TreeItems): TreeItems => {
          return items.map((item) => {
            if (item.id === parentId) {
              return {
                ...item,
                children: [...item.children, newItem],
              };
            }
            if (item.children.length > 0) {
              return {
                ...item,
                children: addChildToItem(item.children),
              };
            }
            return item;
          });
        };
        return addChildToItem(items);
      });

      // Start editing the new item
      setTimeout(() => {
        setEditingId(newId);
      }, 100);
    }
  }

  function getMovementAnnouncement(
    eventName: string,
    activeId: UniqueIdentifier,
    overId?: UniqueIdentifier
  ) {
    if (overId && projected) {
      if (eventName !== "onDragEnd") {
        if (
          currentPosition &&
          projected.parentId === currentPosition.parentId &&
          overId === currentPosition.overId
        ) {
          return;
        } else {
          setCurrentPosition({
            parentId: projected.parentId,
            overId,
          });
        }
      }

      const clonedItems: FlattenedItem[] = JSON.parse(
        JSON.stringify(flattenTree(items))
      );
      const overIndex = clonedItems.findIndex(
        ({ id }: FlattenedItem) => id === overId
      );
      const activeIndex = clonedItems.findIndex(
        ({ id }: FlattenedItem) => id === activeId
      );
      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);

      const previousItem = sortedItems[overIndex - 1];

      let announcement;
      const movedVerb = eventName === "onDragEnd" ? "dropped" : "moved";
      const nestedVerb = eventName === "onDragEnd" ? "dropped" : "nested";

      if (!previousItem) {
        const nextItem = sortedItems[overIndex + 1];
        announcement = `${activeId} was ${movedVerb} before ${nextItem.id}.`;
      } else {
        if (projected.depth > previousItem.depth) {
          announcement = `${activeId} was ${nestedVerb} under ${previousItem.id}.`;
        } else {
          let previousSibling: FlattenedItem | undefined = previousItem;
          while (previousSibling && projected.depth < previousSibling.depth) {
            const parentId: UniqueIdentifier | null = previousSibling.parentId;
            previousSibling = sortedItems.find(({ id }) => id === parentId);
          }

          if (previousSibling) {
            announcement = `${activeId} was ${movedVerb} after ${previousSibling.id}.`;
          }
        }
      }

      return announcement;
    }

    return;
  }
}

const adjustTranslate: Modifier = ({ transform }) => {
  return {
    ...transform,
    y: transform.y - 25,
  };
};

export const CreateAccounts = forwardRef<
  CreateAccountsRef,
  CreateAccountsProps
>(({ onNext, selectedCompanyId }, ref) => {
  const saveMapping = useSaveMappings();
  const [selectedTab, setSelectedTab] = useState<string>(REPORT_TYPES[0].value);
  const [mappingData, setMappingData] = useState<Mapping>({});
  const [localMapping, setLocalMapping] = useState<Mapping>({});
  const [autoEditId, setAutoEditId] = useState<UniqueIdentifier | null>(null);

  const { data, isLoading, isError } = useMappingForAccountByType(
    selectedCompanyId,
    selectedTab
  );

  useEffect(() => {
    if (data?.data?.mapping) {
      setMappingData(data.data.mapping);
      // Set local mapping with the data from API
      setLocalMapping(data.data.mapping);
    }
  }, [data]);

  // Reset local mapping when report type changes
  useEffect(() => {
    // Clear autoEditId when report type changes
    setAutoEditId(null);
  }, [selectedTab]);

  // Handle report type change
  const handleReportTypeChange = (newReportType: string) => {
    setSelectedTab(newReportType);
  };

  // Convert mapping data to tree items for each column
  const getTreeItemsForColumn = (colKey: string): TreeItems => {
    const accounts = localMapping[colKey] || [];
    const treeItems = accounts.map((account) =>
      convertAccountToTreeItem(account, colKey)
    );
    return treeItems;
  };

  // Handle tree items change for a specific column
  const handleTreeItemsChange = (colKey: string, treeItems: TreeItems) => {
    // Always update the local mapping with the latest tree items
    const newAccounts = treeItems.map((treeItem) =>
      convertTreeItemToAccount(treeItem, colKey)
    );

    console.log(`Updating mapping for column ${colKey}:`, newAccounts);

    setLocalMapping((prev) => {
      const updated = {
        ...prev,
        [colKey]: newAccounts,
      };
      console.log("Updated local mapping:", updated);
      return updated;
    });

    // Clear autoEditId after successful update
    if (autoEditId) {
      setAutoEditId(null);
    }
  };

  // Add new root account
  const handleAddRootAccount = (colKey: string) => {
    const newAccountId = Math.random().toString(36).slice(2);
    const newAccount: Account = {
      account_id: newAccountId,
      realm_id: null,
      title: "New Account",
      children: [],
      mapped_account: [],
    };

    setLocalMapping((prev) => ({
      ...prev,
      [colKey]: prev[colKey] ? [...prev[colKey], newAccount] : [newAccount],
    }));

    // Set the auto-edit ID for the new item
    const treeItemId = `${colKey}-${newAccountId}`;
    setAutoEditId(treeItemId);
  };

  // Add new child account
  const handleAddChildAccount = (colKey: string, parentId: string) => {
    const newAccountId = Math.random().toString(36).slice(2);
    const newAccount: Account = {
      account_id: newAccountId,
      realm_id: null,
      title: "New Account",
      children: [],
      mapped_account: [],
    };

    setLocalMapping((prev) => {
      const addChildToAccount = (accounts: Account[]): Account[] => {
        return accounts.map((account) => {
          if (account.account_id === parentId) {
            return {
              ...account,
              children: [...account.children, newAccount],
            };
          }
          if (account.children.length > 0) {
            return {
              ...account,
              children: addChildToAccount(account.children),
            };
          }
          return account;
        });
      };

      return {
        ...prev,
        [colKey]: addChildToAccount(prev[colKey] || []),
      };
    });

    // Set the auto-edit ID for the new child item
    const treeItemId = `${colKey}-${newAccountId}`;
    setAutoEditId(treeItemId);
  };

  // Expose save functionality and loading state to parent component
  useImperativeHandle(
    ref,
    () => ({
      handleSave: async () => {
        return new Promise((resolve) => {
          // Ensure we have the most up-to-date mapping
          const currentMapping = { ...localMapping };

          const payload = {
            realm_id: selectedCompanyId,
            report_type: selectedTab,
            mapping: currentMapping,
          };

          console.log("Saving payload:", payload);

          saveMapping.mutate(payload, {
            onSuccess: () => {
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

  return (
    <>
      <div className="px-10 pt-8 bg-white shrink-0">
        <div className="flex-wrap bg-white border border-gray-200 rounded-2xl p-4 flex gap-8 items-end w-full minw-full mx-auto">
          {/* <div className="flex flex-col flex-1 max-w-56">
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
          </div> */}
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
            <div className="flex gap-6 w-max h-full pb-8">
              {(REPORT_TYPE_COLUMNS[selectedTab] || []).map((col) => (
                <ColumnContainer
                  key={`${selectedTab}-${col.key}`}
                  col={col}
                  onAddRootAccount={handleAddRootAccount}
                >
                  <SortableTree
                    key={`${selectedTab}-${col.key}-tree`}
                    collapsible
                    removable
                    defaultItems={getTreeItemsForColumn(col.key)}
                    onItemsChange={(items) =>
                      handleTreeItemsChange(col.key, items)
                    }
                    autoEditId={autoEditId}
                    onAddChild={(parentId) => {
                      // Extract the actual parent ID from the tree item ID
                      const actualParentId = parentId
                        .toString()
                        .replace(`${col.key}-`, "");
                      handleAddChildAccount(col.key, actualParentId);
                    }}
                  />
                </ColumnContainer>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
});
