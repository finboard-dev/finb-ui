'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, Loader2 } from 'lucide-react';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import {
  LayoutGridIcon,
  Rows3Icon,
  GripVerticalIcon,
  ComponentIcon,
  TrendingUpIcon,
  BarChart3Icon,
} from 'lucide-react';
import { useAppSelector } from '@/lib/store/hooks';
import { selectSelectedOrganization, selectSelectedCompany } from '@/lib/store/slices/userSlice';
import { useComponentMetrics } from '@/hooks/query-hooks/useComponentMetrics';

import type { Block, DraggingBlock } from '../../types';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { log } from 'vega';

// (BlockListItem sub-component remains the same as in the original file)
interface BlockListItemProps {
  block: Block;
  onDragStart: (draggingBlock: DraggingBlock) => void;
}

function BlockListItem({ block, onDragStart }: BlockListItemProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const renderPreview = (b: Block) => {
    // This preview logic remains unchanged
    const isValidPreviewImage = b.previewImage && b.previewImage.startsWith('data:image/');
    if (isValidPreviewImage) {
      return (
        <div className="w-full h-32 bg-slate-100 group-hover:bg-slate-200 transition-colors rounded-t-md overflow-hidden relative border-b border-slate-200">
          <img src={b.previewImage} alt={b.title || 'Component Preview'} className="w-full h-full object-contain p-2" />
        </div>
      );
    }

    console.log('b', block);

    // For tables, show a preview of the HTML table if available
    if (b.type === 'TABLE' && b.htmlTable) {
      return (
        <div className="w-full h-32 bg-slate-100 group-hover:bg-slate-200 transition-colors rounded-t-md overflow-hidden relative border-b border-slate-200">
          <div
            className="w-full h-full p-1 overflow-hidden"
            style={{
              transform: 'scale(0.85)',
              transformOrigin: 'top left',
              width: '117.6%', // Compensate for scale (100% / 0.85)
              height: '117.6%', // Compensate for scale (100% / 0.85)
            }}
            dangerouslySetInnerHTML={{
              __html: b.htmlTable
                .replace(
                  /<table/g,
                  '<table style="width: 100%; max-width: 100%; font-size: 8px; border-collapse: collapse; table-layout: fixed;"'
                )
                .replace(
                  /<th/g,
                  '<th style="padding: 1px 2px; border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: 600; text-align: left; overflow: hidden; text-overflow: ellipsis; word-wrap: break-word; font-size: 8px;"'
                )
                .replace(
                  /<td/g,
                  '<td style="padding: 1px 2px; border: 1px solid #e5e7eb; overflow: hidden; text-overflow: ellipsis; word-wrap: break-word; font-size: 8px;"'
                ),
            }}
          />
        </div>
      );
    }

    let icon = <ComponentIcon className="w-10 h-10 text-slate-400" />;
    if (b.type === 'GRAPH') icon = <LayoutGridIcon className="w-10 h-10 text-slate-400" />;
    else if (b.type === 'TABLE') icon = <Rows3Icon className="w-10 h-10 text-slate-400" />;
    else if (b.type === 'KPI') icon = <TrendingUpIcon className="w-10 h-10 text-slate-400" />;

    return (
      <div className="w-full h-32 bg-slate-100 group-hover:bg-slate-200 transition-colors rounded-t-md flex flex-col items-center justify-center text-slate-500 p-2 text-center border-b border-slate-200 overflow-hidden">
        {icon}
        <span className="text-xs mt-2 line-clamp-2 w-full">{b.title || 'Untitled Component'}</span>
        <span className="text-xs text-slate-400 mt-1">(Preview N/A)</span>
      </div>
    );
  };

  const onDragStartHandler = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const rect = blockRef.current?.getBoundingClientRect();
      const width = rect?.width && rect.width > 50 ? rect.width : 300;
      const height = rect?.height && rect.height > 50 ? rect.height : 180;
      event.dataTransfer.setData('text/plain', block.id);
      event.dataTransfer.effectAllowed = 'copy';

      // For tables, pass the html_table as content
      const dragData = {
        id: block.id,
        type: block.type,
        width,
        height,
        htmlTable: block.htmlTable, // Pass HTML table data for table renderer
      };

      onDragStart(dragData);
      setIsDragging(true);
    },
    [block.id, block.type, block.htmlTable, onDragStart]
  );

  const onDragEnd = useCallback(() => setIsDragging(false), []);

  return (
    <Card
      ref={blockRef}
      className={cn(
        'mb-3 w-full max-w-full bg-white hover:shadow-xl transition-all duration-200 group relative border-gray-200 hover:border-blue-500/50 overflow-hidden py-0',
        isDragging ? 'opacity-60 ring-2 ring-blue-600 scale-95 shadow-2xl' : 'shadow-md',
        'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-grab'
      )}
      draggable={true}
      onDragStart={onDragStartHandler}
      onDragEnd={onDragEnd}
      tabIndex={0}
      aria-label={`Drag component: ${block.title}`}
    >
      {renderPreview(block)}
      <CardHeader className="p-3 px-3 py-3">
        <div className="flex justify-between items-center w-full min-w-0 gap-2">
          <CardTitle
            className="text-sm font-semibold text-gray-800 truncate flex-1 min-w-0"
            title={block.title || 'Untitled'}
          >
            {block.title || 'Untitled'}
          </CardTitle>
          <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-sm text-slate-600 border border-slate-200 flex-shrink-0 capitalize whitespace-nowrap">
            {block.type}
          </span>
        </div>
      </CardHeader>
      <div
        className={cn(
          'absolute inset-0 bg-blue-600/5 group-hover:bg-blue-500/10 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-lg group-focus-visible:opacity-100',
          isDragging && 'opacity-100 bg-blue-500/20'
        )}
        aria-hidden="true"
      >
        <div className="text-white bg-blue-600 shadow-lg px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 pointer-events-none">
          <GripVerticalIcon className="w-4 h-4" />
          Drag to dashboard
        </div>
      </div>
    </Card>
  );
}

