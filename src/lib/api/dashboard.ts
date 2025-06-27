import { fetcher } from "../axios/config"

export const getDashboardStructure = async () => {
  const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/dashboard/?dashboard=XERO_DASH_001`)
  return response
}

interface WidgetDataFilter {
  period?: string;
  category?: string;
  breakdown?: string;
  [key: string]: any;
}

interface WidgetDataRequest {
  dashboardId: string;
  componentId: string;
  tabId: string;
  filter: WidgetDataFilter;
}

export const getWidgetData = async (params: WidgetDataRequest) => {
  const response = await fetcher.post(
    `${process.env.NEXT_PUBLIC_API_DEV}/dashboard/widget-data`,
    params
  );
  return response;
}