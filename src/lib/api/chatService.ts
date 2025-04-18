import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  message: string;
  thread_id: string | null;
  stream_tokens: boolean;
}

export const getThreadId = (): string | null => {
  const generateId = uuidv4();
  const savedId = localStorage.getItem('thread_id');
  if (savedId) {
    return savedId;
  } else {
    localStorage.setItem('thread_id', generateId);
    return generateId;
  }
};

let jsonBuffer: string = '';

export const parseStreamChunk = (chunk: string): any => {
  try {
    if (!chunk || chunk.trim() === '') return null;

    // Remove 'data: ' prefix if present
    const jsonString = chunk.startsWith('data: ') ? chunk.slice(6) : chunk;

    if (jsonString.trim() === '[DONE]') {
      jsonBuffer = ''; // Reset buffer on stream end
      return { type: 'done' };
    }

    // Append chunk to buffer
    jsonBuffer += jsonString;

    // Try to parse the buffered content
    // Only attempt parsing if the buffer looks like a complete JSON object
    if (jsonBuffer.trim().startsWith('{') && jsonBuffer.trim().endsWith('}')) {
      const parsed = JSON.parse(jsonBuffer);
      jsonBuffer = ''; // Reset buffer after successful parsing
      return parsed;
    }

    // If the buffer doesn't form a complete JSON object yet, return null
    return null;
  } catch (error) {
    console.error('Error parsing stream chunk:', error, 'Raw chunk:', chunk, 'Buffer:', jsonBuffer);
    // Don't reset the buffer here; keep accumulating
    return null;
  }
};

export const processStreamResponse = (
  response: any,
  onToken: (token: string) => void,
  onToolCall: (toolCall: any) => void,
  onSidePanelData?: (data: any) => void
) => {
  if (!response) return;

  if (response.type === 'done') {
    return;
  }

  if (response.type === 'token') {
  } else if (response.type === 'error') {
    onToken(response.content);
  } else if (response.type === 'message') {
    if (response.content?.type === 'ai' && response.content?.content !== '') {
      onToken(response.content.content);
    } else if (response.content?.type === 'ai' && response.content?.tool_calls?.[0]?.name) {
      onToolCall(response.content?.tool_calls[0]);
    } else if (response.content?.type === 'tool') {
      console.log('Tool call:', response.content);

      if (typeof response.content.content === 'string' && response.content.content.trim() !== '') {
        // Check if content starts with "Error:" to handle error messages properly
        if (response.content.content.trim().startsWith('Error:')) {
          if (onSidePanelData) {
            onSidePanelData({
              type: 'error',
              error: response.content.content
            });
          }
        } else {
          try {
            const toolContent = JSON.parse(response.content.content);
            if (onSidePanelData) {
              onSidePanelData(toolContent);
            }
          } catch (error) {
            // If JSON parsing fails, handle as plain text
            if (onSidePanelData) {
              onSidePanelData({
                type: 'text',
                text: response.content.content
              });
            }
            console.warn('Failed to parse tool response as JSON:', error, 'Content:', response.content.content);
          }
        }
      } else if (typeof response.content.content === 'object') {
        if (onSidePanelData) {
          onSidePanelData(response.content.content);
        }
      }
    }
  }
};