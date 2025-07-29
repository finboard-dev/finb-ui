import { apiClient } from '../axios/config';

export interface UpdateOrganizationNameRequest {
  organizationId: string;
  name: string;
}

export interface UpdateOrganizationNameResponse {
  success: boolean;
  message?: string;
}

export const updateOrganizationName = async (data: UpdateOrganizationNameRequest): Promise<UpdateOrganizationNameResponse> => {
  const response = await apiClient.post('/organization/update-name', data);
  return response.data;
}; 