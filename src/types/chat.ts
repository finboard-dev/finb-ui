import { v4 as uuidv4 } from "uuid"

export interface ToolCall {
  name: string
  args: Record<string, any>
  id?: string
  position?: number
}

export interface ToolResponse {
  id?: string
  content: string
  tool_calls?: ToolCall[]
}

export interface MentionType {
  id: string
  name: string
  icon: string
  startPos: number
  endPos: number
}

export type Tool = {
  id: string
  name: string
  description: string
  category: string
}

export type Model = {
  id: string
  name: string
}

export type ContentPart =
    | { type: "text"; content: string }
    | { type: "toolCall"; toolCallId: string | undefined }

export interface MessageType {
  id: string
  role: "user" | "assistant" | "system"
  content: ContentPart[]
  timestamp: string
  mentions?: Tool[]
  model?: Model
  messageId?: string
  variants?: { id: number; content: ContentPart[] }[]
  toolCalls?: ToolCall[]
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
  selectedAssistantId: string
}

export interface AllChats {
  id: string
  name: string
  thread_id: string
  assistantId: string
  chats: ChatState[]
}

export interface Assistant {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tools: Tool[];
}

export interface CompanyRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface ChatConversation {
  id: string;
  name: string;
  threadId: string;
  lastMessageAt: string;
  assistantId: string;
}