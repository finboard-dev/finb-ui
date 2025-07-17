/**
 * Defines the available types for blocks that can be placed on the dashboard.
 * - "GRAPH": For chart visualizations, rendered with a chart component.
 * - "TABLE": For tabular data, rendered with a dynamic table component.
 * - "KPI": For displaying key performance indicators, rendered with a metric card.
 */
export type BlockType = "GRAPH" | "TABLE" | "KPI";

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
    title: string;
    subtitle?: string;
    type: BlockType;
    filter: Record<string, any>;
    content: any;         // Data for the block: object for graph/KPI, array/object for table.
    previewImage?: string; // Data URL for a preview image.
    htmlTable?: string;   // HTML table string for table rendering
    scopeLevel?: string;  // Scope level: "global", "organization", "company"
}

/**
 * Represents a block that is currently being dragged from the controls panel.
 */
export interface DraggingBlock {
    id: string;     // ID of the block template being dragged.
    type: BlockType;
    width: number;  // Default width for the react-grid-layout item.
    height: number; // Default height for the react-grid-layout item.
    htmlTable?: string; // HTML table data for table components
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
  title: string;
  position: WidgetPosition;
  refId: string;
  refVersion: string;
  refType: string;
  outputType: 'GRAPH' | 'TABLE' | 'KPI';
  output: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tab {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  position: number;
  lastRefreshedAt: string | null;
  widgets: Widget[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStructure {
  uid: string;
  title: string;
  view_only: boolean;
  links: DashboardLink[];
  tabs: Tab[];
  // New fields for versioning
  currentVersion?: 'draft' | 'published';
  publishedVersion?: DashboardVersion | null;
  draftVersion?: DashboardVersion;
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
  widgetData: Record<string, WidgetData>; // key: refId
  loadedTabs: Set<string>; // track which tabs have been loaded
  loading: {
    structure: boolean;
    widgetData: boolean;
  };
  error: string | null;
  isEditing: boolean;
  // New fields for versioning
  currentVersion: 'draft' | 'published';
  canEdit: boolean;
  canPublish: boolean;
}

// Tab Selection Types
export interface TabSelection {
  tabId: string;
  tab: Tab;
}

// New API Response Types for Versioning
export interface DashboardVersion {
  id: string;
  dashboardId: string;
  tabs: Tab[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DashboardApiResponse {
  id: string;
  title: string;
  sharedUsers: any[];
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  publishedVersion: DashboardVersion | null;
  draftVersion: DashboardVersion;
  orgId: string;
  companyId: string;
  updatedAt: string;
}

