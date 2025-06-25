import { fetcher } from "../axios/config";
import { store } from "../store/store";

/**
 * Get connections for the current organization
 * @returns Promise with connections data
 */
export const getOrganizationConnections = async () => {
  const state = store.getState();
  const organizationId = state.user.selectedOrganization?.id;
  
  console.log("getOrganizationConnections - organizationId:", organizationId);
  
  if (!organizationId) {
    throw new Error("No organization selected");
  }

  try {
    const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/organization/${organizationId}/connections`);
    console.log("getOrganizationConnections - API response:", response);
    return response.data || response;
  } catch (error) {
    console.error("getOrganizationConnections - API error:", error);
    throw error;
  }
};

/**
 * Add a new connection
 * @returns Promise with the added connection data
 */
export const addConnection = async () => {
  
  try {
    const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/connection/add`);
    console.log("addConnection - API response:", response);
    return response.data || response;
  } catch (error) {
    console.error("addConnection - API error:", error);
    throw error;
  }
};

/**
 * Disconnect a connection by ID
 * @param connectionId - The ID of the connection to disconnect
 * @returns Promise with the disconnect response
 */
export const disconnectConnection = async (connectionId: string) => {
  console.log("disconnectConnection - connectionId:", connectionId);
  
  if (!connectionId) {
    throw new Error("Connection ID is required");
  }

  try {
    const response = await fetcher.post(`${process.env.NEXT_PUBLIC_API_DEV}/connection/disconnect/${connectionId}`, {});
    console.log("disconnectConnection - API response:", response);
    return response.data || response;
  } catch (error) {
    console.error("disconnectConnection - API error:", error);
    throw error;
  }
};
