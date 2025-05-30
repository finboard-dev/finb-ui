import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export type ToolCallResponseType = 'table' | 'graph' | 'code' | 'error' | 'text' | 'python'

export interface ToolCallResponse {
  id: string;
  tool_call_id: string;
  tool_name: string;
  type: ToolCallResponseType | any;
  data: any;
  messageId?: string;
  createdAt?: string;
  userRequest?: any; // Add field to store user request separately if needed
}

export interface SavedResponseData extends ResponsePanelState {
  id: string;
  savedAt: string;
}

export interface ResponsePanelState {
  code: string | undefined;
  toolCallResponses: ToolCallResponse[];
  activeToolCallId: string | null;
}

const initialState: ResponsePanelState = {
  code: undefined,
  toolCallResponses: [],
  activeToolCallId: null,
};

const STORAGE_KEY = 'savedResponses';

const loadSavedResponses = (): SavedResponseData[] => {
  try {
    const savedResponses = localStorage.getItem(STORAGE_KEY);
    if (savedResponses) {
      return JSON.parse(savedResponses);
    }
  } catch (e) {
    console.error("Error loading saved responses from localStorage:", e);
  }
  return [];
};

export const responsePanelSlice = createSlice({
  name: 'responsePanel',
  initialState,
  reducers: {
    setCodeData: (state, action: PayloadAction<string>) => {
      state.code = action.payload;
    },
    addToolCallResponse: (state, action: PayloadAction<ToolCallResponse>) => {
      const existingIndex = state.toolCallResponses.findIndex(
          (response) => response.tool_call_id === action.payload.tool_call_id
      );

      const responseWithTimestamp = {
        ...action.payload,
        createdAt: action.payload.createdAt || new Date().toISOString()
      };

      if (existingIndex >= 0) {
        state.toolCallResponses[existingIndex] = responseWithTimestamp;
      } else {
        state.toolCallResponses.push(responseWithTimestamp);
      }

      state.activeToolCallId = action.payload.tool_call_id;
    },
    setActiveToolCallId: (state, action: PayloadAction<string>) => {
      state.activeToolCallId = action.payload;
    },
    saveToLocalStorage: (state) => {
      try {
        const savedResponses = loadSavedResponses();
        const responseWithId: SavedResponseData = {
          ...state,
          id: uuidv4(),
          savedAt: new Date().toISOString(),
        };

        const updatedResponses = [responseWithId, ...savedResponses].slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResponses));
      } catch (e) {
        console.error("Error saving state to localStorage:", e);
      }
    },
    resetToolCallResponses: (state) => {
      state.toolCallResponses = [];
      state.activeToolCallId = null;
      state.code = undefined;
    },
    removeToolCallResponse: (state, action: PayloadAction<string>) => {
      const indexToRemove = state.toolCallResponses.findIndex(
          response => response.tool_call_id === action.payload
      );

      if (indexToRemove !== -1) {
        state.toolCallResponses.splice(indexToRemove, 1);
        if (state.activeToolCallId === action.payload) {
          state.activeToolCallId = state.toolCallResponses.length > 0
              ? state.toolCallResponses[0].tool_call_id
              : null;
        }
      }
    }
  },
});

export const {
  setCodeData,
  addToolCallResponse,
  setActiveToolCallId,
  saveToLocalStorage,
  resetToolCallResponses,
  removeToolCallResponse
} = responsePanelSlice.actions;

export default responsePanelSlice.reducer;