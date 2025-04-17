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
        let toolCalls: { name: string; args: any; id?: string }[] = [];

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
                    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                  };

                  dispatch(updateMessage(updatedMessage));
                },
                (toolCall) => {
                  console.log('Tool call received:', toolCall);
                  if (!toolCalls.some(tc => tc.id === toolCall.id)) {
                    toolCalls = [
                      ...toolCalls,
                      {
                        name: toolCall.name,
                        args: toolCall.args,
                        id: toolCall.id,
                      },
                    ];

                    const updatedMessage: MessageType = {
                      id: assistantMessageId,
                      role: 'assistant',
                      content: accumulatedContent,
                      timestamp: new Date().toISOString(),
                      toolCalls,
                    };

                    dispatch(updateMessage(updatedMessage));
                  }
                },
                (sidePanelData) => {
                  const codeData = typeof sidePanelData === 'string' ? sidePanelData : JSON.stringify(sidePanelData, null, 2);
                  if (sidePanelData?.data?.spreadsheet_url) {
                    dispatch(setTableData(sidePanelData.data.spreadsheet_url));
                  }
                  dispatch(setCodeData(codeData));
                  if (sidePanelData.type === 'graph') {
                    try {
                      const graphSchema = sidePanelData.schema;
                      if (!graphSchema) {
                        console.error('No schema found in graph data:', sidePanelData);
                        return;
                      }
                      if (!graphSchema.$schema) {
                        graphSchema.$schema = 'https://vega.github.io/schema/vega-lite/v5.json';
                      }
                      dispatch(setVisualizationData(graphSchema));
                    } catch (error) {
                      console.error('Error processing graph data:', error);
                      dispatch(setVisualizationData([]));
                    }
                  }
                }
              );

              // Handle tool calls from the parsed response
              if (parsedResponse.content?.type === 'ai' && parsedResponse.content?.tool_calls?.length) {
                dispatch(setToolCallLoading(true));

                const newToolCalls = parsedResponse.content.tool_calls
                  .filter((toolCall: any) => !toolCalls.some(tc => tc.id === toolCall.id))
                  .map((toolCall: any) => {
                    let toolCallArgs = toolCall.args;
                    if (typeof toolCallArgs === 'string') {
                      try {
                        toolCallArgs = JSON.parse(toolCallArgs);
                      } catch (e) {
                        console.warn('Failed to parse tool call args:', e);
                      }
                    }
                    return {
                      name: toolCall.name,
                      args: toolCallArgs,
                      id: toolCall.id,
                    };
                  });

                if (newToolCalls.length > 0) {
                  toolCalls = [...toolCalls, ...newToolCalls];

                  const updatedMessage: MessageType = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp: new Date().toISOString(),
                    toolCalls,
                  };

                  dispatch(updateMessage(updatedMessage));
                }
              }

              // Handle tool responses
              if (parsedResponse.content?.type === 'tool') {
                try {
                  let contentObj = typeof parsedResponse.content.content === 'string' && parsedResponse.content.content.trim() !== ''
                    ? JSON.parse(parsedResponse.content.content)
                    : parsedResponse.content.content || { data: parsedResponse.content.content };

                  if (contentObj.data?.spreadsheet_url) {
                    dispatch(setTableData(contentObj.data.spreadsheet_url));
                  }
                  dispatch(setCodeData(JSON.stringify(contentObj, null, 2)));
                  if (contentObj.type === 'graph') {
                    try {
                      const graphSchema = contentObj.schema;
                      if (!graphSchema) {
                        console.error('No schema found in graph data:', contentObj);
                        return;
                      }
                      if (!graphSchema.$schema) {
                        graphSchema.$schema = 'https://vega.github.io/schema/vega-lite/v5.json';
                      }
                      dispatch(setVisualizationData(graphSchema));
                    } catch (error) {
                      console.error('Error processing graph data:', error);
                      dispatch(setVisualizationData([]));
                    }
                  }

                  dispatch(setToolCallLoading(false));
                } catch (error) {
                  console.error('Error handling tool response:', error);
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