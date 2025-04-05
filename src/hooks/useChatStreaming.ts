import { useMutation } from '@tanstack/react-query';
import { getThreadId, parseStreamChunk, processStreamResponse, ChatMessage } from '@/lib/api/chatService';
import { MessageType } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch } from '@/lib/store/hooks';
import { addMessage, setIsResponding , updateMessage} from '@/lib/store/slices/chatSlice';

export const useChatStream = () => {
  const dispatch = useAppDispatch();

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      // Add user message to the store
      const userMessage: MessageType = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      dispatch(addMessage(userMessage));
      dispatch(setIsResponding(true));

      // Create assistant message placeholder
      const assistantMessageId = uuidv4();
      const assistantMessage: MessageType = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      dispatch(addMessage(assistantMessage));

      // Prepare request payload
      const chatMessage: ChatMessage = {
        message,
        thread_id: getThreadId(),
        stream_tokens: true,
      };

      try {
        // Set up streaming request
        const response = await fetch(process.env.NEXT_PUBLIC_API_CHAT || '', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chatMessage),
        });

        if (!response.body) {
          throw new Error('Response body is null');
        }

        // Process the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            const parsedResponse = parseStreamChunk(line);

            if (parsedResponse) {
              processStreamResponse(
                parsedResponse,
                (token) => {
                  // Handle token updates
                  accumulatedContent += token;

                  // Update assistant message with new content
                  const updatedMessage: MessageType = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date().toISOString(),
                  };

                  // Use updateMessage instead of addMessage
                  dispatch(updateMessage(updatedMessage));
                },
                (toolCall) => {
                  // Handle tool calls if needed
                  console.log('Tool call received:', toolCall);
                }
              );
            }
          }
        }

        dispatch(setIsResponding(false));
        return accumulatedContent;
      } catch (error) {
        console.error('Error in chat stream:', error);
        dispatch(setIsResponding(false));
        throw error;
      }
    },
  });

  return { sendMessage };
};