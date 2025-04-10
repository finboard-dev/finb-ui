// types/chat.ts
export interface MessageVariant {
  id: number;
  content: string;
}

// src/types/chat.ts
export interface MessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  variants?: { id: number; content: string }[]; // Optional for response variants
}

export interface ToolCall {
  name: string;
  args: Record<string, any>;
  id?: string;
}

export interface ToolResponse {
  id?: string;
  content: string;
  tool_calls?: ToolCall[];
}