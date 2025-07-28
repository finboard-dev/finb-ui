'use client';

import type React from 'react';

import { v4 as uuidv4 } from 'uuid';
import { type Layout, Responsive, WidthProvider } from 'react-grid-layout';
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { Block, BlockType, DashboardItem, DraggingBlock } from '../../types';
import { LayoutGridIcon, AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';
import MetricsCard from '../ui/MetricsCard';
import DynamicTable from '@/components/TableRenderer/DynamicTableRenderer';
import RestrictedChart from '@/components/visualizationV2/VisualizationRenderer';
import WidgetExecutionWrapper from './WidgetExecutionWrapper';
import { BlockTitleEditModal } from '../ui/BlockTitleEditModal';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardViewProps {
  className?: string;
  dashboardItems: DashboardItem[];
  setDashboardItems: (items: DashboardItem[] | ((prevItems: DashboardItem[]) => DashboardItem[])) => void;
  blocks: Block[];
  draggingBlock: DraggingBlock | null;
  isEditing: boolean;
  currentTabStartDate?: string;
  currentTabEndDate?: string;
  onBlockTitleUpdate?: (blockId: string, newTitle: string) => void;
}

const MARGIN: [number, number] = [8, 8];
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const GRID_GRANULARITY = 4;
const BREAKPOINT_COLS = {
  lg: 12 * GRID_GRANULARITY,
  md: 10 * GRID_GRANULARITY,
  sm: 6 * GRID_GRANULARITY,
  xs: 4 * GRID_GRANULARITY,
  xxs: 2 * GRID_GRANULARITY,
};
const ROW_HEIGHT = 20;
const MAX_DASHBOARD_HEIGHT = 2000; // Maximum height in pixels

function getMins(t: BlockType): { minW: number; minH: number } {
  const factor = GRID_GRANULARITY;
  switch (t) {
    case 'TABLE':
      return { minW: 3 * factor, minH: 2 * factor };
    case 'GRAPH':
      return { minW: 3 * factor, minH: 2 * factor };
    case 'KPI':
      return { minW: 2 * factor, minH: 1 * factor };
    default:
      return { minW: 2 * factor, minH: 1 * factor };
  }
}

function getDefaults(t: BlockType): { w: number; h: number } {
  const factor = GRID_GRANULARITY;
  switch (t) {
    case 'TABLE':
      return { w: 4 * factor, h: 3 * factor };
    case 'GRAPH':
      return { w: 4 * factor, h: 3 * factor };
    case 'KPI':
      return { w: 2 * factor, h: 1 * factor };
    default:
      return { w: 3 * factor, h: 2 * factor };
  }
}

// Helper function to check if two rectangles overlap
function rectanglesOverlap(
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number }
): boolean {
  return !(
    rect1.x + rect1.w <= rect2.x ||
    rect2.x + rect2.w <= rect1.x ||
    rect1.y + rect1.h <= rect2.y ||
    rect2.y + rect2.h <= rect1.y
  );
}

