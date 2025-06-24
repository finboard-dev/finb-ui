/**
 * Defines the available types for blocks that can be placed on the dashboard.
 * - "graph": For chart visualizations, rendered with a chart component.
 * - "table": For tabular data, rendered with a dynamic table component.
 * - "metric": For displaying key performance indicators, rendered with a metric card.
 */
export type BlockType = "graph" | "table" | "metric";

/**
 * Represents an instance of a block placed on the dashboard grid.
 */
export interface DashboardItem {
    id: string;      // Unique ID for this instance of the block on the dashboard.
    blockId: string; // ID of the source block template.
    x: number;       // X position on the grid.
    y: number;       // Y position on the grid.
    w: number;       // Width on the grid.
    h: number;       // Height on the grid.
    minW: number;    // Minimum width.
    minH: number;    // Minimum height.
}

/**
 * Represents a reusable block template.
 */
export interface Block {
    id: string;           // Unique ID for the block template.
    component_id: string;
    title: string;
    subtitle?: string;
    type: BlockType;
    filter: Record<string, any>;
    content: any;         // Data for the block: object for graph/metric, array/object for table.
    previewImage?: string; // Data URL for a preview image.
}

/**
 * Represents a block that is currently being dragged from the controls panel.
 */
export interface DraggingBlock {
    id: string;     // ID of the block template being dragged.
    type: BlockType;
    width: number;  // Default width for the react-grid-layout item.
    height: number; // Default height for the react-grid-layout item.
}

// Dashboard Structure Types
export interface DashboardLink {
  title: string;
  url: string;
  type: 'primary' | 'secondary';
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}

export interface WidgetFilter {
  [key: string]: any;
}

export interface WidgetData {
  [key: string]: any;
}

export interface Widget {
  id: string;
  component_id: string;
  title: string;
  type: 'metric' | 'graph' | 'table';
  filter: WidgetFilter;
  position: WidgetPosition;
}

export interface Tab {
  id: string;
  title: string;
  filter: WidgetFilter;
  last_refreshed_at: string | null;
  widgets: Widget[];
}

export interface DashboardStructure {
  uid: string;
  title: string;
  view_only: boolean;
  links: DashboardLink[];
  tabs: Tab[];
}

// API Response Types
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface DashboardStructureResponse extends ApiResponse<DashboardStructure> {}

// Widget Data Types
export interface WidgetDataRequest {
  dashboardId: string;
  componentId: string;
  tabId: string;
  filter: WidgetFilter;
}

export interface WidgetDataResponse extends ApiResponse<WidgetData> {}

// Dashboard State Types
export interface DashboardState {
  structure: DashboardStructure | null;
  currentTabId: string | null;
  widgetData: Record<string, WidgetData>; // key: component_id
  loadedTabs: Set<string>; // track which tabs have been loaded
  loading: {
    structure: boolean;
    widgetData: boolean;
  };
  error: string | null;
  isEditing: boolean;
}

// Tab Selection Types
export interface TabSelection {
  tabId: string;
  tab: Tab;
}

