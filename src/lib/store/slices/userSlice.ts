import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Type definitions
interface CompanyRole {
  id: number;
  name: string;
  permissions: string[];
}

interface Company {
  id: string;
  name: string;
  status: string;
  role: CompanyRole;
}

interface OrganizationRole {
  id: number;
  name: string;
  permissions: string[];
}

interface Organization {
  id: string;
  name: string;
  status: string;
  companies: Company[];
  role: OrganizationRole;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizations: Organization[];
  lastLoginTime: string;
}

interface Token {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

interface UserState {
  token: Token | null;
  user: User | null;
  selectedOrganization: Organization | null;
  selectedCompany: Company | null;
}

// Initial state
const initialState: UserState = {
  token: null,
  user: null,
  selectedOrganization: null,
  selectedCompany: null,
};

// Create the slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<{ token: Token; user: User }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.selectedOrganization = action.payload.user.organizations[0] || null;
      state.selectedCompany = action.payload.user.organizations[0]?.companies[0] || null;
    },
    setSelectedOrganization: (state, action: PayloadAction<Organization>) => {
      state.selectedOrganization = action.payload;
      state.selectedCompany = action.payload.companies[0] || null;
    },
    setSelectedCompany: (state, action: PayloadAction<Company>) => {
      state.selectedCompany = action.payload;
    },
    clearUserData: (state) => {
      state.token = null;
      state.user = null;
      state.selectedOrganization = null;
      state.selectedCompany = null;
    },
  },
});

export const {
  setUserData,
  setSelectedOrganization,
  setSelectedCompany,
  clearUserData,
} = userSlice.actions;

export const selectedCompanyId = (state: { user: UserState }) => state.user.selectedCompany?.id;
export const selectUser = (state: { user: UserState }) => state.user.user;
export const selectedUserId = (state: { user: UserState }) => state.user.user?.id;
export const selectToken = (state: { user: UserState }) => state.user.token;
export const userBearerToken = (state: { user: UserState }) => state.user.token?.accessToken;
export const selectSelectedOrganization = (state: { user: UserState }) =>
    state.user.selectedOrganization;
export const selectSelectedCompany = (state: { user: UserState }) =>
    state.user.selectedCompany;
export const selectOrganizationPermissions = (state: { user: UserState }) =>
    state.user.selectedOrganization?.role.permissions || [];
export const selectCompanyPermissions = (state: { user: UserState }) =>
    state.user.selectedCompany?.role.permissions || [];



export type {
  User,
  Token,
  Organization,
  Company,
  OrganizationRole,
  CompanyRole,
  UserState,
};

export default userSlice.reducer;