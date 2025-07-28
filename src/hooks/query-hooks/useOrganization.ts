import { addOrganizationUser, deleteOrganizationUser, getOrganizationCompanies, getOrganizationUsers, updateOrganizationUser } from '@/lib/api/roles&Permissions';
import { addConnection, disconnectConnection, getOrganizationConnections } from '@/lib/api/settings';
  import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useOrganizationConnections() {
  return useQuery({
    queryKey: ['organization', 'connections'],
    queryFn: getOrganizationConnections,
    retry: 1,
  })
}

export function useAddConnection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: addConnection,
    onSuccess: () => {
      // Invalidate and refetch connections
      queryClient.invalidateQueries({ queryKey: ['organization', 'connections'] })
    },
  })
}

export function useDisconnectConnection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: disconnectConnection,
    onSuccess: () => {
      // Invalidate and refetch connections
      queryClient.invalidateQueries({ queryKey: ['organization', 'connections'] })
    },
  })
}

// Roles & Permissions hooks
export function useOrganizationCompanies() {
  return useQuery({
    queryKey: ['organization', 'companies'],
    queryFn: getOrganizationCompanies,
    retry: 1,
  })
}

export function useOrganizationUsers() {
  return useQuery({
    queryKey: ['organization', 'users'],
    queryFn: getOrganizationUsers,
    retry: 1,
  })
}

export function useAddOrganizationUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: addOrganizationUser,
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['organization', 'users'] })
    },
  })
}

export function useUpdateOrganizationUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateOrganizationUser,
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['organization', 'users'] })
    },
  })
}

export function useDeleteOrganizationUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteOrganizationUser,
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['organization', 'users'] })
    },
  })
} 