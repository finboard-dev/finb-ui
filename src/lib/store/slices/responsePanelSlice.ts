import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface ResponseData {
  id?: string;
  sql: string;
  tableData?: Array<Record<string, any>>;
  visualizationData?: Array<Record<string, any>>;
}

const initialState: ResponseData = {
  sql: `SELECT 
    product_category,
    COUNT(*) as total_sales,
    SUM(amount) as revenue,
    AVG(amount) as avg_sale
  FROM sales
  WHERE transaction_date >= '2023-01-01'
  GROUP BY product_category
  ORDER BY revenue DESC
  LIMIT 10;`,

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
    setSqlQuery: (state, action: PayloadAction<string>) => {
      state.sql = action.payload;
    },
    setTableData: (state, action: PayloadAction<Array<Record<string, any>>>) => {
      state.tableData = action.payload;
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

export const { setSqlQuery, setTableData, saveToLocalStorage } = responseSlice.actions;

export default responseSlice.reducer;