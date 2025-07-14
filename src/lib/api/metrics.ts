import { fetcher } from "../axios/config"

interface PublishComponentMetricsRequest {
  title: string;
  metricScope: "Global" | "Organization" | "Company";
  orgId?: string;
  companyId?: string;
}

interface PublishComponentMetricsResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface GetComponentMetricsParams {
  orgId: string;
  companyId: string;
  publishedOnly?: boolean;
}

// Types for the detailed metric response structure
interface User {
  id: string;
  name: string;
  email: string;
}

interface DatasourceRequest {
  template: string;
  accounting_method: string | null;
  qzurl: string | null;
  end_date: string | null;
  start_date: string | null;
  sort_order: string | null;
  date_macro: string;
  summarize_column_by: string;
  showrows: string | null;
  showcols: string | null;
  customer: string | null;
  vendor: string | null;
  employee: string | null;
  department: string | null;
  class_: string | null;
  item: string | null;
  account: string | null;
  account_type: string | null;
  columns: string | null;
  payment_method: string | null;
  report_date: string | null;
  aging_method: string | null;
  arpaid: string | null;
  appaid: string | null;
  term: string | null;
  end_duedate: string | null;
  start_duedate: string | null;
  duedate_macro: string | null;
  aging_period: string | null;
  num_periods: string | null;
  past_due: string | null;
  apply_mapping: boolean;
  show_total: string | null;
  show_currency_rate: string | null;
  apply_elimination: boolean;
  show_elimination: boolean;
  split_by_company: boolean;
  add_budget_variance: boolean;
  report_period: string | null;
  rows: string | null;
  change: string | null;
  group_by: string | null;
  budget: string | null;
  variance: string | null;
  budget_id: string | null;
  cleared: string | null;
  comparison_columns: string | null;
  add_estimate: string | null;
  asof_date: string | null;
  estimate_status: string | null;
}

interface Datasource {
  name: string;
  request: DatasourceRequest;
}

interface TableRow {
  name: string;
  fullname: string;
  type: string;
  values: string[];
  group: string;
}

interface TableData {
  columns: string[];
  rows: TableRow[];
}

interface PublishedVersion {
  id: string;
  metric_id: string;
  description: string | null;
  datasource: Datasource[];
  python_code: string[];
  table_data: TableData;
  version_number: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  html_table: string;
}

interface ComponentMetric {
  id: string;
  title: string;
  description: string | null;
  company_id: string | null;
  org_id: string | null;
  published_version: PublishedVersion | null;
  draft_version: PublishedVersion | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  created_by: User;
  last_updated_by: User | null;
  scope_level: "global" | "organization" | "company";
}

interface GetComponentMetricsResponse {
  success: boolean;
  message?: string;
  data?: ComponentMetric[];
}

export const publishComponentMetrics = async (
  componentId: string,
  data: PublishComponentMetricsRequest
): Promise<PublishComponentMetricsResponse> => {
  if (!componentId) {
    throw new Error('Component ID is required');
  }

  if (!data.title || !data.metricScope) {
    throw new Error('Title and metricScope are required');
  }

  try {
    const response = await fetcher.post(
      `${process.env.NEXT_PUBLIC_API_DEV}/component/metrics/${componentId}/publish`,
      data
    );
    return response;
  } catch (error) {
    console.error('Error publishing component metrics:', error);
    throw error;
  }
};

export const getComponentMetrics = async (
  params: GetComponentMetricsParams
): Promise<GetComponentMetricsResponse> => {
  const { orgId, companyId, publishedOnly = true } = params;

  if (!orgId) {
    throw new Error('Organization ID is required');
  }

  if (!companyId) {
    throw new Error('Company ID is required');
  }

  try {
    const response = await fetcher.get(
      `${process.env.NEXT_PUBLIC_API_DEV}/component/metrics/org/${orgId}/company/${companyId}?publishedOnly=true`,
    );
    
    console.log('Raw API response:', response);
    
    // Handle different response formats
    if (Array.isArray(response)) {
      // If response is directly an array, wrap it in the expected format
      return {
        success: true,
        data: response
      };
    } else if (response && typeof response === 'object') {
      // If response has data property, use it
      if (response.data !== undefined) {
        return {
          success: true,
          data: response.data
        };
      }
      // If response is the data itself
      return {
        success: true,
        data: response
      };
    }
    
    // Fallback
    return {
      success: false,
      message: 'Unexpected response format',
      data: []
    };
  } catch (error) {
    console.error('Error fetching component metrics:', error);
    throw error;
  }
};

