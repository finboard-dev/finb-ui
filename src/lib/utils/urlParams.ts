import { useRouter, useSearchParams } from "next/navigation";
import { store } from "@/lib/store/store";

export interface UrlParamUpdates {
  [key: string]: string | null;
}

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
   * Update URL parameters while preserving sidebar and dropdown states
   * @param updates - Object with parameter keys and values (null to delete)
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

  return {
    searchParams,
    updateUrlParams,
    updateUrlParamsWithPreservedState,
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

  // Sync settings section
  const settingsSection = searchParams.get("settings-section");
  if (
    settingsSection &&
    ["data-connections", "profile", "security", "users-roles"].includes(
      settingsSection
    )
  ) {
    dispatch({
      type: "ui/setActiveSettingsSection",
      payload: settingsSection,
    });
    dispatch({
      type: "ui/setMainContent",
      payload: "settings",
    });
  }
}; 