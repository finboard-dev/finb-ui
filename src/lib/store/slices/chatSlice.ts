import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import type { AllChats, ChatState, MessageType, ChatConversation, ContentPart, ToolCall } from "@/types/chat";
import {addToolCallResponse, setActiveToolCallId} from "./responsePanelSlice";

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
  pendingChat: AllChats | null;
}

const defaultChatId: string = uuidv4();

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
};

const mapApiMessagesToMessageType = (apiMessages: any[]): MessageType[] => {
  const messages: MessageType[] = [];
  let lastRole: "user" | "assistant" = "assistant";

  apiMessages.forEach((apiMessage) => {
    if (apiMessage.type === "tool") {
      return;
    }

    const isHuman: boolean = apiMessage.type === "human";
    const role: "user" | "assistant" = isHuman ? "user" : "assistant";

    if (!isHuman && lastRole === "assistant") {
      lastRole = "assistant";
    } else {
      lastRole = role;
    }

    const contentParts: ContentPart[] = [];
    if (apiMessage.content) {
      contentParts.push({ type: "text", content: apiMessage.content });
    }

    const toolCalls: ToolCall[] =
        apiMessage.tool_calls?.map((tc: any) => ({
          name: tc.name,
          args: tc.args,
          id: tc.id,
          position: tc.position || 0,
        })) || [];

    toolCalls.forEach((tc: ToolCall) => {
      contentParts.push({ type: "toolCall", toolCallId: tc.id });
    });

    const message: MessageType = {
      id: apiMessage.id || uuidv4(),
      role: lastRole,
      content: contentParts,
      timestamp: apiMessage.timestamp || new Date().toISOString(),
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

export const processToolResponses = (apiMessages: any[], dispatch: any) => {
  let latestToolCallId: string | null = null;
  apiMessages.forEach((msg) => {
    if (msg.type === "tool" && msg.tool_call_id) {
      try {
        let responseType: "code" | "table" | "graph" | "error" | "text" = "text";
        let parsedContent = msg.content;

        if (typeof msg.content === "string") {
          if (msg.content.trim().startsWith("Error:")) {
            responseType = "error";
          } else {
            try {
              parsedContent = JSON.parse(msg.content);
              if (parsedContent.type === "report" || parsedContent.type === "report_table") {
                responseType = "table";
              } else if (parsedContent.type === "graph") {
                responseType = "graph";
              } else if (parsedContent.type === "code") {
                responseType = "code";
              } else if (parsedContent.type === "error") {
                responseType = "error";
              }
            } catch (e) {
              responseType = "text";
            }
          }
        }

        dispatch(
            addToolCallResponse({
              id: msg.id || uuidv4(),
              tool_call_id: msg.tool_call_id,
              tool_name: msg.name || "",
              type: responseType,
              data: parsedContent,
              messageId: msg.id,
              createdAt: msg.timestamp || new Date().toISOString(),
            })
        );
        latestToolCallId = msg.tool_call_id;
        if (latestToolCallId) {
          dispatch(setActiveToolCallId(latestToolCallId));
        }
      } catch (error) {
        console.error("Error processing tool response:", error);
      }
    }
  });
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChatsFromAPI(state, action: PayloadAction<ChatConversation[]>) {
      const newChats: AllChats[] = action.payload.map((conv) => {
        const existingChat = state.chats.find((c) => c.id === conv.id);
        return {
          id: conv.id,
          name: conv.name,
          thread_id: conv.threadId,
          assistantId: conv.assistantId,
          lastMessageAt: conv.lastMessageAt,
          chats: [
            {
              ...(existingChat?.chats[0] || initialChatState),
              selectedAssistantId: conv.assistantId,
            },
          ],
        };
      });

      state.chats = newChats;
    },
    loadChatMessages(state, action: PayloadAction<{ chatId: string; messages: any[] }>) {
      const { chatId, messages } = action.payload;
      const processedMessages = mapApiMessagesToMessageType(messages);

      if (state.pendingChat && state.pendingChat.id === chatId) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].messages = processedMessages;
        }
      } else {
        const chat = state.chats.find((c) => c.id === chatId);
        if (chat && chat.chats[0]) {
          chat.chats[0].messages = processedMessages;
        }
      }
    },
    initializeNewChat(state, action: PayloadAction<{ assistantId: string }>) {
      const newPendingChat: AllChats = {
        id: uuidv4(),
        name: "New Chat",
        thread_id: uuidv4(),
        assistantId: action.payload.assistantId,
        lastMessageAt: new Date().toISOString(),
        chats: [
          {
            ...initialChatState,
            selectedAssistantId: action.payload.assistantId,
          },
        ],
      };
      state.pendingChat = newPendingChat;
      state.activeChatId = newPendingChat.id;
    },
    confirmPendingChat(state) {
      if (state.pendingChat && state.pendingChat.chats[0].messages && state.pendingChat.chats[0].messages.length > 0) {
        state.chats.unshift(state.pendingChat);
        state.activeChatId = state.pendingChat.id;
        state.pendingChat = null;
      }
    },
    setSelectedAssistantId(state, action: PayloadAction<{ chatId: string; assistantId: string }>) {
      const { chatId, assistantId } = action.payload;
      if (state.pendingChat && state.pendingChat.id === chatId) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].selectedAssistantId = assistantId;
          state.pendingChat.assistantId = assistantId;
        }
        return;
      }
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat && chat.chats[0]) {
        chat.chats[0].selectedAssistantId = assistantId;
        chat.assistantId = assistantId;
      }
    },
    removeChat(state, action: PayloadAction<string>) {
      const chatIdToRemove = action.payload;
      state.chats = state.chats.filter((chat) => chat.id !== chatIdToRemove);
      if (state.activeChatId === chatIdToRemove) {
        if (state.chats.length > 0) {
          state.activeChatId = state.chats[0].id;
        } else {
          const newPendingChat: AllChats = {
            id: uuidv4(),
            name: "New Chat",
            thread_id: uuidv4(),
            assistantId: "",
            chats: [{ ...initialChatState }],
          };
          state.pendingChat = newPendingChat;
          state.activeChatId = newPendingChat.id;
        }
      }
    },
    setActiveChatId(state, action: PayloadAction<string>) {
      state.activeChatId = action.payload;
    },
    renameChatById(state, action: PayloadAction<{ chatId: string; name: string }>) {
      const { chatId, name } = action.payload;
      if (state.pendingChat && state.pendingChat.id === chatId) {
        state.pendingChat.name = name;
        return;
      }
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat) {
        chat.name = name;
      }
    },
    addMessage(state, action: PayloadAction<{ chatId: string; message: MessageType }>) {
      const { chatId, message } = action.payload;
      const now = new Date().toISOString();
      
      if (state.pendingChat && state.pendingChat.id === chatId) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].messages.push(message);
          state.pendingChat.lastMessageAt = now;
          if (message.role === "user") {
            state.chats.unshift(state.pendingChat);
            state.activeChatId = state.pendingChat.id;
            state.pendingChat = null;
          }
        }
        return;
      }
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat && chat.chats[0]) {
        chat.chats[0].messages.push(message);
        chat.lastMessageAt = now;
      }
    },
    updateMessage(state, action: PayloadAction<{ chatId: string; message: MessageType }>) {
      const { chatId, message } = action.payload;
      if (state.pendingChat && state.pendingChat.id === chatId) {
        if (state.pendingChat.chats[0]) {
          const messageIndex = state.pendingChat.chats[0].messages.findIndex((m) => m.id === message.id);
          if (messageIndex !== -1) {
            const existingMessage = state.pendingChat.chats[0].messages[messageIndex];
            const newMessage: MessageType = { ...message };
            if (existingMessage.toolCalls && newMessage.toolCalls) {
              newMessage.toolCalls = newMessage.toolCalls.map((tc) => {
                const existingTc = existingMessage.toolCalls?.find((etc) => etc.id === tc.id);
                return existingTc ? { ...tc, position: existingTc.position } : tc;
              });
            }
            state.pendingChat.chats[0].messages[messageIndex] = newMessage;
          }
        }
        return;
      }
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat && chat.chats[0]) {
        const messageIndex = chat.chats[0].messages.findIndex((m) => m.id === message.id);
        if (messageIndex !== -1) {
          const existingMessage = chat.chats[0].messages[messageIndex];
          const newMessage: MessageType = { ...message };
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
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].isResponding = action.payload;
        }
        return;
      }
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].isResponding = action.payload;
      }
    },
    setSelectedVariant(state, action: PayloadAction<number>) {
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].selectedVariant = action.payload;
        }
        return;
      }
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].selectedVariant = action.payload;
      }
    },
    toggleSidebar(state) {
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].isSidebarOpen = !state.pendingChat.chats[0].isSidebarOpen;
        }
        return;
      }
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].isSidebarOpen = !activeChat.chats[0].isSidebarOpen;
      }
    },
    setResponsePanelWidth(state, action: PayloadAction<number>) {
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].responsePanelWidth = Math.max(0, Math.min(100, action.payload));
        }
        return;
      }
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = Math.max(0, Math.min(100, action.payload));
      }
    },
    openResponsePanel(state) {
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].responsePanelWidth = PANEL_DEFAULT_WIDTH;
        }
        return;
      }
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = PANEL_DEFAULT_WIDTH;
      }
    },
    closeResponsePanel(state) {
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].responsePanelWidth = PANEL_CLOSED_WIDTH;
          state.pendingChat.chats[0].activeMessageId = null;
        }
        return;
      }
      const activeChat = state.chats.find((c) => c.id === state.activeChatId);
      if (activeChat && activeChat.chats[0]) {
        activeChat.chats[0].responsePanelWidth = PANEL_CLOSED_WIDTH;
        activeChat.chats[0].activeMessageId = null;
      }
    },
    setActiveMessageId(state, action: PayloadAction<string | null>) {
      if (state.pendingChat && state.activeChatId === state.pendingChat.id) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].activeMessageId = action.payload;
          if (action.payload) {
            state.pendingChat.chats[0].responsePanelWidth = PANEL_DEFAULT_WIDTH;
          } else {
            state.pendingChat.chats[0].responsePanelWidth = PANEL_CLOSED_WIDTH;
          }
        }
        return;
      }
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
      if (state.pendingChat && state.pendingChat.id === chatId) {
        if (state.pendingChat.chats[0]) {
          state.pendingChat.chats[0].messages = [];
        }
        return;
      }
      const chat = state.chats.find((c) => c.id === chatId);
      if (chat && chat.chats[0]) {
        chat.chats[0].messages = [];
      }
    },
    clearAllChats(state) {
      state.chats = [];
      state.pendingChat = null;
      state.activeChatId = null;
    },
  },
});

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
  clearAllChats,
} = chatSlice.actions;

export default chatSlice.reducer;