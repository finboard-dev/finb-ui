import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MessageType } from "@/types/chat";

// Define constants for reuse
export const PANEL_CLOSED_WIDTH = 0;
export const PANEL_DEFAULT_WIDTH = 550;

interface ChatState {
  messages: MessageType[];
  isResponding: boolean;
  responseVariants: { id: number; title: string }[];
  selectedVariant: number;
  isSidebarOpen: boolean;
  responsePanelWidth: number;
  activeMessageId: string | null; // Track the message whose tool responses are displayed
}

const initialState: ChatState = {
  messages: [],
  isResponding: false,
  responseVariants: [
    { id: 1, title: "Default Response" },
    { id: 2, title: "Alternative 1" },
    { id: 3, title: "Alternative 2" },
  ],
  selectedVariant: 1,
  isSidebarOpen: true,
  responsePanelWidth: PANEL_CLOSED_WIDTH, // Initially closed
  activeMessageId: null, // Initially no message selected
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
    openResponsePanel: (state) => {
      state.responsePanelWidth = PANEL_DEFAULT_WIDTH;
    },
    closeResponsePanel: (state) => {
      state.responsePanelWidth = PANEL_CLOSED_WIDTH;
      state.activeMessageId = null; // Reset active message when closing
    },
    setActiveMessageId: (state, action: PayloadAction<string | null>) => {
      state.activeMessageId = action.payload;
      if (action.payload) {
        state.responsePanelWidth = PANEL_DEFAULT_WIDTH; // Open panel when setting active message
      } else {
        state.responsePanelWidth = PANEL_CLOSED_WIDTH; // Close panel when clearing active message
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