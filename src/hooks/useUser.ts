import { BEARER_TOKEN } from '@/constants'
import { useQuery } from '@tanstack/react-query'

type User = {
  isEnabled: boolean
}

export function useUser({ isEnabled = true }: User) {
  console.log('Fetching user data...')
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_CHAT}/users/me`, {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      
      return response.json()
    },
    retry: 1, 
    enabled: isEnabled,
  })
}