"use client";

import { useAppSelector } from "@/lib/store/hooks";
import { selectSelectedCompany, selectCompanies } from "@/lib/store/slices/userSlice";
import InactiveCompanyUI from "@/components/ui/InactiveCompanyUI";
import { useAllCompanies } from '@/hooks/query-hooks/useCompany';

export const useInactiveCompany = () => {
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const companies = useAppSelector(selectCompanies);
  
  // Get loading state from useAllCompanies
  const { isLoading: isLoadingCompanies } = useAllCompanies();
  
  const isSelectedCompanyInactive = companies.find( 
    (company: any) => company.id === selectedCompany?.id
  )?.isActive;

  console.log("companies", companies);
  console.log("selectedCompany", selectedCompany);
  console.log("isLoadingCompanies", isLoadingCompanies);
  console.log("isSelectedCompanyInactive", isSelectedCompanyInactive);

  // Only show inactive company UI if companies are loaded and the selected company is inactive
  const isCompanyInactive = !isLoadingCompanies && !isSelectedCompanyInactive;

  return {
    isCompanyInactive,
    InactiveCompanyUI,
  };
}; 