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

export const parseStreamChunk = (chunk: string): any => {
  try {
    if (!chunk || chunk.trim() === '') return null;

    // Handle 'data: ' prefix and [DONE]
    if (chunk.trim() === 'data: [DONE]') {
      return { type: 'done' };
    }

    // Extract the JSON string from the chunk
    const jsonString = chunk.startsWith('data:') ? chunk.slice(5).trim() : chunk.trim();

    // Parse the JSON
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Failed to parse JSON from chunk:', jsonString);
      return null;
    }
  } catch (error) {
    console.error('Error parsing stream chunk:', error, 'Raw chunk:', chunk);
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

  // Handle done message
  if (response.type === 'done') {
    return;
  }

  // Handle token response
  if (response.type === 'token' && response.content) {
    onToken(response.content);
    return;
  }

  // Handle message response
  if (response.type === 'message') {
    const { content } = response;

    // Handle AI response with text content
    if (content?.type === 'ai' && content?.content && typeof content.content === 'string') {
      onToken(content.content);
    }

    // Handle AI response with tool calls
    if (content?.type === 'ai' && content?.tool_calls?.length) {
      content.tool_calls.forEach((toolCall: any) => {
        onToolCall({
          name: toolCall.name,
          args: toolCall.args,
          id: toolCall.id,
        });
      });
    }

    // Handle tool response
    if (content?.type === 'tool' && content?.content) {
      try {
        let toolContent;
        if (typeof content.content === 'string' && content.content.trim() !== '') {
          if (content.content.trim().startsWith('Error:')) {
            toolContent = { type: 'error', error: content.content };
          } else {
            try {
              toolContent = JSON.parse(content.content);
            } catch (error) {
              toolContent = { type: 'text', text: content.content };
              console.warn('Failed to parse tool response as JSON:', error, 'Content:', content.content);
            }
          }
        } else if (typeof content.content === 'object') {
          toolContent = content.content;
        } else {
          toolContent = { type: 'text', text: content.content || '' };
        }

        if (onSidePanelData) {
          onSidePanelData(toolContent);
        }
      } catch (error) {
        console.error('Error processing tool response:', error);
        if (onSidePanelData) {
          onSidePanelData({ type: 'error', error: `Failed to process tool response: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
      }
    }
  }
};