import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import type {AllChats, ChatState, MessageType, ChatConversation, ContentPart} from "@/types/chat";

export const PANEL_CLOSED_WIDTH = 0;
export const PANEL_DEFAULT_WIDTH = 30;

const initialChatState: ChatState = {
  messages: [],
  isResponding: false,
  responseVariants: [],
  selectedVariant: 1,
  isSidebarOpen: true,
  responsePanelWidth: PANEL_CLOSED_WIDTH,
  activeMessageId: null,
  selectedAssistantId: "",
};

interface MultiChatState {
  chats: AllChats[];
  activeChatId: string | null;
}

const defaultChatId = uuidv4();

const initialState: MultiChatState = {
  chats: [
    {
      id: defaultChatId,
      name: "New Chat",
      thread_id: uuidv4(),
      assistantId: "",
      chats: [{ ...initialChatState }],
    },
  ],
  activeChatId: defaultChatId,
};

const mapApiMessagesToMessageType = (apiMessages: any[]): MessageType[] => {
  const messages: MessageType[] = [];
  let lastRole: "user" | "assistant" = "assistant";

  apiMessages.forEach((apiMessage) => {
    const isHuman = apiMessage.type === "human";
    const role = isHuman ? "user" : "assistant";

    if (!isHuman && lastRole === "assistant") {
      lastRole = "assistant";
    } else {
      lastRole = role;
    }

    const contentParts: ContentPart[] = [];
    if (apiMessage.content) {
      contentParts.push({ type: "text", content: apiMessage.content });
    }

    const toolCalls = apiMessage.tool_calls?.map((tc: any) => ({
      name: tc.name,
      args: tc.args,
      id: tc.id,
      position: tc.position,
    })) || [];

    toolCalls.forEach((tc: any) => {
      contentParts.push({ type: "toolCall", toolCallId: tc.id });
    });

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
    };

    messages.push(message);
  });

  return messages;
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChatsFromAPI(state, action: PayloadAction<ChatConversation[]>) {
      const newChats = action.payload.map((conv) => {
        // Check if chat already exists to preserve messages
        const existingChat = state.chats.find((c) => c.id === conv.id);
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
        };
      });

      state.chats = newChats;
      state.activeChatId = newChats.length > 0 ? newChats[0].id : null;
    },
    loadChatMessages(state, action: PayloadAction<{ chatId: string; messages: any[] }>) {
      const { chatId, messages } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat && chat.chats[0]) {
        chat.chats[0].messages = mapApiMessagesToMessageType(messages);
      }
    },
    addChat(state, action: PayloadAction<{ assistantId: string }>) {
      const newChat: AllChats = {
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
      };
      state.chats.unshift(newChat);
      state.activeChatId = newChat.id;
    },
    setSelectedAssistantId(state, action: PayloadAction<{ chatId: string; assistantId: string }>) {
      const { chatId, assistantId } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat && chat.chats[0]) {
        chat.chats[0].selectedAssistantId = assistantId;
        chat.assistantId = assistantId;
      }
    },
    removeChat(state, action: PayloadAction<string>) {
      const chatIdToRemove = action.payload;
      state.chats = state.chats.filter((chat) => chat.id !== chatIdToRemove);
      if (state.activeChatId === chatIdToRemove && state.chats.length > 0) {
        state.activeChatId = state.chats[0].id;
      } else if (state.chats.length === 0) {
        state.activeChatId = null;
      }
    },
    setActiveChatId(state, action: PayloadAction<string>) {
      state.activeChatId = action.payload;
    },
    renameChatById(state, action: PayloadAction<{ chatId: string; name: string }>) {
      const { chatId, name } = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.name = name;
      }
    },
    addMessage(state, action: PayloadAction<{ chatId: string; message: MessageType }>) {
      const chat = state.chats.find((c) => c.id === action.payload.chatId);
      if (chat && chat.chats[0]) {
        chat.chats[0].messages.push(action.payload.message);
      }
    },
    updateMessage(state, action: PayloadAction<{ chatId: string; message: MessageType }>) {
      const chat = state.chats.find((c) => c.id === action.payload.chatId);
      if (chat && chat.chats[0]) {
        const messageIndex = chat.chats[0].messages.findIndex((m) => m.id === action.payload.message.id);
        if (messageIndex !== -1) {
          const existingMessage = chat.chats[0].messages[messageIndex];
          const newMessage = { ...action.payload.message };
          if (existingMessage.toolCalls && newMessage.toolCalls) {
            newMessage.toolCalls = newMessage.toolCalls.map((tc) => {
              const existingTc = existingMessage.toolCalls?.find((etc) => etc.id === tc.id);
              return existingTc ? { ...tc, position: existingTc.position } : tc;
            });
          }
          chat.chats[0].messages[messageIndex] = newMessage;
        }
      }
    },
    setIsResponding(state, action: PayloadAction<boolean>) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].isResponding = action.payload;
      }
    },
    setSelectedVariant(state, action: PayloadAction<number>) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].selectedVariant = action.payload;
      }
    },
    toggleSidebar(state) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].isSidebarOpen = !activeChat.chats[0].isSidebarOpen;
      }
    },
    setResponsePanelWidth(state, action: PayloadAction<number>) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = Math.max(0, Math.min(100, action.payload));
      }
    },
    openResponsePanel(state) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = PANEL_DEFAULT_WIDTH;
      }
    },
    closeResponsePanel(state) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = PANEL_CLOSED_WIDTH;
        activeChat.chats[0].activeMessageId = null;
      }
    },
    setActiveMessageId(state, action: PayloadAction<string | null>) {
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].activeMessageId = action.payload;
        if (action.payload) {
          activeChat.chats[0].responsePanelWidth = PANEL_DEFAULT_WIDTH;
        } else {
          activeChat.chats[0].responsePanelWidth = PANEL_CLOSED_WIDTH;
        }
      }
    },
    clearMessages(state, action: PayloadAction<string>) {
      const chatId = action.payload;
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat && chat.chats[0]) {
        chat.chats[0].messages = [];
      }
    },
  },
});

export const {
  setChatsFromAPI,
  loadChatMessages,
  addChat,
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
} = chatSlice.actions;

export default chatSlice.reducer;