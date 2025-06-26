import { useRouter, useSearchParams } from "next/navigation";
import { store } from "@/lib/store/store";

export interface UrlParamUpdates {
  [key: string]: string | null;
}

// Define the main content types and their associated parameters
export type MainContentType = "chat" | "settings";
export type SettingsSection = "data-connections" | "profile" | "security" | "users-roles";

// Define parameter groups for better organization
export const PARAM_GROUPS = {
  CHAT: ["id"], // Chat-specific parameters
  SETTINGS: ["settings-section"], // Settings-specific parameters
  UI: ["sidebar-chat", "dropdown-organization"], // UI component states
} as const;

/**
 * Custom hook to handle URL parameter updates consistently
 * Makes URL parameters the single source of truth for UI state
 */
export const useUrlParams = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Update URL parameters while preserving existing valid parameters
   * @param updates - Object with parameter keys and values (null to delete)
   */
  const updateUrlParams = (updates: UrlParamUpdates) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    router.push(`/chat?${params.toString()}`, { scroll: false });
  };

  /**
   * Get current value of a URL parameter
   * @param key - Parameter key
   * @returns Parameter value or null if not present
   */
  const getParam = (key: string): string | null => {
    return searchParams.get(key);
  };

  /**
   * Check if a URL parameter is set to a specific value
   * @param key - Parameter key
   * @param value - Expected value
   * @returns True if parameter matches the expected value
   */
  const isParamSet = (key: string, value: string): boolean => {
    return searchParams.get(key) === value;
  };

  /**
   * Navigate to a specific main content type with appropriate parameter cleanup
   * @param content - The main content type to navigate to
   * @param additionalParams - Additional parameters to set
   */
  const navigateToContent = (content: MainContentType, additionalParams: UrlParamUpdates = {}) => {
    const updates: UrlParamUpdates = { ...additionalParams };
    
    // Clear parameters that don't belong to the target content
    if (content === "chat") {
      // Clear settings parameters when going to chat
      updates["settings-section"] = null;
    } else if (content === "settings") {
      // Clear chat parameters when going to settings
      updates["id"] = null;
    }
    
    // Preserve UI component states
    const sidebarOpen = searchParams.get("sidebar-chat") === "open";
    if (sidebarOpen) {
      updates["sidebar-chat"] = "open";
    }
    
    const dropdownOpen = searchParams.get("dropdown-organization") === "open";
    if (dropdownOpen) {
      updates["dropdown-organization"] = "open";
    }
    
    updateUrlParams(updates);
  };

  /**
   * Start a new chat (clears existing chat parameters)
   * @param assistantId - Optional assistant ID for the new chat
   */
  const startNewChat = (assistantId?: string) => {
    const updates: UrlParamUpdates = {
      "id": null, // Clear existing chat ID
    };
    
    // Preserve UI states
    const sidebarOpen = searchParams.get("sidebar-chat") === "open";
    if (sidebarOpen) {
      updates["sidebar-chat"] = "open";
    }
    
    const dropdownOpen = searchParams.get("dropdown-organization") === "open";
    if (dropdownOpen) {
      updates["dropdown-organization"] = "open";
    }
    
    updateUrlParams(updates);
  };

  /**
   * Navigate to a specific chat
   * @param threadId - The thread ID of the chat to navigate to
   */
  const navigateToChat = (threadId: string) => {
    const updates: UrlParamUpdates = {
      "id": threadId,
      "settings-section": null, // Clear settings when going to chat
    };
    
    // Preserve UI states
    const sidebarOpen = searchParams.get("sidebar-chat") === "open";
    if (sidebarOpen) {
      updates["sidebar-chat"] = "open";
    }
    
    const dropdownOpen = searchParams.get("dropdown-organization") === "open";
    if (dropdownOpen) {
      updates["dropdown-organization"] = "open";
    }
    
    updateUrlParams(updates);
  };

  /**
   * Navigate to settings with a specific section
   * @param section - The settings section to navigate to
   */
  const navigateToSettings = (section: SettingsSection = "data-connections") => {
    const updates: UrlParamUpdates = {
      "settings-section": section,
      "id": null, // Clear chat ID when going to settings
    };
    
    // Preserve UI states
    const sidebarOpen = searchParams.get("sidebar-chat") === "open";
    if (sidebarOpen) {
      updates["sidebar-chat"] = "open";
    }
    
    const dropdownOpen = searchParams.get("dropdown-organization") === "open";
    if (dropdownOpen) {
      updates["dropdown-organization"] = "open";
    }
    
    updateUrlParams(updates);
  };

  /**
   * Update URL parameters while preserving sidebar and dropdown states
   * @param updates - Object with parameter keys and values (null to delete)
   * @deprecated Use navigateToContent, startNewChat, navigateToChat, or navigateToSettings instead
   */
  const updateUrlParamsWithPreservedState = (updates: UrlParamUpdates) => {
    const finalUpdates: UrlParamUpdates = { ...updates };
    
    // Preserve sidebar state only if we're not explicitly updating it
    if (!("sidebar-chat" in updates)) {
      const sidebarOpen = searchParams.get("sidebar-chat") === "open";
      if (sidebarOpen) {
        finalUpdates["sidebar-chat"] = "open";
      }
    }

    // Check if organization dropdown is open in Redux state
    const currentState = store.getState();
    const dropdownOpen =
      currentState.ui.components["dropdown-organization"]?.isOpen;
    if (dropdownOpen) {
      finalUpdates["dropdown-organization"] = "open";
    }

    updateUrlParams(finalUpdates);
  };

  /**
   * Toggle a UI component state in URL parameters
   * @param componentId - The component ID to toggle
   * @param isOpen - Whether the component should be open
   */
  const toggleComponentState = (componentId: string, isOpen: boolean) => {
    const updates: UrlParamUpdates = {
      [componentId]: isOpen ? "open" : null,
    };
    
    // Preserve other UI states
    const otherComponents = ["sidebar-chat", "dropdown-organization"].filter(id => id !== componentId);
    otherComponents.forEach(id => {
      const isOtherOpen = searchParams.get(id) === "open";
      if (isOtherOpen) {
        updates[id] = "open";
      }
    });
    
    updateUrlParams(updates);
  };

  return {
    searchParams,
    updateUrlParams,
    updateUrlParamsWithPreservedState, // Keep for backward compatibility
    navigateToContent,
    startNewChat,
    navigateToChat,
    navigateToSettings,
    toggleComponentState,
    getParam,
    isParamSet,
  };
};

