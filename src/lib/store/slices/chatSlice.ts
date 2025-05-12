import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { v4 as uuidv4 } from "uuid"
import type { AllChats, ChatState, MessageType, ChatConversation, ContentPart } from "@/types/chat"

export const PANEL_CLOSED_WIDTH = 0
export const PANEL_DEFAULT_WIDTH = 30

const initialChatState: ChatState = {
  messages: [],
  isResponding: false,
  responseVariants: [],
  selectedVariant: 1,
  isSidebarOpen: true,
  responsePanelWidth: PANEL_CLOSED_WIDTH,
  activeMessageId: null,
  selectedAssistantId: "",
}

interface MultiChatState {
  chats: AllChats[]
  activeChatId: string | null
  pendingChat: AllChats | null // Store a pending chat that hasn't been started yet
}

const defaultChatId = uuidv4()

const initialState: MultiChatState = {
  chats: [],
  activeChatId: defaultChatId,
  pendingChat: {
    id: defaultChatId,
    name: "New Chat",
    thread_id: uuidv4(),
    assistantId: "",
    chats: [{ ...initialChatState }],
  },
}

const mapApiMessagesToMessageType = (apiMessages: any[]): MessageType[] => {
  const messages: MessageType[] = []
  let lastRole: "user" | "assistant" = "assistant"

  apiMessages.forEach((apiMessage) => {
    const isHuman = apiMessage.type === "human"
    const role = isHuman ? "user" : "assistant"

    if (!isHuman && lastRole === "assistant") {
      lastRole = "assistant"
    } else {
      lastRole = role
    }

    const contentParts: ContentPart[] = []
    if (apiMessage.content) {
      contentParts.push({ type: "text", content: apiMessage.content })
    }

    const toolCalls =
        apiMessage.tool_calls?.map((tc: any) => ({
          name: tc.name,
          args: tc.args,
          id: tc.id,
          position: tc.position,
        })) || []

    toolCalls.forEach((tc: any) => {
      contentParts.push({ type: "toolCall", toolCallId: tc.id })
    })

    const message: MessageType = {
      id: apiMessage.id || uuidv4(),
      role: lastRole,
      content: contentParts,
      timestamp: new Date().toISOString(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      mentions: apiMessage.mentions || [],
      model: apiMessage.response_metadata?.model_name
          ? { id: apiMessage.response_metadata.model_name, name: apiMessage.response_metadata.model_name }
          : undefined,
      messageId: apiMessage.id || undefined,
      variants: apiMessage.variants || undefined,
      isError: apiMessage.response_metadata?.finish_reason === "error",
    }

    messages.push(message)
  })

  return messages
}

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChatsFromAPI(state, action: PayloadAction<ChatConversation[]>) {
      const newChats = action.payload.map((conv) => {
        // Check if chat already exists to preserve messages
        const existingChat = state.chats.find((c) => c.id === conv.id)
        return {
          id: conv.id,
          name: conv.name,
          thread_id: conv.threadId,
          assistantId: conv.assistantId,
          chats: [
            {
              ...(existingChat?.chats[0] || initialChatState),
              selectedAssistantId: conv.assistantId,
            },
          ],
        }
      })

      state.chats = newChats

      // If we have chats from API, use the first one as active
      if (newChats.length > 0) {
        state.activeChatId = newChats[0].id
        state.pendingChat = null
      } else {
        // If no chats from API, ensure we have a pending chat
        if (!state.pendingChat) {
          const newPendingChat = {
            id: uuidv4(),
            name: "New Chat",
            thread_id: uuidv4(),
            assistantId: "",
            chats: [{ ...initialChatState }],
          }
          state.pendingChat = newPendingChat
          state.activeChatId = newPendingChat.id
        }
      }
    },
    loadChatMessages(state, action: PayloadAction<{ chatId: string; messages: any[] }>) {
      const { chatId, messages } = action.payload

      // Check if this is for the pending chat
      if (state.pendingChat && state.pendingChat.id === chatId) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].messages = mapApiMessagesToMessageType(messages)
        }
        return
      }

      // Otherwise check regular chats
      const chat = state.chats.find((c) => c.id === chatId)
      if (chat && chat.chats[0]) {
        chat.chats[0].messages = mapApiMessagesToMessageType(messages)
      }
    },
    initializeNewChat(state, action: PayloadAction<{ assistantId: string }>) {
      // Create a new pending chat
      const newPendingChat: AllChats = {
        id: uuidv4(),
        name: "New Chat",
        thread_id: uuidv4(),
        assistantId: action.payload.assistantId,
        chats: [
          {
            ...initialChatState,
            selectedAssistantId: action.payload.assistantId,
          },
        ],
      }

      // If there's already a pending chat with no messages, replace it
      if (
          state.pendingChat &&
          (!state.pendingChat.chats[0].messages || state.pendingChat.chats[0].messages.length === 0)
      ) {
        state.pendingChat = newPendingChat
        state.activeChatId = newPendingChat.id
      } else {
        // Otherwise, create a new pending chat
        state.pendingChat = newPendingChat
        state.activeChatId = newPendingChat.id
      }
    },
    confirmPendingChat(state) {
      // Only add the pending chat to the chats list if it has messages
      if (state.pendingChat && state.pendingChat.chats[0].messages && state.pendingChat.chats[0].messages.length > 0) {
        state.chats.unshift(state.pendingChat)
        state.activeChatId = state.pendingChat.id
        state.pendingChat = null
      }
    },
    setSelectedAssistantId(state, action: PayloadAction<{ chatId: string; assistantId: string }>) {
      const { chatId, assistantId } = action.payload

      // Check if this is for the pending chat
      if (state.pendingChat && state.pendingChat.id === chatId) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].selectedAssistantId = assistantId
          state.pendingChat.assistantId = assistantId
        }
        return
      }

      // Otherwise check regular chats
      const chat = state.chats.find((c) => c.id === chatId)
      if (chat && chat.chats[0]) {
        chat.chats[0].selectedAssistantId = assistantId
        chat.assistantId = assistantId
      }
    },
    removeChat(state, action: PayloadAction<string>) {
      const chatIdToRemove = action.payload
      state.chats = state.chats.filter((chat) => chat.id !== chatIdToRemove)

      // If we removed the active chat
      if (state.activeChatId === chatIdToRemove) {
        if (state.chats.length > 0) {
          // Set the first available chat as active
          state.activeChatId = state.chats[0].id
        } else {
          // Create a new pending chat if no chats remain
          const newPendingChat = {
            id: uuidv4(),
            name: "New Chat",
            thread_id: uuidv4(),
            assistantId: "",
            chats: [{ ...initialChatState }],
          }
          state.pendingChat = newPendingChat
          state.activeChatId = newPendingChat.id
        }
      }
    },
    setActiveChatId(state, action: PayloadAction<string>) {
      state.activeChatId = action.payload
    },
    renameChatById(state, action: PayloadAction<{ chatId: string; name: string }>) {
      const { chatId, name } = action.payload

      // Check if this is for the pending chat
      if (state.pendingChat && state.pendingChat.id === chatId) {
        state.pendingChat.name = name
        return
      }

      // Otherwise check regular chats
      const chat = state.chats.find((c) => c.id === chatId)
      if (chat) {
        chat.name = name
      }
    },
    addMessage(state, action: PayloadAction<{ chatId: string; message: MessageType }>) {
      const { chatId, message } = action.payload

      // Check if this is for the pending chat
      if (state.pendingChat && state.pendingChat.id === chatId) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].messages.push(message)

          // If this is a user message, confirm the pending chat
          if (message.role === "user") {
            state.chats.unshift(state.pendingChat)
            state.activeChatId = state.pendingChat.id
            state.pendingChat = null
          }
        }
        return
      }

      // Otherwise add to regular chats
      const chat = state.chats.find((c) => c.id === chatId)
      if (chat && chat.chats[0]) {
        chat.chats[0].messages.push(message)
      }
    },
    updateMessage(state, action: PayloadAction<{ chatId: string; message: MessageType }>) {
      const { chatId, message } = action.payload

      // Check if this is for the pending chat
      if (state.pendingChat && state.pendingChat.id === chatId) {
        if (state.pendingChat.chats[0]) {
          const messageIndex = state.pendingChat.chats[0].messages.findIndex((m) => m.id === message.id)
          if (messageIndex !== -1) {
            const existingMessage = state.pendingChat.chats[0].messages[messageIndex]
            const newMessage = { ...message }
            if (existingMessage.toolCalls && newMessage.toolCalls) {
              newMessage.toolCalls = newMessage.toolCalls.map((tc) => {
                const existingTc = existingMessage.toolCalls?.find((etc) => etc.id === tc.id)
                return existingTc ? { ...tc, position: existingTc.position } : tc
              })
            }
            state.pendingChat.chats[0].messages[messageIndex] = newMessage
          }
        }
        return
      }

      // Otherwise update in regular chats
      const chat = state.chats.find((c) => c.id === chatId)
      if (chat && chat.chats[0]) {
        const messageIndex = chat.chats[0].messages.findIndex((m) => m.id === message.id)
        if (messageIndex !== -1) {
          const existingMessage = chat.chats[0].messages[messageIndex]
          const newMessage = { ...message }
          if (existingMessage.toolCalls && newMessage.toolCalls) {
            newMessage.toolCalls = newMessage.toolCalls.map((tc) => {
              const existingTc = existingMessage.toolCalls?.find((etc) => etc.id === tc.id)
              return existingTc ? { ...tc, position: existingTc.position } : tc
            })
          }
          chat.chats[0].messages[messageIndex] = newMessage
        }
      }
    },
    setIsResponding(state, action: PayloadAction<boolean>) {
      // Check if this is for the pending chat
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].isResponding = action.payload
        }
        return
      }

      // Otherwise update in regular chats
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].isResponding = action.payload
      }
    },
    setSelectedVariant(state, action: PayloadAction<number>) {
      // Check if this is for the pending chat
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].selectedVariant = action.payload
        }
        return
      }

      // Otherwise update in regular chats
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].selectedVariant = action.payload
      }
    },
    toggleSidebar(state) {
      // Check if this is for the pending chat
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].isSidebarOpen = !state.pendingChat.chats[0].isSidebarOpen
        }
        return
      }

      // Otherwise update in regular chats
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].isSidebarOpen = !activeChat.chats[0].isSidebarOpen
      }
    },
    setResponsePanelWidth(state, action: PayloadAction<number>) {
      // Check if this is for the pending chat
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].responsePanelWidth = Math.max(0, Math.min(100, action.payload))
        }
        return
      }

      // Otherwise update in regular chats
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = Math.max(0, Math.min(100, action.payload))
      }
    },
    openResponsePanel(state) {
      // Check if this is for the pending chat
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].responsePanelWidth = PANEL_DEFAULT_WIDTH
        }
        return
      }

      // Otherwise update in regular chats
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = PANEL_DEFAULT_WIDTH
      }
    },
    closeResponsePanel(state) {
      // Check if this is for the pending chat
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].responsePanelWidth = PANEL_CLOSED_WIDTH
          state.pendingChat.chats[0].activeMessageId = null
        }
        return
      }

      // Otherwise update in regular chats
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = PANEL_CLOSED_WIDTH
        activeChat.chats[0].activeMessageId = null
      }
    },
    setActiveMessageId(state, action: PayloadAction<string | null>) {
      // Check if this is for the pending chat
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].activeMessageId = action.payload
          if (action.payload) {
            state.pendingChat.chats[0].responsePanelWidth = PANEL_DEFAULT_WIDTH
          } else {
            state.pendingChat.chats[0].responsePanelWidth = PANEL_CLOSED_WIDTH
          }
        }
        return
      }

      // Otherwise update in regular chats
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].activeMessageId = action.payload
        if (action.payload) {
          activeChat.chats[0].responsePanelWidth = PANEL_DEFAULT_WIDTH
        } else {
          activeChat.chats[0].responsePanelWidth = PANEL_CLOSED_WIDTH
        }
      }
    },
    clearMessages(state, action: PayloadAction<string>) {
      const chatId = action.payload

      // Check if this is for the pending chat
      if (state.pendingChat && state.pendingChat.id === chatId) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].messages = []
        }
        return
      }

      // Otherwise update in regular chats
      const chat = state.chats.find((c) => c.id === chatId)
      if (chat && chat.chats[0]) {
        chat.chats[0].messages = []
      }
    },
  },
})

export const {
  setChatsFromAPI,
  loadChatMessages,
  initializeNewChat,
  confirmPendingChat,
  setSelectedAssistantId,
  removeChat,
  setActiveChatId,
  renameChatById,
  addMessage,
  updateMessage,
  setIsResponding,
  setSelectedVariant,
  toggleSidebar,
  setResponsePanelWidth,
  openResponsePanel,
  closeResponsePanel,
  setActiveMessageId,
  clearMessages,
} = chatSlice.actions

export default chatSlice.reducer