// Helper function to find the next available position for a new item
function findAvailablePosition(
  newItem: { x: number; y: number; w: number; h: number },
  existingItems: DashboardItem[],
  maxCols: number
): { x: number; y: number } {
  // If no existing items, place at the drop position
  if (existingItems.length === 0) {
    console.log('No existing items, placing at drop position:', { x: newItem.x, y: newItem.y });
    return { x: newItem.x, y: newItem.y };
  }

  let position = { x: newItem.x, y: newItem.y };
  let attempts = 0;
  const maxAttempts = 200; // Increased to handle more complex layouts

  // First, try the exact position where the user dropped
  const hasCollisionAtDrop = existingItems.some((item) =>
    rectanglesOverlap(
      { x: position.x, y: position.y, w: newItem.w, h: newItem.h },
      { x: item.x, y: item.y, w: item.w, h: item.h }
    )
  );

  if (!hasCollisionAtDrop) {
    console.log('Item placed at drop position:', position);
    return position;
  }

  // If there's a collision, find the next available position
  while (attempts < maxAttempts) {
    // Check if the current position is available
    const hasCollision = existingItems.some((item) =>
      rectanglesOverlap(
        { x: position.x, y: position.y, w: newItem.w, h: newItem.h },
        { x: item.x, y: item.y, w: item.w, h: item.h }
      )
    );

    if (!hasCollision) {
      console.log('Item placed at found position:', position, 'after', attempts, 'attempts');
      return position;
    }

    // Try moving down first
    position.y += 1;

    // If we've moved too far down, try moving to the right
    if (position.y > 100) {
      position.y = 0;
      position.x += 1;

      // If we've moved too far right, wrap to the next row
      if (position.x + newItem.w > maxCols) {
        position.x = 0;
        position.y += 1;
      }
    }

    attempts++;
  }

  // If we can't find a position, place it at the bottom
  const maxY = Math.max(...existingItems.map((item) => item.y + item.h), 0);
  const fallbackPosition = { x: 0, y: maxY };
  console.log('Item placed at fallback position:', fallbackPosition);
  return fallbackPosition;
}

function generateBackgroundPattern(
  gridWidth: number,
  rowHeight: number,
  marginH: number,
  marginV: number,
  cols: number
): string {
  if (gridWidth <= 0 || cols <= 0 || rowHeight <= 0) return '';
  const cellWidth = (gridWidth - marginH * (cols + 1)) / cols;
  const cellHeight = rowHeight;
  const dots = [];
  const numVerticalCellsToDraw = Math.max(20, Math.ceil(1200 / (cellHeight + marginV)) + 2);

  for (let y = 0; y < numVerticalCellsToDraw; y++) {
    for (let x = 0; x < cols + 1; x++) {
      const dotX = x * (cellWidth + marginH) + marginH;
      const dotY = y * (cellHeight + marginV) + marginV;
      dots.push(`<circle cx="${dotX}" cy="${dotY}" r="1" fill="#e2e8f0" />`);
    }
  }
  const svgHeight = numVerticalCellsToDraw * (cellHeight + marginV) + marginV;
  const svgWidth = gridWidth;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">${dots.join(
    ''
  )}</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

