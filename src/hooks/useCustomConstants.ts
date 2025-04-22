// hooks/useSelectedCompany.ts
import { useSelector } from 'react-redux';
import { selectSelectedCompany, selectSelectedCompanyId } from '@/lib/store/slices/userSlice';
import type { Company } from '@/lib/store/slices/userSlice';

export const useSelectedCompany = (): Company | null => {
  const selectedCompany = useSelector(selectSelectedCompany);
  return selectedCompany;
};

export const useSelectedCompanyId = () => {
  const selectedCompanyId = useSelector(selectSelectedCompanyId)
  console.log('Selected company ID:', selectedCompanyId);
  return selectedCompanyId;
}