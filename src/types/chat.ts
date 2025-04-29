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

export interface MentionType {
  id: string
  name: string
  icon: string
  startPos: number
  endPos: number
}

export interface MessageType {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  mentions?: MentionType[]
  variants?: { id: number; content: string }[]
  toolCalls?: { name: string; args: any; id?: string }[]
  isError?: boolean
}

export interface ChatState {
  messages: MessageType[]
  isResponding: boolean
  responseVariants: any[]
  selectedVariant: number
  isSidebarOpen: boolean
  responsePanelWidth: number
  activeMessageId: string | null
}

export interface AllChats {
  id: string
  name: string
  thread_id: string
  chats: ChatState[]
}
