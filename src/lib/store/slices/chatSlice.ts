import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { ChatState, MessageType } from "@/types/chat"
import { v4 as uuidv4 } from "uuid"
import type { AllChats } from "@/types/chat"

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
}

const defaultChatId = uuidv4()

const initialState: MultiChatState = {
  chats: [
    {
      id: defaultChatId,
      name: "New Chat",
      thread_id: uuidv4(),
      chats: [{ ...initialChatState }],
    },
  ],
  activeChatId: defaultChatId,
}

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addChat(state) {
      const newChat: AllChats = {
        id: uuidv4(),
        name: "New Chat",
        thread_id: uuidv4(),
        chats: [
          {
            messages: [],
            isResponding: false,
            responseVariants: [],
            selectedVariant: 1,
            isSidebarOpen: true,
            responsePanelWidth: PANEL_CLOSED_WIDTH,
            activeMessageId: null,
            selectedAssistantId: "", // Initialize with empty string
          },
        ],
      }
      state.chats.push(newChat)
      state.activeChatId = newChat.id
    },

    // Add a new action to set the selected assistant for a specific chat
    setSelectedAssistantId(state, action: PayloadAction<{ chatId: string; assistantId: string }>) {
      const { chatId, assistantId } = action.payload
      const chat = state.chats.find((c) => c.id === chatId)
      if (chat && chat.chats[0]) {
        chat.chats[0].selectedAssistantId = assistantId
      }
    },

    // Keep all the existing reducers...
    removeChat(state, action: PayloadAction<string>) {
      const chatIdToRemove = action.payload
      state.chats = state.chats.filter((chat) => chat.id !== chatIdToRemove)

      // If we removed the active chat, select another one
      if (state.activeChatId === chatIdToRemove && state.chats.length > 0) {
        state.activeChatId = state.chats[0].id
      } else if (state.chats.length === 0) {
        state.activeChatId = null
      }
    },

    setActiveChatId(state, action: PayloadAction<string>) {
      state.activeChatId = action.payload
    },

    renameChatById(state, action: PayloadAction<{ chatId: string; name: string }>) {
      const { chatId, name } = action.payload
      const chat = state.chats.find((c) => c.id === chatId)
      if (chat) {
        chat.name = name
      }
    },

    // Individual chat actions
    addMessage(state, action: PayloadAction<{ chatId: string; message: MessageType }>) {
      const chat = state.chats.find((c) => c.id === action.payload.chatId)
      if (chat && chat.chats[0]) {
        chat.chats[0].messages.push(action.payload.message)
      }
    },

    updateMessage(state, action: PayloadAction<{ chatId: string; message: MessageType }>) {
      const chat = state.chats.find((c) => c.id === action.payload.chatId)
      if (chat && chat.chats[0]) {
        const messageIndex = chat.chats[0].messages.findIndex((m) => m.id === action.payload.message.id)
        if (messageIndex !== -1) {
          chat.chats[0].messages[messageIndex] = action.payload.message
        }
      }
    },

    setIsResponding(state, action: PayloadAction<boolean>) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].isResponding = action.payload
      }
    },

    setSelectedVariant(state, action: PayloadAction<number>) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].selectedVariant = action.payload
      }
    },

    toggleSidebar(state) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].isSidebarOpen = !activeChat.chats[0].isSidebarOpen
      }
    },

    setResponsePanelWidth(state, action: PayloadAction<number>) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = Math.max(0, Math.min(100, action.payload))
      }
    },

    openResponsePanel(state) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = PANEL_DEFAULT_WIDTH
      }
    },

    closeResponsePanel(state) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId)
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = PANEL_CLOSED_WIDTH
        activeChat.chats[0].activeMessageId = null
      }
    },

    setActiveMessageId(state, action: PayloadAction<string | null>) {
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
      const chat = state.chats.find((c) => c.id === chatId)
      if (chat && chat.chats[0]) {
        chat.chats[0].messages = []
      }
    },
  },
})

export const {
  addChat,
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
  setSelectedAssistantId, // Export the new action
} = chatSlice.actions

export default chatSlice.reducer
