export interface MessageVariant {
  id: number;
  content: string;
}

export interface MessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  variants?: {
    id: number;
    content: string;
  }[];
  isError?: boolean;
  toolCalls?: {
    name: string;
    args: any;
    id?: string;
  }[];
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