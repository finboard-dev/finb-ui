import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface ResponseData {
  id?: string | null;
  code: any;
  tableData?: any;
  visualizationData?: Array<Record<string, any>> | null;
}

const initialState: ResponseData = {
  code: undefined,
  tableData: null,
  visualizationData: null,
};

const loadSavedResponses = (): ResponseData[] => {
  try {
    const savedResponses = localStorage.getItem('savedResponses');
    if (savedResponses) {
      return JSON.parse(savedResponses);
    }
  } catch (e) {
    console.error("Error loading saved responses from localStorage:", e);
  }
  return [];
};

export const responseSlice = createSlice({
  name: 'responsePanel',
  initialState: initialState,
  reducers: {
    setCodeData: (state, action: PayloadAction<string>) => {
      state.code = action.payload;
    },
    setTableData: (state, action: any) => {
      state.tableData = action.payload;
    },
    setVisualizationData: (state, action: PayloadAction<Array<Record<string, any>>>) => {
      state.visualizationData = action.payload;
    },
    saveToLocalStorage: (state) => {
      try {
        const savedResponses = loadSavedResponses();
        const responseWithId = {
          ...state,
          id: uuidv4(),
        };

        savedResponses.push(responseWithId);
        localStorage.setItem('savedResponses', JSON.stringify(savedResponses));
      } catch (e) {
        console.error("Error saving state to localStorage:", e);
      }
    },
  },
});

export const { setCodeData, setTableData, saveToLocalStorage } = responseSlice.actions;

export default responseSlice.reducer;