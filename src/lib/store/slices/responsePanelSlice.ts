import { BlockType } from '@/app/dashboard/page';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

// Define response panel types for better type safety
export type ToolCallResponseType = 'table' | 'graph' | 'code' | 'error' | 'text';

export interface ToolCallResponse {
  id: string;
  tool_call_id: string;
  tool_name: string;
  type: ToolCallResponseType;
  data: any;
  messageId?: string;
  createdAt?: string;
}

export interface SavedResponseData extends ResponsePanelState {
  id: string;
  savedAt: string;
}

interface SaveViewPayload {
  title: string;
  data: any;
  type: BlockType;
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

// Local storage keys
const TOOL_CALL_RESPONSES_KEY = "toolCallResponses";
const DASHBOARD_BLOCKS_KEY = "dashboardBlocks";

// Storage utility functions
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
      
      // Set as active tab automatically when adding new response
      state.activeToolCallId = action.payload.tool_call_id;
    },
    setActiveToolCallId: (state, action: PayloadAction<string>) => {
      state.activeToolCallId = action.payload;
    },
    saveToLocalStorage: (state) => {
      localStorage.setItem(
        TOOL_CALL_RESPONSES_KEY,
        JSON.stringify(state.toolCallResponses)
      );
    },
    loadFromLocalStorage: (state) => {
      const savedResponses = localStorage.getItem(TOOL_CALL_RESPONSES_KEY);
      if (savedResponses) {
        state.toolCallResponses = JSON.parse(savedResponses);
      }
    },
    saveViewAsBlock: (state, action: PayloadAction<SaveViewPayload>) => {
      const { title, data, type } = action.payload;
      
      // Get existing blocks from local storage
      const savedBlocksJSON = localStorage.getItem(DASHBOARD_BLOCKS_KEY);
      const savedBlocks = savedBlocksJSON ? JSON.parse(savedBlocksJSON) : [];
      
      // Create a new block
      const newBlock = {
        id: uuidv4(),
        type,
        title,
        content: typeof data === 'string' ? data : JSON.stringify(data),
        savedAt: new Date().toISOString(),
      };
      
      // Add to blocks array and save back to localStorage
      const updatedBlocks = [...savedBlocks, newBlock];
      localStorage.setItem(DASHBOARD_BLOCKS_KEY, JSON.stringify(updatedBlocks));
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
        
        // If we removed the active tab, select another one
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
  removeToolCallResponse,
  loadFromLocalStorage,
  saveViewAsBlock
} = responsePanelSlice.actions;

export default responsePanelSlice.reducer;