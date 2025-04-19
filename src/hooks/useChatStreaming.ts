import { useMutation } from '@tanstack/react-query';
import { getThreadId, parseStreamChunk, processStreamResponse, ChatMessage } from '@/lib/api/chatService';
import { MessageType } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch } from '@/lib/store/hooks';
import { addMessage, setIsResponding, updateMessage } from '@/lib/store/slices/chatSlice';
import { addToolCallResponse, setActiveToolCallId } from '@/lib/store/slices/responsePanelSlice';
import { setToolCallLoading } from '@/lib/store/slices/loadingSlice';
import { setResponsePanelWidth } from '@/lib/store/slices/chatSlice';

// Define Vega-Lite schema type to avoid 'never' errors
interface VegaLiteSchema {
  $schema: string;
  data: Record<string, any>;
  mark: string;
  encoding: Record<string, any>;
  title?: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

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
                  // Handle side panel data (e.g., graph schema from tool call)
                  if (sidePanelData.type === 'graph') {
                    try {
                      const graphSchema: VegaLiteSchema = sidePanelData.schema;
                      if (!graphSchema) {
                        console.error('No schema found in graph data:', sidePanelData);
                        return;
                      }
                      if (!graphSchema.$schema) {
                        graphSchema.$schema = 'https://vega.github.io/schema/vega-lite/v5.json';
                      }
                      dispatch(addToolCallResponse({
                        id: uuidv4(),
                        tool_call_id: parsedResponse.content?.tool_call_id || uuidv4(),
                        tool_name: 'generate_vegalite_schema',
                        data: graphSchema,
                        type: 'graph',
                        messageId: assistantMessageId,
                      }));
                      dispatch(setActiveToolCallId(parsedResponse.content?.tool_call_id || uuidv4()));
                      dispatch(setResponsePanelWidth(550)); // Open ResponsePanel
                    } catch (error) {
                      console.error('Error processing graph data:', error);
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
                  let contentObj;
                  
                  if (typeof parsedResponse.content.content === 'string' && parsedResponse.content.content.trim() !== '') {
                    // Check if the content starts with "Error:" to handle error messages properly
                    if (parsedResponse.content.content.trim().startsWith('Error:')) {
                      contentObj = { 
                        error: parsedResponse.content.content,
                        type: 'error'
                      };
                    } else {
                      try {
                        contentObj = JSON.parse(parsedResponse.content.content);
                      } catch (parseError) {
                        // If JSON parsing fails, treat as plain text
                        contentObj = { 
                          text: parsedResponse.content.content,
                          type: 'text' 
                        };
                      }
                    }
                  } else {
                    contentObj = parsedResponse.content.content || { data: parsedResponse.content.content };
                  }

                  const toolCallId = parsedResponse.content.tool_call_id;
                  const toolName = toolCalls.find(tc => tc.id === toolCallId)?.name || 'unknown';

                  // Determine the type of data
                  let dataType: 'code' | 'table' | 'graph' | 'error' | 'text' = 'code';
                  let dataContent: any = contentObj;

                  if (contentObj.type === 'error') {
                    dataType = 'error';
                    dataContent = contentObj.error;
                  } else if (contentObj.type === 'text') {
                    dataType = 'text';
                    dataContent = contentObj.text;
                  } else if (contentObj.data?.spreadsheet_url) {
                    dataType = 'table';
                    dataContent = contentObj.data.spreadsheet_url;
                  } else if (contentObj.type === 'graph') {
                    dataType = 'graph';
                    dataContent = contentObj.schema as VegaLiteSchema;
                    if (typeof dataContent === 'object' && dataContent !== null && !dataContent.$schema) {
                      dataContent.$schema = 'https://vega.github.io/schema/vega-lite/v5.json';
                    }
                  }

                  // Add tool call response to Redux
                  dispatch(addToolCallResponse({
                    id: uuidv4(),
                    tool_call_id: toolCallId,
                    tool_name: toolName,
                    data: dataContent,
                    type: dataType,
                    messageId: assistantMessageId,
                  }));

                  // Set active tab and open ResponsePanel
                  dispatch(setActiveToolCallId(toolCallId));
                  dispatch(setResponsePanelWidth(550));

                  dispatch(setToolCallLoading(false));
                } catch (error) {
                  console.error('Error handling tool response:', error);
                  
                  // Add error response to Redux for failed tool responses
                  const toolCallId = parsedResponse.content.tool_call_id;
                  const toolName = toolCalls.find(tc => tc.id === toolCallId)?.name || 'unknown';
                  
                  dispatch(addToolCallResponse({
                    id: uuidv4(),
                    tool_call_id: toolCallId,
                    tool_name: toolName,
                    data: `Error processing response: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    type: 'error',
                    messageId: assistantMessageId,
                  }));
                  
                  dispatch(setActiveToolCallId(toolCallId));
                  dispatch(setResponsePanelWidth(550));
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