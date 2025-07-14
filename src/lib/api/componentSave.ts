import { fetcher } from "../axios/config"

interface PublishComponentMetricsRequest {
  title: string;
  metric_type: "Global" | "Local";
}

interface PublishComponentMetricsResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const publishComponentMetrics = async (
  componentId: string,
  data: PublishComponentMetricsRequest
): Promise<PublishComponentMetricsResponse> => {
  if (!componentId) {
    throw new Error('Component ID is required');
  }

  if (!data.title || !data.metric_type) {
    throw new Error('Title and metric_type are required');
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