/**
 * Utility function to sync URL parameters to Redux state
 * @param searchParams - Current search parameters
 * @param dispatch - Redux dispatch function
 */
export const syncUrlParamsToRedux = (
  searchParams: URLSearchParams,
  dispatch: any
) => {
  // Sync sidebar state
  const sidebarOpen = searchParams.get("sidebar-chat") === "open";
  dispatch({
    type: "ui/initializeComponent",
    payload: {
      type: "sidebar",
      id: "sidebar-chat",
      isOpenFromUrl: sidebarOpen,
    },
  });

  // Sync dropdown state
  const dropdownOpen = searchParams.get("dropdown-organization") === "open";
  dispatch({
    type: "ui/initializeComponent",
    payload: {
      type: "dropdown",
      id: "dropdown-organization",
      isOpenFromUrl: dropdownOpen,
    },
  });

  // Sync settings section and main content
  const settingsSection = searchParams.get("settings-section");
  const chatId = searchParams.get("id");
  
  if (settingsSection && ["data-connections", "profile", "security", "users-roles"].includes(settingsSection)) {
    dispatch({
      type: "ui/setActiveSettingsSection",
      payload: settingsSection,
    });
    dispatch({
      type: "ui/setMainContent",
      payload: "settings",
    });
  } else if (chatId) {
    // If we have a chat ID but no settings section, we're in chat mode
    dispatch({
      type: "ui/setMainContent",
      payload: "chat",
    });
  }
}; 