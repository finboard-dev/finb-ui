"use client";

import { useAppSelector } from "@/lib/store/hooks";
import { selectSelectedCompany, selectCompanies } from "@/lib/store/slices/userSlice";
import InactiveCompanyUI from "@/components/ui/InactiveCompanyUI";

export const useInactiveCompany = () => {
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const companies = useAppSelector(selectCompanies);
  
  const isSelectedCompanyInactive = companies.find( 
    (company: any) => company.id === selectedCompany?.id
  )?.isActive;

  console.log("companies", companies);
  console.log("selectedCompany", selectedCompany);
  

  console.log("isSelectedCompanyInactive", isSelectedCompanyInactive);

  const isCompanyInactive = !isSelectedCompanyInactive;

  return {
    isCompanyInactive,
    InactiveCompanyUI,
  };
}; 