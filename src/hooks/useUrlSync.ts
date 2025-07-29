"use client";

import { useEffect, useCallback, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { 
  setSelectedOrganization, 
  setSelectedCompany, 
  selectSelectedOrganization,
  selectSelectedCompany,
  selectUser,
  type Organization,
  type Company
} from '@/lib/store/slices/userSlice';
import { getAllCompany, getCurrentCompany } from '@/lib/api/allCompany';

interface UrlSyncOptions {
  /**
   * Whether to update URL when Redux state changes
   * @default true
   */
  syncToUrl?: boolean;
  
  /**
   * Whether to update Redux state when URL changes
   * @default true
   */
  syncFromUrl?: boolean;
  
  /**
   * Whether to validate organization/company access before setting
   * @default true
   */
  validateAccess?: boolean;
}

/**
 * Custom hook to synchronize organization and company IDs between URL parameters and Redux state
 * This enables shareable URLs that automatically select the correct organization and company
 */
export const useUrlSync = (options: UrlSyncOptions = {}) => {
  const {
    syncToUrl: shouldSyncToUrl = true,
    syncFromUrl: shouldSyncFromUrl = true,
    validateAccess = true
  } = options;

  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Redux state selectors
  const user = useAppSelector(selectUser);
  const selectedOrganization = useAppSelector(selectSelectedOrganization);
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const isAuthenticated = !!user?.id;

  // URL parameter getters
  const orgIdFromUrl = searchParams.get('orgId');
  const companyIdFromUrl = searchParams.get('companyId');

  // Use ref for validation cache to avoid infinite update loops
  const validationCache = useRef<{ orgs: Record<string, Organization | null>; companies: Record<string, Company | null> }>({ orgs: {}, companies: {} });

  // Track if we're currently syncing to prevent duplicate calls
  const isSyncingRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Update URL parameters with current organization and company IDs
   */
  const updateUrlParams = useCallback((orgId?: string, companyId?: string) => {
    if (!shouldSyncToUrl || typeof window === 'undefined') return;

    const params = new URLSearchParams(searchParams.toString());
    
    // Update organization ID
    if (orgId) {
      params.set('orgId', orgId);
    } else {
      params.delete('orgId');
    }
    
    // Update company ID
    if (companyId) {
      params.set('companyId', companyId);
    } else {
      params.delete('companyId');
    }

    // Only update URL if parameters actually changed
    const currentOrgId = searchParams.get('orgId');
    const currentCompanyId = searchParams.get('companyId');
    
    if (currentOrgId !== orgId || currentCompanyId !== companyId) {
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [shouldSyncToUrl, searchParams, router]);

  /**
   * Validate if user has access to the specified organization
   */
  const validateOrganizationAccess = useCallback(async (orgId: string): Promise<Organization | null> => {
    // Check cache first
    if (validationCache.current.orgs[orgId] !== undefined) {
      return validationCache.current.orgs[orgId];
    }
    if (!user?.organizations) {
      validationCache.current.orgs[orgId] = null;
      return null;
    }
    const userOrg = user.organizations.find(org => org.organization.id === orgId);
    if (!userOrg) {
      validationCache.current.orgs[orgId] = null;
      return null;
    }
    const organization = {
      id: userOrg.organization.id,
      name: userOrg.organization.name,
      status: userOrg.organization.status,
      enabledFeatures: userOrg.organization.enabledFeatures || [],
      billingEmail: userOrg.organization.billingEmail,
      contactEmail: userOrg.organization.contactEmail,
      companies: [],
      role: {
        id: userOrg.role.id,
        name: userOrg.role.name,
        permissions: [],
      },
    };
    validationCache.current.orgs[orgId] = organization;
    return organization;
  }, [user?.organizations]);

  /**
   * Validate if user has access to the specified company
   */
  const validateCompanyAccess = useCallback(async (companyId: string): Promise<Company | null> => {
    // Check cache first
    if (validationCache.current.companies[companyId] !== undefined) {
      return validationCache.current.companies[companyId];
    }
    try {
      const response = await getCurrentCompany(companyId);
      const companyData = response?.data || response;
      if (!companyData || !companyData.id) {
        validationCache.current.companies[companyId] = null;
        return null;
      }
      const company = {
        ...companyData,
        name: companyData.companyName || companyData.name,
        status: companyData.isActive ? 'ACTIVE' : 'INACTIVE',
      };
      validationCache.current.companies[companyId] = company;
      return company;
    } catch (error) {
      validationCache.current.companies[companyId] = null;
      return null;
    }
  }, []);

  /**
   * Set organization from URL parameters
   */
  const setOrganizationFromUrl = useCallback(async (orgId: string) => {
    if (!validateAccess) {
      // If not validating, just set from user organizations
      const userOrg = user?.organizations?.find(org => org.organization.id === orgId);
      if (userOrg) {
        const organization: Organization = {
          id: userOrg.organization.id,
          name: userOrg.organization.name,
          status: userOrg.organization.status,
          enabledFeatures: userOrg.organization.enabledFeatures || [],
          billingEmail: userOrg.organization.billingEmail,
          contactEmail: userOrg.organization.contactEmail,
          companies: [],
          role: {
            id: userOrg.role.id,
            name: userOrg.role.name,
            permissions: [],
          },
        };
        dispatch(setSelectedOrganization(organization));
        return true;
      }
      return false;
    }

    const organization = await validateOrganizationAccess(orgId);
    if (organization) {
      dispatch(setSelectedOrganization(organization));
      return true;
    }
    return false;
  }, [validateAccess, user?.organizations, validateOrganizationAccess, dispatch]);

  /**
   * Set company from URL parameters
   */
  const setCompanyFromUrl = useCallback(async (companyId: string) => {
    if (!validateAccess) {
      // If not validating, try to set directly
      try {
        const response = await getCurrentCompany(companyId);
        const companyData = response?.data || response;
        if (companyData) {
          const company: Company = {
            ...companyData,
            name: companyData.companyName || companyData.name,
            status: companyData.isActive ? 'ACTIVE' : 'INACTIVE',
          };
          dispatch(setSelectedCompany(company));
          return true;
        }
      } catch (error) {
        console.error('Error setting company from URL:', error);
      }
      return false;
    }

    const company = await validateCompanyAccess(companyId);
    if (company) {
      dispatch(setSelectedCompany(company));
      return true;
    }
    return false;
  }, [validateAccess, validateCompanyAccess, dispatch]);

  /**
   * Sync URL parameters to Redux state
   */
  const syncFromUrl = useCallback(async () => {
    if (!shouldSyncFromUrl || !isAuthenticated || isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      let orgChanged = false;
      let companyChanged = false;
      let orgValid = true;
      let companyValid = true;

      // Handle organization from URL
      if (orgIdFromUrl && orgIdFromUrl !== selectedOrganization?.id) {
        const success = await setOrganizationFromUrl(orgIdFromUrl);
        if (success) {
          orgChanged = true;
        } else {
          orgValid = false;
        }
      }

      // Handle company from URL
      if (companyIdFromUrl && companyIdFromUrl !== selectedCompany?.id) {
        const success = await setCompanyFromUrl(companyIdFromUrl);
        if (success) {
          companyChanged = true;
        } else {
          companyValid = false;
        }
      }

      // If org/company are invalid, update URL to use user's selected org/company as fallback
      if (!orgValid || !companyValid) {
        updateUrlParams(
          !orgValid ? (selectedOrganization?.id || undefined) : orgIdFromUrl || undefined,
          !companyValid ? (selectedCompany?.id || undefined) : companyIdFromUrl || undefined
        );
      }

      return { orgChanged, companyChanged };
    } finally {
      setIsSyncing(false);
    }
  }, [
    shouldSyncFromUrl,
    isAuthenticated,
    isSyncing,
    orgIdFromUrl,
    companyIdFromUrl,
    selectedOrganization?.id,
    selectedCompany?.id,
    setOrganizationFromUrl,
    setCompanyFromUrl,
    updateUrlParams
  ]);

  /**
   * Sync Redux state to URL parameters
   */
  const syncToUrl = useCallback(() => {
    if (!shouldSyncToUrl || !isAuthenticated) return;

    const currentOrgId = selectedOrganization?.id;
    const currentCompanyId = selectedCompany?.id;

    updateUrlParams(currentOrgId, currentCompanyId);
  }, [
    shouldSyncToUrl,
    isAuthenticated,
    selectedOrganization?.id,
    selectedCompany?.id,
    updateUrlParams
  ]);

  // Effect to sync from URL when URL parameters change with debouncing
  useEffect(() => {
    if (shouldSyncFromUrl && isAuthenticated && !isSyncing) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        syncFromUrl();
      }, 100); // 100ms debounce
    }
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [orgIdFromUrl, companyIdFromUrl, isAuthenticated, shouldSyncFromUrl, isSyncing]);

  // Effect to sync to URL when Redux state changes
  useEffect(() => {
    if (shouldSyncToUrl && isAuthenticated) {
      syncToUrl();
    }
  }, [selectedOrganization?.id, selectedCompany?.id, isAuthenticated, shouldSyncToUrl]);

  // Clear cache when user changes
  useEffect(() => {
    validationCache.current = { orgs: {}, companies: {} };
  }, [user?.id]);

  return {
    // Current URL parameters
    orgIdFromUrl,
    companyIdFromUrl,
    
    // Sync functions
    syncFromUrl,
    syncToUrl,
    updateUrlParams,
    
    // Validation functions
    validateOrganizationAccess,
    validateCompanyAccess,
    
    // State
    isAuthenticated,
    selectedOrganization,
    selectedCompany,
    isSyncing,
  };
}; 