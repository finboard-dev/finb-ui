import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface CreateOrganizationParams {
  businessName: string;
}

export const useCreateOrganization = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (params: CreateOrganizationParams) => {
      // Log the business name as requested
      console.log('Business Name (DBA):', params.businessName);
      
      // Here you would typically make an API call to create the organization
      // For now, we'll just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, businessName: params.businessName };
    },
    onSuccess: () => {
      // Redirect to company selection page
      router.push('/company-selection');
    },
    onError: (error: any) => {
      console.error('Failed to create organization:', error);
      throw error;
    },
  });
}; 