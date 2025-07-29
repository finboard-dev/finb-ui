import { useRouter, useSearchParams } from "next/navigation";
import { store } from "@/lib/store/store";
import { useEffect, useState, useCallback } from "react";

export interface UrlParamUpdates {
  [key: string]: string | null;
}

// Define the main content types and their associated parameters
export type MainContentType = "chat" | "settings";
export type SettingsSection = "data-connections" | "profile" | "security" | "users-roles" | "organization";

// Define parameter groups for better organization
export const PARAM_GROUPS = {
  CHAT: ["id"], // Chat-specific parameters
  SETTINGS: ["settings-section"], // Settings-specific parameters
  UI: ["sidebar-chat", "dropdown-organization"], // UI component states (query params)
  MODAL: ["company-selection"], // Modal states (hash params)
} as const;

/**
 * Custom hook to handle URL parameter updates consistently
 * Makes URL parameters the single source of truth for UI state
 */
export const useUrlParams = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State to force re-renders when hash changes
  const [hashState, setHashState] = useState<string>("");

  // Listen for hash changes to trigger re-renders
  useEffect(() => {
    const handleHashChange = () => {
      console.log('Hash changed to:', window.location.hash);
      setHashState(window.location.hash);
    };

    const handleHashStateChanged = (event: CustomEvent) => {
      console.log('Hash state changed event:', event.detail);
      setHashState(event.detail.hash);
    };

    // Set initial hash state
    console.log('Initial hash:', window.location.hash);
    setHashState(window.location.hash);

    // Add event listeners
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('hashStateChanged', handleHashStateChanged as EventListener);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('hashStateChanged', handleHashStateChanged as EventListener);
    };
  }, []);

  /**
   * Get hash parameters from the current URL
   */
  const getHashParams = useCallback((): URLSearchParams => {
    if (typeof window === 'undefined') return new URLSearchParams();
    const hash = window.location.hash.substring(1); // Remove the #
    return new URLSearchParams(hash);
  }, [hashState]); // Add hashState as dependency to ensure it updates

  /**
   * Update hash parameters
   */
  const updateHashParams = (updates: UrlParamUpdates) => {
    if (typeof window === 'undefined') return;
    
    const hashParams = getHashParams();
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        hashParams.delete(key);
      } else {
        hashParams.set(key, value);
      }
    });
    
    const newHash = hashParams.toString() ? `#${hashParams.toString()}` : '';
    const newUrl = `${window.location.pathname}${window.location.search}${newHash}`;
    
    console.log('Updating hash params, new URL:', newUrl);
    
    // Use window.location.hash directly for immediate updates
    window.location.hash = newHash;
    
    // Also update the hashState to trigger re-renders immediately
    setHashState(newHash);
    
    // Force a re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent('hashStateChanged', { detail: { hash: newHash } }));
  };

  /**
   * Update URL parameters while preserving existing valid parameters
   * @param updates - Object with parameter keys and values (null to delete)
   */
  const updateUrlParams = (updates: UrlParamUpdates) => {
    console.log("updateUrlParams called with updates:", updates);
    
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    const newUrl = `/chat?${params.toString()}`;
    console.log("Navigating to:", newUrl);
    
    router.push(newUrl, { scroll: false });
  };

  /**
   * Update URL parameters while preserving the current path
   * @param updates - Object with parameter keys and values (null to delete)
   */
  const updateUrlParamsPreservePath = (updates: UrlParamUpdates) => {
    console.log("updateUrlParamsPreservePath called with updates:", updates);
    
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    // Preserve the current path (chat or chat/settings)
    const currentPath = window.location.pathname;
    const newUrl = `${currentPath}?${params.toString()}`;
    console.log("Navigating to:", newUrl);
    
    router.push(newUrl, { scroll: false });
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
   * Get current value of a hash parameter
   * @param key - Parameter key
   * @returns Parameter value or null if not present
   */
  const getHashParam = useCallback((key: string): string | null => {
    return getHashParams().get(key);
  }, [getHashParams]);

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
   * Check if a hash parameter is set to a specific value
   * @param key - Parameter key
   * @param value - Expected value
   * @returns True if parameter matches the expected value
   */
  const isHashParamSet = useCallback((key: string, value: string): boolean => {
    const result = getHashParams().get(key) === value;
    console.log(`isHashParamSet(${key}, ${value}) = ${result}, current hash: ${window.location.hash}`);
    return result;
  }, [getHashParams]);

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
    console.log("navigateToChat called with threadId:", threadId);
    
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
    
    console.log("navigateToChat updates:", updates);
    updateUrlParams(updates);
  };

  /**
   * Navigate to settings with a specific section (within chat interface)
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
   * Navigate to chat settings page with a specific section
   * @param section - The settings section to navigate to
   */
  const navigateToChatSettings = (section: SettingsSection = "data-connections") => {
    const params = new URLSearchParams();
    
    // Set the section parameter
    params.set("section", section);
    
    // Preserve UI states
    const sidebarOpen = searchParams.get("sidebar-chat") === "open";
    if (sidebarOpen) {
      params.set("sidebar-chat", "open");
    }
    
    const dropdownOpen = searchParams.get("dropdown-organization") === "open";
    if (dropdownOpen) {
      params.set("dropdown-organization", "open");
    }
    
    const newUrl = `/settings?${params.toString()}`;
    console.log("Navigating to chat settings:", newUrl);
    
    router.push(newUrl, { scroll: false });
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

    updateUrlParamsPreservePath(finalUpdates);
  };

  /**
   * Toggle a UI component state in URL parameters
   * @param componentId - The component ID to toggle
   * @param isOpen - Whether the component should be open
   */
  const toggleComponentState = (componentId: string, isOpen: boolean) => {
    console.log(`toggleComponentState called: ${componentId}, isOpen: ${isOpen}`);
    
    // Immediately update Redux state for better responsiveness
    store.dispatch({
      type: "ui/initializeComponent",
      payload: {
        type: componentId.includes("modal") ? "modal" : "dropdown",
        id: componentId,
        isOpenFromUrl: isOpen,
      },
    });
    
    // Check if this is a modal component (uses hash params)
    if (PARAM_GROUPS.MODAL.includes(componentId as any)) {
      console.log('Updating modal hash params for:', componentId);
      const updates: UrlParamUpdates = {
        [componentId]: isOpen ? "open" : null,
      };
      updateHashParams(updates);
    } else {
      // Regular UI components use query params
      console.log('Updating query params for:', componentId);
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
      
      updateUrlParamsPreservePath(updates);
    }
  };

  return {
    searchParams,
    updateUrlParams,
    updateUrlParamsPreservePath,
    updateHashParams,
    updateUrlParamsWithPreservedState, // Keep for backward compatibility
    navigateToContent,
    startNewChat,
    navigateToChat,
    navigateToSettings,
    navigateToChatSettings,
    toggleComponentState,
    getParam,
    getHashParam,
    isParamSet,
    isHashParamSet,
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

  // Sync modal states from hash parameters
  if (typeof window !== 'undefined') {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const companySelectionOpen = hashParams.get("company-selection") === "open";
    dispatch({
      type: "ui/initializeComponent",
      payload: {
        type: "modal",
        id: "company-selection",
        isOpenFromUrl: companySelectionOpen,
      },
    });
  }

  // Sync settings section and main content
  const settingsSection = searchParams.get("settings-section");
  const section = searchParams.get("section");
  const chatId = searchParams.get("id");
  
  // Handle both old settings-section and new section parameters
  const activeSection = section || settingsSection;
  
  if (activeSection && ["data-connections", "profile", "security", "users-roles", "organization"].includes(activeSection)) {
    dispatch({
      type: "ui/setActiveSettingsSection",
      payload: activeSection,
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