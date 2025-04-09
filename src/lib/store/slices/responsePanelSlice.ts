import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export interface ResponseData {
  id?: string; // Optional ID field
  sql: string;
  tableData: Array<Record<string, any>>; // Always an array
  visualizationData: Array<Record<string, any>>;
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
  tableData: [
    {
      product_category: "Electronics",
      total_sales: 1200,
      revenue: 89500,
      avg_sale: 74.58,
    },
    {
      product_category: "Clothing",
      total_sales: 950,
      revenue: 45600,
      avg_sale: 48.0,
    },
    {
      product_category: "Home Goods",
      total_sales: 820,
      revenue: 38900,
      avg_sale: 47.44,
    },
    {
      product_category: "Books",
      total_sales: 1500,
      revenue: 28500,
      avg_sale: 19.0,
    },
    {
      product_category: "Beauty",
      total_sales: 650,
      revenue: 26300,
      avg_sale: 40.46,
    },
    {
      product_category: "Sports",
      total_sales: 480,
      revenue: 24800,
      avg_sale: 51.67,
    },
    {
      product_category: "Toys",
      total_sales: 720,
      revenue: 21600,
      avg_sale: 30.0,
    },
    {
      product_category: "Furniture",
      total_sales: 230,
      revenue: 18400,
      avg_sale: 80.0,
    },
    {
      product_category: "Food",
      total_sales: 1700,
      revenue: 17000,
      avg_sale: 10.0,
    },
    {
      product_category: "Jewelry",
      total_sales: 180,
      revenue: 16200,
      avg_sale: 90.0,
    },
  ],
  visualizationData: [],
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
        // Get existing responses array or create new one
        const savedResponses = loadSavedResponses();

        // Create a copy of the current state with a new UUID
        const responseWithId = {
          ...state,
          id: uuidv4(),
        };

        // Push to the array
        savedResponses.push(responseWithId);

        // Save the updated array
        localStorage.setItem('savedResponses', JSON.stringify(savedResponses));
      } catch (e) {
        console.error("Error saving state to localStorage:", e);
      }
    },
  },
});

export const { setSqlQuery, setTableData, saveToLocalStorage } = responseSlice.actions;

export default responseSlice.reducer;