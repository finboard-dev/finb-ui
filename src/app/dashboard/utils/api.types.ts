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
  filter: Record<string, any>;
  last_refreshed_at: string;
  widgets: Widget[];
}

export type WidgetType = 'metric' | 'table' | 'graph';

export interface Widget {
  id: string;
  component_id: string;
  title: string;
  type: WidgetType;
  filter: Record<string, any>;
  data: any;
  position: WidgetPosition;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}