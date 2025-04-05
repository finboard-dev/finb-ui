export interface ChatMessage {
  message: string;
  thread_id: string | null;
  stream_tokens: boolean;
}

export const getThreadId = (): string | null => {
  // Placeholder: Implement your thread ID logic here
  return localStorage.getItem('thread_id') || null;
};

export const parseStreamChunk = (chunk: string): any => {
  try {
    if (!chunk || chunk.trim() === '') return null;

    const jsonString = chunk.startsWith('data: ')
      ? chunk.slice(6)
      : chunk;

    if (jsonString.trim() === '[DONE]') {
      return { type: 'done' };
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing stream chunk:', error, 'Raw chunk:', chunk);
    return null;
  }
};

export const processStreamResponse = (
  response: any,
  onToken: (token: string) => void,
  onToolCall: (toolCall: any) => void
) => {
  if (!response) return;

  if (response.type === 'done') {
    // Stream is complete
    return;
  }

  if (response.type === 'token') {
    onToken(response.content);
  } else if (response.type === 'message') {
    // Don't call onToken for full messages, as we've already processed the tokens
    // This prevents duplication of content
    
    // If you need to handle any final message metadata, do it here
    // But don't add the content again with: onToken(response.content.content);
  } else if (response.type === 'tool_call') {
    onToolCall(response.content);
  }
};