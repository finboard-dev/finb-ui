import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatState, MessageType } from "@/types/chat";

export const PANEL_CLOSED_WIDTH = 0;
export const PANEL_DEFAULT_WIDTH = 30;

export const initialState: ChatState = {
  messages: [],
  isResponding: false,
  responseVariants: [],
  selectedVariant: 1,
  isSidebarOpen: true,
  responsePanelWidth: PANEL_CLOSED_WIDTH,
  activeMessageId: null,
};

export interface ChatsHistory {
  id: string;
  name: string;
  chats: ChatState[];
}

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<MessageType>) => {
      const existingIndex = state.messages.findIndex(
        (msg) => msg.id === action.payload.id
      );
      if (existingIndex >= 0) {
        state.messages[existingIndex] = action.payload;
      } else {
        state.messages.push(action.payload);
      }
    },
    updateMessage: (state, action: PayloadAction<MessageType>) => {
      const index = state.messages.findIndex((msg) => msg.id === action.payload.id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    setIsResponding: (state, action: PayloadAction<boolean>) => {
      state.isResponding = action.payload;
    },
    setSelectedVariant: (state, action: PayloadAction<number>) => {
      state.selectedVariant = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setResponsePanelWidth: (state, action: PayloadAction<number>) => {
      state.responsePanelWidth = Math.max(0, Math.min(100, action.payload));
    },
    openResponsePanel: (state) => {
      state.responsePanelWidth = PANEL_DEFAULT_WIDTH;
    },
    closeResponsePanel: (state) => {
      state.responsePanelWidth = PANEL_CLOSED_WIDTH;
      state.activeMessageId = null;
    },
    setActiveMessageId: (state, action: PayloadAction<string | null>) => {
      state.activeMessageId = action.payload;
      if (action.payload) {
        state.responsePanelWidth = PANEL_DEFAULT_WIDTH; 
      } else {
        state.responsePanelWidth = PANEL_CLOSED_WIDTH;
      }
    },
  },
});

export const {
  addMessage,
  setIsResponding,
  updateMessage,
  setSelectedVariant,
  toggleSidebar,
  setResponsePanelWidth,
  openResponsePanel,
  closeResponsePanel,
  setActiveMessageId,
} = chatSlice.actions;

export default chatSlice.reducer;