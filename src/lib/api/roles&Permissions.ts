import { fetcher } from "../axios/config";
import { store } from "../store/store";

/**
 * Get companies for the current organization
 * @returns Promise with companies data
 */
export const getOrganizationCompanies = async () => {
  const state = store.getState();
  const organizationId = state.user.selectedOrganization?.id;
  
  console.log("getOrganizationCompanies - organizationId:", organizationId);
  
  if (!organizationId) {
    throw new Error("No organization selected");
  }

  try {
    const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/organization/${organizationId}/companies`);
    console.log("getOrganizationCompanies - API response:", response);
    return response.data || response;
  } catch (error) {
    console.error("getOrganizationCompanies - API error:", error);
    throw error;
  }
};

/**
 * Get users for the current organization
 * @returns Promise with users data
 */
export const getOrganizationUsers = async () => {
  const state = store.getState();
  const organizationId = state.user.selectedOrganization?.id;
  
  console.log("getOrganizationUsers - organizationId:", organizationId);
  
  if (!organizationId) {
    throw new Error("No organization selected");
  }

  try {
    const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/organization/${organizationId}/users`);
    console.log("getOrganizationUsers - API response:", response);
    return response.data || response;
  } catch (error) {
    console.error("getOrganizationUsers - API error:", error);
    throw error;
  }
};


export const addOrganizationUser = async (data: any) => {
  const response = await fetcher.post(
    `${process.env.NEXT_PUBLIC_API_DEV}/organization/add-user`,
    data
  );
  return response;
};

export const updateOrganizationUser = async (data: any) => {
  const response = await fetcher.post(
    `${process.env.NEXT_PUBLIC_API_DEV}/organization/update-user`,
    data
  );
  return response;
};

export const deleteOrganizationUser = async (data: any) => {
  const response = await fetcher.post(
    `${process.env.NEXT_PUBLIC_API_DEV}/organization/delete-user`,
    data
  );
  return response;
};
