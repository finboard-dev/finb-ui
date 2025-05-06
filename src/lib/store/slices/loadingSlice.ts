import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoadingState {
  isToolCallLoading: boolean;
  isCompanyDropDownLoading: boolean;
}

const initialState: LoadingState = {
  isToolCallLoading: false,
  isCompanyDropDownLoading: false,
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setToolCallLoading(state, action: PayloadAction<boolean>) {
      state.isToolCallLoading = action.payload;
    },
    setDropDownLoading(state, action: PayloadAction<boolean>) {
      state.isCompanyDropDownLoading = action.payload;
    }
  },
});

export const { setToolCallLoading , setDropDownLoading } = loadingSlice.actions;
export const selectLoading = (state: { loading: LoadingState }) => state.loading.isToolCallLoading;
export const selectDropDownLoading = (state: { loading: LoadingState }) => state.loading.isCompanyDropDownLoading;

export default loadingSlice.reducer;