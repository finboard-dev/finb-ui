import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoadingState {
  isLoading: boolean;
}

const initialState: LoadingState = {
  isLoading: false,
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setToolCallLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setToolCallLoading } = loadingSlice.actions;
export const selectLoading = (state: { loading: LoadingState }) => state.loading.isLoading;

export default loadingSlice.reducer;