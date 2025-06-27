import { useQuery } from '@tanstack/react-query'
import { fetcher } from '@/lib/axios/config'

export function useChatConversation(threadId: string, isEnabled: boolean = true) {
  return useQuery({
    queryKey: ['chat-conversation', threadId],
    queryFn: async () => {
      const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/chat/conversation?threadId=${threadId}`);
      console.log("Fetched conversation data:", response);
      return response;
    },
    retry: 1,
    enabled: isEnabled && !!threadId,
  })
} 