import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getOrganizationConnections, 
  addConnection, 
  disconnectConnection 
} from '@/lib/api/settings'
import { 
  getOrganizationCompanies, 
  getOrganizationUsers, 
  addOrganizationUser, 
  updateOrganizationUser, 
  deleteOrganizationUser 
} from '@/lib/api/roles&Permissions'

// Settings/Connections hooks
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