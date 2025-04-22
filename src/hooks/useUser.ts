import { BEARER_TOKEN } from '@/constants'
import { fetcher } from '@/lib/axios/config'
import { useQuery } from '@tanstack/react-query'

type User = {
  isEnabled: boolean
}

export function useUser({ isEnabled = true }: User) {
  console.log('Fetching user data...')
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      return fetcher.get(`/user/me`);
    },
    retry: 1, 
    enabled: isEnabled,
  })
}