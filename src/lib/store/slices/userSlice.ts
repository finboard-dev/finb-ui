import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CompanyRole {
  id: string;
  name: string;
  permissions: string[];
}

interface Company {
  id: string;
  name: string;
  status: string;
  role?: CompanyRole;
}

interface OrganizationRole {
  id: string;
  name: string;
  permissions: string[];
}

interface Organization {
  id: string;
  name: string;
  status: string;
  companies: Company[];
  role?: OrganizationRole;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastLoginTime: string;
  selectedOrganization?: Organization;
  selectedCompany?: Company;
  role?: Role;
  organizations?: Organization[];
}

// We'll define a separate interface for the payload
interface SetUserDataPayload {
  token?: Token;
  user: User;
  selectedOrganization?: Organization;
  selectedCompany?: Company;
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
    setUserData: (state, action: PayloadAction<SetUserDataPayload>) => {
      if (!action.payload || !action.payload.user) {
        console.error("Invalid user data provided to setUserData", action.payload);
        return;
      }

      const token = action.payload.token || state.token;
      const user = action.payload.user;

      console.log("Setting user data in Redux:", {
        tokenPresent: !!token,
        accessToken: token?.accessToken ? "exists" : "missing",
        userPresent: !!user,
        preservingToken: !action.payload.token
      });

      if (state === null) {
        console.error("State is null in setUserData reducer");
        return initialState;
      }

      // Set token if it exists
      if (token) {
        state.token = token;
      }

      // Set user data
      state.user = user;

      // Handle selectedOrganization - Auto-select from user.selectedOrganization if available
      if (action.payload.selectedOrganization) {
        state.selectedOrganization = action.payload.selectedOrganization;
      } else if (user.selectedOrganization) {
        state.selectedOrganization = user.selectedOrganization;
      } else if (user.organizations && user.organizations.length > 0) {
        state.selectedOrganization = user.organizations[0];
      } else {
        state.selectedOrganization = null;
      }

      // Handle selectedCompany - Auto-select from user.selectedCompany if available
      if (action.payload.selectedCompany) {
        state.selectedCompany = action.payload.selectedCompany;
      } else if (user.selectedCompany) {
        state.selectedCompany = user.selectedCompany;
      } else if (
          state.selectedOrganization?.companies &&
          state.selectedOrganization.companies.length > 0
      ) {
        state.selectedCompany = state.selectedOrganization.companies[0];
      } else {
        state.selectedCompany = null;
      }
    },

    setToken: (state, action: PayloadAction<Token>) => {
      if (!action.payload) {
        console.error("Invalid token provided to setToken");
        return;
      }

      // Make sure state is initialized
      if (state === null) {
        console.error("State is null in setToken reducer");
        return initialState;
      }

      state.token = action.payload;
    },

    setSelectedOrganization: (state, action: PayloadAction<Organization>) => {
      if (!action.payload) {
        console.error("Invalid organization provided to setSelectedOrganization");
        return;
      }

      // Make sure state is initialized
      if (state === null) {
        console.error("State is null in setSelectedOrganization reducer");
        return initialState;
      }

      state.selectedOrganization = action.payload;

      // Auto-select first company when organization changes
      state.selectedCompany = action.payload.companies && action.payload.companies.length > 0
          ? action.payload.companies[0]
          : null;
    },

    setSelectedCompany: (state, action: PayloadAction<Company>) => {
      if (!action.payload) {
        console.error("Invalid company provided to setSelectedCompany");
        return;
      }

      // Make sure state is initialized
      if (state === null) {
        console.error("State is null in setSelectedCompany reducer");
        return initialState;
      }

      state.selectedCompany = action.payload;
    },

    clearUserData: (state) => {
      if (state === null) {
        console.error("State is null in clearUserData reducer");
        return initialState;
      }

      state.token = null;
      state.user = null;
      state.selectedOrganization = null;
      state.selectedCompany = null;
    },
  },
});


export const {
  setUserData,
  setToken,
  setSelectedOrganization,
  setSelectedCompany,
  clearUserData,
} = userSlice.actions;

export const selectedCompanyId = (state: { user: UserState }) =>
    state.user?.selectedCompany?.id;

export const selectUser = (state: { user: UserState }) =>
    state.user?.user;

export const selectedUserId = (state: { user: UserState }) =>
    state.user?.user?.id;

export const selectToken = (state: { user: UserState }) =>
    state.user?.token;

export const userBearerToken = (state: { user: UserState }) =>
    state.user?.token?.accessToken;

export const selectSelectedOrganization = (state: { user: UserState }) =>
    state.user?.selectedOrganization;

export const selectSelectedCompany = (state: { user: UserState }) =>
    state.user?.selectedCompany;

export const selectOrganizationPermissions = (state: { user: UserState }) =>
    state.user?.selectedOrganization?.role?.permissions || [];

export const selectCompanyPermissions = (state: { user: UserState }) =>
    state.user?.selectedCompany?.role?.permissions || [];

export const selectUserPermissions = (state: { user: UserState }) =>
    state.user?.user?.role?.permissions || [];

export type {
  User,
  Token,
  Organization,
  Company,
  OrganizationRole,
  CompanyRole,
  Role,
  UserState,
  SetUserDataPayload,
};

export default userSlice.reducer;