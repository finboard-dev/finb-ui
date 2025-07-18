import { fetcher } from "../axios/config";

// Types for the API response
export interface ReportItem {
  id: number;
  name: string;
  sheetId: number;
  companyName: string;
  status: string;
  isMultiEntity: boolean;
  isTemplate: boolean;
  createdAt: string;
  lastSyncAt: string | null;
}

export interface ReportPackage {
  id: string;
  name: string;
  link: string;
  createdBy: string;
  createdDate: string;
  reports: ReportItem[];
}

export interface ReportsApiResponse {
  code: string;
  message: string;
  data: ReportPackage[];
}

export const getReports = async (companyId: string): Promise<ReportPackage[]> => {
  if (!companyId) {
    throw new Error('Company ID is required to fetch reports');
  }
  
  console.log('Fetching reports for company ID:', companyId);
  
  try {
    const response = await fetcher.get(
      `${process.env.NEXT_PUBLIC_API_DEV}/report/all/${companyId}`
    );
    
    if (response && response.data) {
      return response.data;
    } else if (Array.isArray(response)) {
    
      return response;
    }
    
    throw new Error('Invalid response format from reports API');
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }
}; 