import { MessageType } from "@/types/chat";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  messages: MessageType[];
  isResponding: boolean;
  responseVariants: { id: number; title: string }[];
  selectedVariant: number;
  isSidebarOpen: boolean;
  responsePanelWidth: number;
}

const initialState: ChatState = {
  messages: [
    {
      id: "1",
      role: "assistant",
      content: "Hello! How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ],
  isResponding: false,
  responseVariants: [
    { id: 1, title: "Default Response" },
    { id: 2, title: "Alternative 1" },
    { id: 3, title: "Alternative 2" },
  ],
  selectedVariant: 1,
  isSidebarOpen: true,
  responsePanelWidth: 550,
};

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
      const index = state.messages.findIndex(msg => msg.id === action.payload.id);
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
      state.responsePanelWidth = action.payload;
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
} = chatSlice.actions;
export default chatSlice.reducer;