interface DashboardControlsProps {
  blocks: Block[];
  setBlocks: (blocksUpdater: (prevBlocks: Block[]) => Block[]) => void;
  onDragStart: (draggingBlock: DraggingBlock) => void;
  onApiComponentsLoaded?: (components: Block[]) => void;
  onMetricsLoadingChange?: (loading: boolean) => void;
  onMetricsLoaded?: () => void;
  onMetricsError?: () => void;
  currentTabStartDate?: string;
  currentTabEndDate?: string;
}

export default function DashboardControls({
  blocks,
  onDragStart,
  onApiComponentsLoaded,
  onMetricsLoadingChange,
  onMetricsLoaded,
  onMetricsError,
  currentTabStartDate,
  currentTabEndDate,
}: DashboardControlsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewFilter, setActiveViewFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('my-components');
  const [globalComponents, setGlobalComponents] = useState<Block[]>([]);
  const [myComponents, setMyComponents] = useState<Block[]>([]);
  const [loadingGlobalComponents, setLoadingGlobalComponents] = useState(false);

  // Get organization and company data from Redux
  const selectedOrganization = useAppSelector(selectSelectedOrganization);
  const selectedCompany = useAppSelector(selectSelectedCompany);

  console.log('Redux state:', {
    selectedOrganization: selectedOrganization?.id,
    selectedCompany: selectedCompany?.id,
    hasOrg: !!selectedOrganization,
    hasCompany: !!selectedCompany,
  });

  // Use React Query hook for component metrics
  const {
    data: metricsResponse,
    isLoading: isLoadingMetrics,
    error: metricsError,
    refetch: refetchMetrics,
  } = useComponentMetrics(
    selectedOrganization?.id || '',
    selectedCompany?.id || '',
    !!selectedOrganization?.id && !!selectedCompany?.id
  );

  // Process metrics data when it changes
  useEffect(() => {
    if (metricsResponse?.success && metricsResponse?.data) {
      console.log('Processing metrics response:', {
        success: metricsResponse.success,
        dataLength: metricsResponse.data?.length,
        data: metricsResponse.data,
      });

      // Transform API response to Block format and separate by scope
      const globalBlocks: Block[] = [];
      const myBlocks: Block[] = [];

      metricsResponse.data.forEach((metric: any) => {
        console.log('Processing metric:', {
          refId: metric.refId,
          title: metric.title,
          scopeLevel: metric.scopeLevel,
          refType: metric.refType,
          hasOutput: !!metric.output,
        });

        const block: Block = {
          id: metric.refId || `metric-${Date.now()}-${Math.random()}`,
          title: metric.title || 'Untitled Metric',
          subtitle: metric.description || '',
          type: getComponentType(metric), // Use smart type detection
          filter: {}, // No filter in new structure
          // Map the content properly based on type
          content: metric.output || '',
          previewImage: undefined, // No preview image in new structure
          // Add the html_table for table rendering
          htmlTable: metric.output,
          scopeLevel: metric.scopeLevel?.toLowerCase() || 'company',
          refVersion: metric.refVersion, // Include refVersion from API
          refType: metric.refType, // Include refType from API
        };

        console.log('Created block:', {
          title: block.title,
          type: block.type,
          scopeLevel: block.scopeLevel,
          hasContent: !!block.content,
          contentType: typeof block.content,
          contentPreview:
            typeof block.content === 'string'
              ? block.content.substring(0, 100) + '...'
              : JSON.stringify(block.content).substring(0, 100) + '...',
        });

        // Separate by scope level
        if (metric.scopeLevel?.toLowerCase() === 'global') {
          console.log('Adding to global blocks:', block.title);
          globalBlocks.push(block);
        } else {
          console.log('Adding to my blocks:', block.title);
          myBlocks.push(block);
        }
      });

      console.log('Final counts:', {
        globalBlocks: globalBlocks.length,
        myBlocks: myBlocks.length,
        totalFromAPI: metricsResponse.data.length,
      });

      setGlobalComponents(globalBlocks);
      setMyComponents(myBlocks);

      // Notify parent component about all available components
      const allApiComponents = [...globalBlocks, ...myBlocks];
      if (onApiComponentsLoaded) {
        onApiComponentsLoaded(allApiComponents);
      }

      // Notify parent that metrics are loaded
      onMetricsLoaded?.();
    }
  }, [metricsResponse]); // Remove callback dependencies to prevent infinite loops

  // Handle loading state
  useEffect(() => {
    setLoadingGlobalComponents(isLoadingMetrics);
    onMetricsLoadingChange?.(isLoadingMetrics);
  }, [isLoadingMetrics]); // Remove callback dependency to prevent infinite loops

  // Handle error state
  useEffect(() => {
    if (metricsError) {
      console.error('Error fetching components:', metricsError);
      console.error('Error details:', {
        message: metricsError?.message,
        response: metricsError?.response,
        status: metricsError?.response?.status,
        data: metricsError?.response?.data,
      });

      // Only show toast for non-cancellation errors
      if (metricsError?.code !== 'ERR_CANCELED' && !metricsError?.message?.includes('canceled')) {
        toast.error('Failed to fetch components from API');
      }

      onMetricsError?.();
    }
  }, [metricsError]); // Remove callback dependency to prevent infinite loops

  // Log component mount and Redux state changes
  useEffect(() => {
    console.log('DashboardControls mounted/updated:', {
      activeTab,
      orgId: selectedOrganization?.id,
      companyId: selectedCompany?.id,
      hasOrg: !!selectedOrganization,
      hasCompany: !!selectedCompany,
    });
  }, [selectedOrganization, selectedCompany]);

  // React Query handles the API calls automatically when org/company changes

  // Helper function to detect if content is a table
  const isTableContent = (content: any): boolean => {
    if (typeof content === 'string') {
      return content.includes('<table') || content.includes('<tr') || content.includes('<td');
    }
    return false;
  };

  // Helper function to determine component type
  const getComponentType = (metric: any): 'KPI' | 'GRAPH' | 'TABLE' => {
    // If it has output with table HTML, it's a table
    if (metric.output && metric.output.includes('<table')) {
      return 'TABLE';
    }

    // If it has refType that indicates graph, it's a graph
    if (metric.refType && metric.refType.toLowerCase().includes('graph')) {
      return 'GRAPH';
    }

    // Default to KPI
    return 'KPI';
  };

  // Filtering logic based on search and type filters
  const filterAndSearchBlocks = (blocksToFilter: Block[]): Block[] => {
    let filtered = blocksToFilter;
    console.log('Filtering blocks:', {
      totalBlocks: blocksToFilter.length,
      activeViewFilter,
      searchQuery,
      blockTypes: blocksToFilter.map((b) => ({ title: b.title, type: b.type })),
    });

    if (activeViewFilter) {
      if (activeViewFilter === 'metric') {
        // Show both KPI and TABLE types under "Metric" filter
        filtered = filtered.filter((b) => b.type === 'KPI' || b.type === 'TABLE');
        console.log('After metric filter:', filtered.length);
      } else if (activeViewFilter === 'graph') {
        // Show GRAPH types under "Graph" filter
        filtered = filtered.filter((b) => b.type === 'GRAPH');
        console.log('After graph filter:', filtered.length);
      } else {
        filtered = filtered.filter((b) => b.type === activeViewFilter);
        console.log('After type filter:', filtered.length);
      }
    }

    if (searchQuery) {
      filtered = filtered.filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
      console.log('After search filter:', filtered.length);
    }

    return filtered;
  };

  // Use only API-loaded components for the my-components tab
  const allMyComponents = [...myComponents];
  const displayComponents = filterAndSearchBlocks(allMyComponents);
  const displayGlobalComponents = filterAndSearchBlocks(globalComponents);

  console.log('Display state:', {
    activeTab,
    activeViewFilter,
    searchQuery,
    globalComponentsCount: globalComponents.length,
    myComponentsCount: myComponents.length,
    displayGlobalComponentsCount: displayGlobalComponents.length,
    displayComponentsCount: displayComponents.length,
  });

  if (!isOpen) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-30">
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="bg-white rounded-l-lg rounded-r-none px-2 py-6 text-sm text-slate-600 hover:bg-slate-50 border-slate-300 shadow-lg flex flex-col items-center h-auto gap-1 hover:border-slate-400"
          aria-label="Show components panel"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span className="[writing-mode:vertical-rl] transform rotate-180 text-xs font-medium tracking-wider uppercase">
            Components
          </span>
        </Button>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        'w-[320px] md:w-[360px] h-[calc(100vh-110px)] bg-white border-l border-gray-200 flex flex-col shadow-2xl z-10 fixed right-0 top-[110px] overflow-hidden'
      )}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow min-h-0">
        <div className="p-3 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-components" className="text-xs">
                My Components
              </TabsTrigger>
              <TabsTrigger value="global-components" className="text-xs">
                Global Components
              </TabsTrigger>
            </TabsList>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-slate-700 hover:bg-gray-100 p-1.5 rounded-md ml-2 flex-shrink-0"
              aria-label="Hide components panel"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </Button>
          </div>

          <div className="relative mb-2.5">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sec pointer-events-none" />
            <Input
              type="text"
              placeholder="Find by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 h-9 border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 bg-white placeholder-sec"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 items-center justify-start w-full min-w-0">
            {[
              { label: 'Metric', value: 'metric', icon: TrendingUpIcon },
              { label: 'Graph', value: 'graph', icon: LayoutGridIcon },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={activeViewFilter === filter.value ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setActiveViewFilter((prev) => (prev === filter.value ? '' : filter.value))}
                className={cn(
                  'px-2 py-1 h-8 text-xs rounded-md flex items-center justify-center gap-1.5 w-full transition-colors min-w-0',
                  activeViewFilter === filter.value
                    ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600'
                    : 'text-slate-600 bg-white border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                )}
              >
                <filter.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{filter.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value="my-components" className="flex-1 min-h-0 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 w-full max-w-full box-border overflow-hidden">
              {isLoadingMetrics ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400 mb-2" />
                  <div className="text-sm text-slate-500">Loading components...</div>
                </div>
              ) : displayComponents.length > 0 ? (
                displayComponents.map((block) => (
                  <BlockListItem key={block.id} block={block} onDragStart={onDragStart} />
                ))
              ) : (
                <div className="text-center py-10">
                  <BarChart3Icon className="w-12 h-12 text-sec mx-auto mb-3" />
                  <p className="text-sm text-sec mb-2">No components found.</p>
                  <p className="text-xs text-sec">
                    {!selectedOrganization || !selectedCompany
                      ? 'Please select an organization and company to view components.'
                      : 'Published components will appear here.'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="global-components" className="flex-1 min-h-0 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 w-full max-w-full box-border overflow-hidden">
              {isLoadingMetrics ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400 mb-2" />
                  <div className="text-sm text-slate-500">Loading global components...</div>
                </div>
              ) : displayGlobalComponents.length > 0 ? (
                displayGlobalComponents.map((block) => (
                  <BlockListItem key={block.id} block={block} onDragStart={onDragStart} />
                ))
              ) : (
                <div className="text-center py-10">
                  <BarChart3Icon className="w-12 h-12 text-sec mx-auto mb-3" />
                  <p className="text-sm text-sec mb-2">No global components found.</p>
                  <p className="text-xs text-sec">
                    {!selectedOrganization || !selectedCompany
                      ? 'Please select an organization and company to view global components.'
                      : 'Published global components will appear here.'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="h-10 flex-shrink-0 bg-white border-t border-gray-200"></div>
    </aside>
  );
}
