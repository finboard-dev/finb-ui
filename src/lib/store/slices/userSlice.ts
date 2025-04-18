import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Company {
  id: string;
  is_active: boolean;
  name: string;
  roles?: string[];
  permissions?: string[];
}

export interface Organization {
  id: string;
  is_active: boolean;
  name: string;
  roles?: string[];
  permissions?: string[];
}

export interface User {
  email: string;
  first_name: string;
  last_name: string;
  id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  companies: Company[];
  organizations: Organization[];
}

interface UserState {
  user: User | null;
  selectedCompany: Company | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  selectedCompany: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchUserStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchUserSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
      
      // Select the first company by default if available
      if (action.payload.companies && action.payload.companies.length > 0 && !state.selectedCompany) {
        state.selectedCompany = action.payload.companies[0];
      }
    },
    fetchUserFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedCompany(state, action: PayloadAction<Company>) {
      state.selectedCompany = action.payload;
    },
  },
});

export const { 
  fetchUserStart, 
  fetchUserSuccess, 
  fetchUserFailure,
  setSelectedCompany
} = userSlice.actions;

export const selectUserLoading = (state: { user: UserState }) => state.user.loading;
export const selectUser = (state: { user: UserState }) => state.user.user;
export const selectSelectedCompany = (state: { user: UserState }) => state.user.selectedCompany;
export const selectUserCompanies = (state: { user: UserState }) => state.user.user?.companies || [];
export const selectUserOrganization = (state: { user: UserState }) => state.user.user?.organizations[0] || null; // Updated to handle array

export default userSlice.reducer;