export default function DashboardView({
  className,
  dashboardItems,
  setDashboardItems,
  blocks,
  draggingBlock,
  isEditing,
  currentTabStartDate,
  currentTabEndDate,
  onBlockTitleUpdate,
}: DashboardViewProps) {
  const [dragOverIndicator, setDragOverIndicator] = useState(false);
  const [editingBlock, setEditingBlock] = useState<{ id: string; title: string } | null>(null);
  const [currentGridWidth, setCurrentGridWidth] = useState(BREAKPOINTS.lg);
  const [currentCols, setCurrentCols] = useState(BREAKPOINT_COLS.lg);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHeight, setResizeHeight] = useState<number | null>(null);
  const rglRef = useRef<any>(null);

  // Debug dragging block dimensions
  useEffect(() => {
    if (draggingBlock) {
      console.log('Dragging block changed:', {
        id: draggingBlock.id,
        type: draggingBlock.type,
        width: draggingBlock.width,
        height: draggingBlock.height,
      });

      const blockToAdd = blocks.find((b) => b.id === draggingBlock.id);
      if (blockToAdd) {
        const defaultSize = getDefaults(blockToAdd.type);
        console.log('Expected placeholder size:', defaultSize);
      }
    }
  }, [draggingBlock, blocks]);

  const layout = useMemo(
    () =>
      dashboardItems.map((item) => {
        const block = blocks.find((b) => b.id === item.blockId);
        const mins = block ? getMins(block.type) : { minW: 2, minH: 1 };

        return {
          i: item.id,
          x: item.x,
          y: item.y,
          w: Math.max(item.w, mins.minW),
          h: Math.max(item.h, mins.minH),
          minW: mins.minW,
          minH: mins.minH,
          isDraggable: isEditing,
          isResizable: isEditing,
        };
      }),
    [dashboardItems, blocks, isEditing]
  );

  // Calculate dynamic height based on layout content with maximum limit
  const dynamicHeight = useMemo(() => {
    if (layout.length === 0) return 'calc(100vh - 115px)';

    // Use resize height if currently resizing, otherwise calculate from layout
    if (isResizing && resizeHeight !== null) {
      const limitedHeight = Math.min(resizeHeight, MAX_DASHBOARD_HEIGHT);
      return `${limitedHeight}px`;
    }

    // Find the bottommost item in the layout
    const maxY = Math.max(...layout.map((item) => item.y + item.h));
    const calculatedHeight = (maxY + 2) * (ROW_HEIGHT + MARGIN[1]) + MARGIN[1];

    // Limit the height to prevent infinite growth
    const limitedHeight = Math.min(calculatedHeight, MAX_DASHBOARD_HEIGHT);

    return `${limitedHeight}px`;
  }, [layout, isResizing, resizeHeight]);

  const onLayoutChange = useCallback(
    (newLayout: Layout[], allLayouts: Record<string, Layout[]>) => {
      const hasChanges = newLayout.some((newItem) => {
        const oldItem = dashboardItems.find((item) => item.id === newItem.i);
        return (
          !oldItem ||
          oldItem.x !== newItem.x ||
          oldItem.y !== newItem.y ||
          oldItem.w !== newItem.w ||
          oldItem.h !== newItem.h
        );
      });

      if (hasChanges && isEditing) {
        const updatedItems = dashboardItems
          .map((item) => {
            const layoutItem = newLayout.find((l) => l.i === item.id);
            if (!layoutItem) return item;

            const block = blocks.find((b) => b.id === item.blockId);
            const mins = block ? getMins(block.type) : { minW: 2, minH: 1 };

            return {
              ...item,
              x: layoutItem.x,
              y: layoutItem.y,
              w: Math.max(layoutItem.w, mins.minW),
              h: Math.max(layoutItem.h, mins.minH),
              minW: mins.minW,
              minH: mins.minH,
            };
          })
          .filter(Boolean) as DashboardItem[];
        setDashboardItems(updatedItems);
      }
    },
    [dashboardItems, setDashboardItems, blocks, isEditing]
  );

  const onDeleteItem = useCallback(
    (idToDelete: string) => {
      setDashboardItems((prevItems: DashboardItem[]) => prevItems.filter((item) => item.id !== idToDelete));
      toast.success('Component removed from dashboard.');
    },
    [setDashboardItems]
  );

  const handleEditBlock = useCallback((blockId: string, currentTitle: string) => {
    setEditingBlock({ id: blockId, title: currentTitle });
  }, []);

  const handleSaveBlockTitle = useCallback(
    (newTitle: string) => {
      if (editingBlock && onBlockTitleUpdate) {
        onBlockTitleUpdate(editingBlock.id, newTitle);
      }
      setEditingBlock(null);
    },
    [editingBlock, onBlockTitleUpdate]
  );

  const handleCloseEditModal = useCallback(() => {
    setEditingBlock(null);
  }, []);

  const onDrop = useCallback(
    (gridLayout: Layout[], layoutItem: Layout, event: DragEvent) => {
      event.preventDefault();
      setDragOverIndicator(false);
      const blockTemplateId = event.dataTransfer?.getData('text/plain');

      console.log('Drop event:', {
        blockTemplateId,
        draggingBlock,
        totalBlocks: blocks.length,
        blockIds: blocks.map((b) => b.id),
        layoutItem,
      });

      if (!blockTemplateId || !draggingBlock || draggingBlock.id !== blockTemplateId) {
        console.warn('Mismatched or missing drag data for drop.');
        return;
      }
      const blockToAdd = blocks.find((b) => b.id === blockTemplateId);

      console.log(
        'Found block to add:',
        blockToAdd
          ? {
              id: blockToAdd.id,
              title: blockToAdd.title,
              type: blockToAdd.type,
              hasContent: !!blockToAdd.content,
            }
          : null
      );

      if (!blockToAdd) {
        toast.error(`Component (ID: ${blockTemplateId}) definition not found.`);
        return;
      }

      const defaultSize = getDefaults(blockToAdd.type);
      const mins = getMins(blockToAdd.type);
      const colsForCurrentBreakpoint = currentCols || BREAKPOINT_COLS.lg;

      // Find available position for the new item
      const initialPosition = {
        x: Math.max(0, Math.min(layoutItem.x, colsForCurrentBreakpoint - defaultSize.w)),
        y: layoutItem.y,
        w: defaultSize.w,
        h: defaultSize.h,
      };

      console.log('Initial drop position:', initialPosition);
      console.log('Current dashboard items:', dashboardItems);

      const availablePosition = findAvailablePosition(initialPosition, dashboardItems, colsForCurrentBreakpoint);

      const newItemId = uuidv4();
      const newItem: DashboardItem = {
        id: newItemId,
        blockId: blockToAdd.id,
        x: availablePosition.x,
        y: availablePosition.y,
        w: defaultSize.w,
        h: defaultSize.h,
        minW: mins.minW,
        minH: mins.minH,
      };

      console.log('Adding new item:', newItem);

      setDashboardItems((prevItems: DashboardItem[]) => [...prevItems, newItem]);
      toast.success(`"${blockToAdd.title}" added to dashboard!`);
    },
    [draggingBlock, blocks, currentCols, setDashboardItems, dashboardItems]
  );

  // Handle drop drag over to set placeholder size
  const onDropDragOver = useCallback(
    (event: any) => {
      if (!draggingBlock) {
        console.log('No dragging block, using default placeholder size');
        return { w: 4, h: 4 };
      }

      const blockToAdd = blocks.find((b) => b.id === draggingBlock.id);
      if (!blockToAdd) {
        console.log('Block not found, using default placeholder size');
        return { w: 4, h: 4 };
      }

      const defaultSize = getDefaults(blockToAdd.type);
      console.log('Setting placeholder size for', blockToAdd.type, ':', defaultSize);
      console.log('Block details:', {
        id: blockToAdd.id,
        title: blockToAdd.title,
        type: blockToAdd.type,
        defaultSize,
      });

      return defaultSize;
    },
    [draggingBlock, blocks]
  );

  const handleDragOverWrapper = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (draggingBlock && isEditing) setDragOverIndicator(true);
    },
    [draggingBlock, isEditing]
  );

  const handleDragLeaveWrapper = useCallback(() => setDragOverIndicator(false), []);
  const handleDropOnWrapper = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverIndicator(false);
  }, []);

  const onWidthChange = useCallback((containerWidth: number, margin: [number, number], cols: number) => {
    setCurrentGridWidth(containerWidth);
    setCurrentCols(cols);
  }, []);

  const onBreakpointChange = useCallback((newBreakpoint: string, newCols: number) => setCurrentCols(newCols), []);

  // Handle resize start
  const onResizeStart = useCallback(
    (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
      setIsResizing(true);
    },
    []
  );

  // Handle resize during drag with height limiting
  const onResize = useCallback(
    (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
      if (!isResizing) return;

      // Calculate the new height based on the current layout during resize
      const maxY = Math.max(...layout.map((item) => item.y + item.h));
      const calculatedHeight = (maxY + 2) * (ROW_HEIGHT + MARGIN[1]) + MARGIN[1];

      // Limit the height to prevent infinite growth
      const limitedHeight = Math.min(calculatedHeight, MAX_DASHBOARD_HEIGHT);
      setResizeHeight(limitedHeight);
    },
    [isResizing]
  );

  // Handle resize stop
  const onResizeStop = useCallback(
    (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
      setIsResizing(false);
      setResizeHeight(null);
    },
    []
  );

  const gridElementChildren = useMemo(
    () =>
      layout.map((itemLayout) => {
        const dashboardItem = dashboardItems.find((di) => di.id === itemLayout.i);
        const blockTemplate = blocks.find((b) => b.id === dashboardItem?.blockId);

        console.log('Rendering dashboard item:', {
          itemId: dashboardItem?.id,
          blockId: dashboardItem?.blockId,
          blockTemplate: blockTemplate
            ? {
                id: blockTemplate.id,
                title: blockTemplate.title,
                type: blockTemplate.type,
                hasContent: !!blockTemplate.content,
                contentType: typeof blockTemplate.content,
              }
            : null,
          totalBlocks: blocks.length,
        });

        if (!dashboardItem || !blockTemplate) {
          return (
            <div
              key={itemLayout.i}
              className="w-full h-full flex flex-col items-center justify-center text-red-600 p-2 bg-red-50 rounded-md border border-red-200"
            >
              <AlertTriangleIcon className="w-6 h-6 mb-1" />
              <span className="text-xs font-semibold">Component missing</span>
            </div>
          );
        }

        return (
          <div key={itemLayout.i} className="react-grid-item group/item outline-none focus:outline-none relative">
            <WidgetExecutionWrapper
              block={blockTemplate}
              currentTabStartDate={currentTabStartDate || '2024-01-01'}
              currentTabEndDate={currentTabEndDate || '2024-12-31'}
              className="h-full w-full"
              showDragHandle={isEditing}
              dragHandleProps={{ className: 'drag-handle' }}
              showMenu={isEditing}
              onDelete={() => onDeleteItem(itemLayout.i)}
              onEdit={() => handleEditBlock(blockTemplate.id, blockTemplate.title)}
              onDuplicate={() => toast.info(`Duplicate for "${blockTemplate?.title || 'component'}" TBD.`)}
            >
              {(executionData) => (
                <>
                  {blockTemplate.type === 'GRAPH' && (
                    <RestrictedChart
                      data={executionData || {}}
                      title={blockTemplate.title}
                      subtitle={blockTemplate.subtitle}
                      showDragHandle={isEditing}
                      dragHandleProps={{ className: 'drag-handle' }}
                      showMenu={isEditing}
                      onDelete={() => onDeleteItem(itemLayout.i)}
                      onEdit={() => handleEditBlock(blockTemplate.id, blockTemplate.title)}
                      onDuplicate={() => toast.info(`Duplicate for "${blockTemplate?.title || 'component'}" TBD.`)}
                      className="h-full w-full"
                      style={{ borderRadius: isEditing ? '0px' : '6px' }}
                    />
                  )}
                  {blockTemplate.type === 'TABLE' && (
                    <DynamicTable
                      data={executionData || ''}
                      title={blockTemplate.title}
                      showDragHandle={isEditing}
                      dragHandleProps={{ className: 'drag-handle' }}
                      showMenu={isEditing}
                      onDelete={() => onDeleteItem(itemLayout.i)}
                      onEdit={() => handleEditBlock(blockTemplate.id, blockTemplate.title)}
                      onDuplicate={() => toast.info(`Duplicate for "${blockTemplate?.title || 'component'}" TBD.`)}
                      className="h-full w-full"
                      style={{ borderRadius: isEditing ? '0px' : '6px' }}
                    />
                  )}
                  {blockTemplate.type === 'KPI' && (
                    <MetricsCard
                      title={blockTemplate.title}
                      value={executionData?.value || 0}
                      change={executionData?.change || 0}
                      changeLabel={executionData?.changeLabel || ''}
                      showDragHandle={isEditing}
                      dragHandleProps={{ className: 'drag-handle' }}
                      showMenu={isEditing}
                      onDelete={() => onDeleteItem(itemLayout.i)}
                      onEdit={() => handleEditBlock(blockTemplate.id, blockTemplate.title)}
                      onDuplicate={() => toast.info(`Duplicate for "${blockTemplate?.title || 'component'}" TBD.`)}
                      className="h-full w-full"
                      style={{
                        borderRadius: isEditing ? '0px' : '6px',
                      }}
                    />
                  )}
                </>
              )}
            </WidgetExecutionWrapper>
          </div>
        );
      }),
    [layout, dashboardItems, blocks, onDeleteItem, isEditing, handleEditBlock]
  );

  const backgroundStyle =
    isEditing && currentGridWidth > 0 && currentCols > 0
      ? {
          backgroundImage: generateBackgroundPattern(currentGridWidth, ROW_HEIGHT, MARGIN[0], MARGIN[1], currentCols),
          backgroundRepeat: 'repeat',
          backgroundPosition: `${MARGIN[0]}px ${MARGIN[1]}px`,
          height: dynamicHeight,
        }
      : { height: dynamicHeight, background: isEditing ? '#f8fafc' : '#f1f5f9' };

  return (
    <div
      className={cn(
        'dashboard-view-container transition-all duration-300 relative',
        'overflow-visible',
        className,
        dragOverIndicator &&
          isEditing &&
          'outline-dashed outline-2 outline-offset-[-2px] outline-blue-500 bg-blue-100/50',
        !isEditing && 'p-1 bg-slate-100',
        isResizing && 'resizing'
      )}
      onDragOver={handleDragOverWrapper}
      onDragLeave={handleDragLeaveWrapper}
      onDrop={handleDropOnWrapper}
      style={{ height: dynamicHeight }}
    >
      {/* Custom CSS for 8-pixel increment resize */}
      {isEditing && (
        <style jsx>{`
          .react-resizable-handle {
            transition: all 0.1s ease;
          }
          .react-resizable-handle:hover {
            background-color: rgba(59, 130, 246, 0.3);
          }
          /* Make resize more responsive to smaller movements */
          .react-grid-item {
            transition: none !important;
          }
          .react-grid-item.resizing {
            transition: none !important;
          }
          /* Smooth height transitions for the container */
          .dashboard-view-container {
            transition: height 0.1s ease-out;
            overflow: visible !important;
          }

          /* Faster transitions during resize for real-time feedback */
          .dashboard-view-container.resizing {
            transition: height 0.05s ease-out !important;
          }
        `}</style>
      )}
      <ResponsiveGridLayout
        ref={rglRef}
        layouts={{ lg: layout }}
        breakpoints={BREAKPOINTS}
        cols={BREAKPOINT_COLS}
        rowHeight={ROW_HEIGHT}
        margin={MARGIN}
        containerPadding={isEditing ? [MARGIN[0], MARGIN[1]] : [0, 0]}
        onLayoutChange={onLayoutChange}
        onWidthChange={onWidthChange}
        onBreakpointChange={onBreakpointChange}
        onResizeStart={onResizeStart}
        onResize={onResize}
        onResizeStop={onResizeStop}
        isDraggable={isEditing}
        isResizable={isEditing}
        isDroppable={isEditing}
        onDrop={onDrop}
        onDropDragOver={onDropDragOver}
        resizeHandles={isEditing ? ['se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's'] : []}
        draggableHandle=".drag-handle"
        draggableCancel=".rgl-no-drag, input, textarea, button, select"
        className={cn('min-h-full custom-grid-layout', !isEditing && 'dashboard-view-mode')}
        style={backgroundStyle}
        useCSSTransforms={true}
        measureBeforeMount={false}
        compactType="vertical"
        preventCollision={false}
      >
        {gridElementChildren}
      </ResponsiveGridLayout>
      {dashboardItems.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-base pointer-events-none p-10 text-center">
          <LayoutGridIcon className="w-16 h-16 text-slate-300 mb-4" />
          <span>{isEditing ? 'Your dashboard is empty.' : 'This dashboard is currently empty.'}</span>
          <span className="text-sm">
            {isEditing
              ? 'Drag components from the right panel to get started.'
              : 'Switch to Edit Mode to add components.'}
          </span>
        </div>
      )}

      {/* Block Title Edit Modal */}
      {editingBlock && (
        <BlockTitleEditModal
          isOpen={!!editingBlock}
          onClose={handleCloseEditModal}
          onSave={handleSaveBlockTitle}
          currentTitle={editingBlock.title}
          blockId={editingBlock.id}
        />
      )}
    </div>
  );
}
