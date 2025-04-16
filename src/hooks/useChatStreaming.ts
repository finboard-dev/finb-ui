import { useMutation } from '@tanstack/react-query';
import { getThreadId, parseStreamChunk, processStreamResponse, ChatMessage } from '@/lib/api/chatService';
import { MessageType } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch } from '@/lib/store/hooks';
import { addMessage, setIsResponding, updateMessage } from '@/lib/store/slices/chatSlice';
import { setCodeData, setTableData, setVisualizationData } from '@/lib/store/slices/responsePanelSlice';
import { setToolCallLoading } from '@/lib/store/slices/loadingSlice';

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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_CHAT!}/chat/stream`, {
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
        let hasToolCall = false;
        let toolCallName = '';
        let toolCallArgs: null = null;

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
                  accumulatedContent += token;

                  const updatedMessage: MessageType = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date().toISOString(),
                    ...(hasToolCall && {
                      toolCall: {
                        name: toolCallName,
                        args: toolCallArgs
                      }
                    })
                  };

                  dispatch(updateMessage(updatedMessage));
                },
                (toolCall) => {
                  console.log('Tool call received:', toolCall);
                },
                (sidePanelData) => {
                  const codeData = typeof sidePanelData === 'string' ? sidePanelData : JSON.stringify(sidePanelData, null, 2);
                  if (sidePanelData?.data?.spreadsheet_url) {
                    dispatch(setTableData(sidePanelData.data.spreadsheet_url));
                  }
                  dispatch(setCodeData(codeData));
                  if (sidePanelData.type === "graph") {
                    try {
                      const graphSchema = sidePanelData.schema;
                      if (!graphSchema) {
                        console.error('No schema found in graph data:', sidePanelData);
                        return;
                      }
                      if (!graphSchema.$schema) {
                        graphSchema.$schema = "https://vega.github.io/schema/vega-lite/v5.json";
                      }
                      dispatch(setVisualizationData(graphSchema));
                    } catch (error) {
                      console.error('Error processing graph data:', error);
                      dispatch(setVisualizationData([]));
                    }
                  }
                }
              );
              
              // Handle tool calls
              if (parsedResponse.content?.type === 'ai' && parsedResponse.content?.tool_calls?.[0]?.name) {
                hasToolCall = true;
                toolCallName = parsedResponse.content.tool_calls[0].name;
                
                const toolCallArgsRaw = parsedResponse.content?.tool_calls?.[0]?.args;
                if (toolCallArgsRaw) {
                  try {
                    toolCallArgs = typeof toolCallArgsRaw === 'string' 
                      ? JSON.parse(toolCallArgsRaw) 
                      : toolCallArgsRaw;
                  } catch (e) {
                    console.warn('Failed to parse tool call args:', e);
                    toolCallArgs = toolCallArgsRaw; 
                  }
                }
                
                dispatch(setToolCallLoading(true));
                
                const updatedMessage: MessageType = {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: accumulatedContent,
                  timestamp: new Date().toISOString(),
                  toolCall: {
                    name: toolCallName,
                    args: toolCallArgs
                  }
                };
                
                dispatch(updateMessage(updatedMessage));
              }
              
              if (hasToolCall && 
                  parsedResponse.content?.content !== undefined && 
                  parsedResponse.content?.type === 'tool') {
                try {
                  let contentObj;
                  
                  if (typeof parsedResponse.content.content === 'string' && 
                      parsedResponse.content.content.trim() !== '') {
                    try {
                      contentObj = JSON.parse(parsedResponse.content.content);
                    } catch (parseError) {
                      console.warn('Error parsing tool content:', parseError);
                      contentObj = { data: parsedResponse.content.content };
                    }
                  } else if (typeof parsedResponse.content.content === 'object') {
                    // Content is already an object
                    contentObj = parsedResponse.content.content;
                  } else {
                    // Default fallback
                    contentObj = { data: parsedResponse.content.content };
                  }
                  
                  // Extract args from content object
                  toolCallArgs = parsedResponse.content?.tool_calls?.[0]?.args
                  
                  // Update the message with tool call args
                  const updatedMessage: MessageType = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date().toISOString(),
                    toolCall: {
                      name: toolCallName,
                      args: toolCallArgs
                    }
                  };
                  
                  dispatch(updateMessage(updatedMessage));
                  
                  // Set loading state to false when tool call response is received
                  dispatch(setToolCallLoading(false));
                } catch (error) {
                  console.error('Error handling tool response:', error);
                  
                  // Attempt to continue gracefully
                  dispatch(setToolCallLoading(false));
                }
              }
            }
          }
        }

        dispatch(setIsResponding(false));
        return accumulatedContent;
      } catch (error) {
        console.error('Error in chat stream:', error);

        const updatedMessage: MessageType = {
          id: assistantMessageId,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true,
        };

        dispatch(updateMessage(updatedMessage));
        dispatch(setIsResponding(false));
        dispatch(setToolCallLoading(false));
        throw error;
      }
    },
  });

  return { sendMessage };
};