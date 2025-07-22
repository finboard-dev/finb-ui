import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllCompany, getCurrentCompany } from '@/lib/api/allCompany'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { setCompanies, setSelectedCompany, setUserData } from '@/lib/store/slices/userSlice'
import { useEffect } from 'react'

export function useAllCompanies() {
  const selectedOrganizationId = useAppSelector(
    (state) => state.user.selectedOrganization?.id
  )

  return useQuery({
    queryKey: ['companies', 'all', selectedOrganizationId],
    queryFn: getAllCompany,
    retry: 1,
    enabled: !!selectedOrganizationId, // Only enable if we have an organization
  })
}

export function useCurrentCompany(companyId: string) {
  return useQuery({
    queryKey: ['company', 'current', companyId],
    queryFn: () => getCurrentCompany(companyId),
    retry: 1,
    enabled: !!companyId,
  })
}

export function useSetCurrentCompany() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: getCurrentCompany,
    onSuccess: (data, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['company', 'current', companyId] })
      queryClient.invalidateQueries({ queryKey: ['companies', 'all'] })
    },
  })
}

// Common hook that fetches both companies and current company data and updates Redux state
export function useCompanyData(selectedCompanyId?: string) {
  const dispatch = useAppDispatch()
  const selectedOrganizationId = useAppSelector(
    (state) => state.user.selectedOrganization?.id
  )
  
  // Fetch all companies
  const {
    data: companiesData,
    isLoading: isLoadingCompanies,
    error: companiesError,
  } = useAllCompanies()

  // Fetch current company if selectedCompanyId is provided
  const {
    data: currentCompanyData,
    isLoading: isLoadingCurrentCompany,
    error: currentCompanyError,
  } = useCurrentCompany(selectedCompanyId || '')

  // Update companies in Redux state
  useEffect(() => {
    if (companiesData) {
      const mappedCompanies = (companiesData?.data || companiesData || []).map(
        (company: any) => ({
          ...company,
          name: company.companyName,
          status: company.isActive ? "ACTIVE" : "INACTIVE",
        })
      )
      dispatch(setCompanies(mappedCompanies))
    }
  }, [companiesData, dispatch])

  // Update current company in Redux state
  useEffect(() => {
    if (currentCompanyData && selectedCompanyId) {
      const response = currentCompanyData?.data || currentCompanyData
      if (
        response?.id === selectedCompanyId ||
        response?.data?.id === selectedCompanyId
      ) {
        const companyData = response?.data || response
        dispatch(setSelectedCompany(companyData))

        // Also update the user object to keep it in sync
        // Note: This assumes you have access to the current user state
        // You might need to get this from a selector if needed
        document.cookie = "has_selected_company=true; path=/"
      }
    }
  }, [currentCompanyData, selectedCompanyId, dispatch])

  return {
    companiesData,
    currentCompanyData,
    isLoading: isLoadingCompanies || isLoadingCurrentCompany,
    error: companiesError || currentCompanyError,
    hasOrganization: !!selectedOrganizationId,
  }
} 