import { selectedCompanyId as selectCompanyId } from "@/lib/store/slices/userSlice";
import { store } from "@/lib/store/store";
import { useEffect } from "react";
import { useSelector } from "react-redux";

const SELECTED_COMPANY_STORAGE_KEY = "selectedCompanyId";

/**
 * Custom hook to manage selected company ID with localStorage sync
 * @returns {string | null} The currently selected company ID
 */
const useSelectedCompany = (): string | null => {
  const selectedCompanyId = useSelector(selectCompanyId);

  useEffect(() => {
    if (selectedCompanyId !== undefined) {
      syncSelectedCompanyToStorage(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  return selectedCompanyId ?? null;
};

/**
 * Helper function to sync selectedCompanyId to localStorage
 * @param companyId - The company ID to store
 */
export const syncSelectedCompanyToStorage = (
  companyId: string | null
): void => {
  if (typeof window === "undefined") return;

  try {
    if (companyId) {
      localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, companyId);
    } else {
      localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Error syncing company ID to storage:", error);
  }
};

/**
 * Manually sync the current Redux state to localStorage
 * Call this after settings are changed if you're not using the hook
 */
export const syncCurrentSelectedCompanyToStorage = (): void => {
  if (typeof window === "undefined") return;

  try {
    const state = store.getState();
    const currentCompanyId = selectCompanyId(state);

    if (currentCompanyId !== undefined) {
      syncSelectedCompanyToStorage(currentCompanyId);
    }
  } catch (error) {
    console.error("Error syncing current company ID to storage:", error);
  }
};

/**
 * Get the saved company ID from localStorage
 * @returns {string | null} The saved company ID or null if not found
 */
export const getSavedSelectedCompanyId = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
  } catch (error) {
    console.error("Error reading company ID from storage:", error);
    return null;
  }
};

export default useSelectedCompany;
