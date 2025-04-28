export interface MessageVariant {
  id: number;
  content: string;
}

export interface MentionType {
  id: string;
  name: string;
  icon: string;
  startPos: number;
  endPos: number;
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
  mentions?: MentionType[];
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

export interface ChatState {
  messages: MessageType[];
  isResponding: boolean;
  responseVariants: { id: number; title: string }[];
  selectedVariant: number;
  isSidebarOpen: boolean;
  responsePanelWidth: number;
  activeMessageId: string | null;
}

export interface ChatsHistory {
  id: string;
  name: string;
  chats: ChatState[];
}