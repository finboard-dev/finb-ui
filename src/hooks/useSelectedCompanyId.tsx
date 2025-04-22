import { selectSelectedCompanyId } from "@/lib/store/slices/userSlice";
import { store } from "@/lib/store/store";
import { useEffect } from "react";
import { useSelector } from "react-redux";

const SELECTED_COMPANY_STORAGE_KEY = "selectedCompanyId";

/**
 * @returns {string | null} The currently selected company ID
 */
const useSelectedCompany = (): string | null => {
  const selectedCompanyId = useSelector(selectSelectedCompanyId);

  useEffect(() => {
    // Sync to localStorage whenever selectedCompanyId changes
    syncSelectedCompanyToStorage(selectedCompanyId);
  }, [selectedCompanyId]);

  return selectedCompanyId;
};

/**
 * Helper function to sync selectedCompanyId to localStorage
 */
export const syncSelectedCompanyToStorage = (
  companyId: string | null
): void => {
  if (typeof window === "undefined") return;

  if (companyId) {
    localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, companyId);
  } else {
    localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
  }
};

/**
 * Manually sync the current Redux state to localStorage
 * Call this after settings are changed if you're not using the hook
 */
export const syncCurrentSelectedCompanyToStorage = (): void => {
  if (typeof window === "undefined") return;

  const state = store.getState();
  const companyId = selectSelectedCompanyId(state);
  syncSelectedCompanyToStorage(companyId);
};

/**
 * @returns {string | null} The saved company ID or null if not found
 */
export const getSavedSelectedCompanyId = (): string | null => {
  if (typeof window === "undefined") return null;

  // Force a sync before reading to ensure we have the latest value
  syncCurrentSelectedCompanyToStorage();

  return localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
};

export default useSelectedCompany;
