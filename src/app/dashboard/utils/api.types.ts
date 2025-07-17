export interface DashboardData {
  uid: string;
  title: string;
  view_only: boolean;
  links: any[];
  tabs: Tab[];
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

export type WidgetType = 'GRAPH' | 'TABLE' | 'KPI';

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

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}