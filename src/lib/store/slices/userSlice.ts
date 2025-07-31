import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CompanyRole {
  id: string;
  name: string;
  permissions: string[];
}

interface Company {
  id: string;
  userId?: string;
  syncToken?: string | null;
  folderId?: string | null;
  name: string;
  realmId?: string | null;
  isActive: boolean;
  templateFolderId?: string | null;
  created?: string;
  updated?: string;
  lastSyncTime?: string;
  currency?: string;
  country?: string | null;
  startDate?: string;
  financialYearStart?: string;
  isMultiEntity?: boolean;
  subEntities?: string[];
  pnlConsolidation?: boolean;
  balanceSheetConsolidation?: boolean;
  cashFlowConsolidation?: boolean;
  accessLevel?: string;
  status?: string; // for compatibility with UI logic
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
  enabledFeatures?: string[];
  billingEmail?: string;
  contactEmail?: string;
}

interface Role {
  id: string;
  key: string;
  name: string;
  permissions: string[];
}

interface UserOrganization {
  organization: {
    id: string;
    name: string;
    status: string;
    enabledFeatures?: string[];
    billingEmail?: string;
    contactEmail?: string;
  };
  role: {
    id: string;
    key: string;
    name: string;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastLoginTime: string;
  role?: Role;
  organizations?: UserOrganization[];
  redirectTo?: string;
  newUser?: boolean;
  pluginInstalled?: boolean;
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
  companies: Company[];
  redirectTo?: string;
  newUser?: boolean;
  pluginInstalled?: boolean;
}

// Initial state
const initialState: UserState = {
  token: null,
  user: null,
  selectedOrganization: null,
  selectedCompany: null,
  companies: [],
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

      if (token) {
        state.token = token;
      }

      // Set user data
      state.user = user;

      // Set additional fields from magic link response
      state.redirectTo = user.redirectTo;
      state.newUser = user.newUser;
      state.pluginInstalled = user.pluginInstalled;

      // Handle selectedOrganization - Use payload or auto-select from first organization
      if (action.payload.selectedOrganization) {
        state.selectedOrganization = action.payload.selectedOrganization;
      } else if (user.organizations && user.organizations.length > 0) {
        // Convert UserOrganization to Organization format
        const firstOrg = user.organizations[0];
        state.selectedOrganization = {
          id: firstOrg.organization.id,
          name: firstOrg.organization.name,
          status: firstOrg.organization.status,
          enabledFeatures: firstOrg.organization.enabledFeatures || [],
          billingEmail: firstOrg.organization.billingEmail,
          contactEmail: firstOrg.organization.contactEmail,
          companies: [],
          role: {
            id: firstOrg.role.id,
            name: firstOrg.role.name,
            permissions: [],
          },
        };
      } else {
        state.selectedOrganization = null;
      }

      // Handle selectedCompany - Use payload or auto-select from organization companies
      if (action.payload.selectedCompany) {
        state.selectedCompany = action.payload.selectedCompany;
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

      // Ensure all organization fields are preserved, including the new ones
      state.selectedOrganization = {
        ...action.payload,
        enabledFeatures: action.payload.enabledFeatures || [],
        billingEmail: action.payload.billingEmail,
        contactEmail: action.payload.contactEmail,
      };

      // Don't auto-select first company when organization changes - keep existing selection
      // state.selectedCompany = action.payload.companies && action.payload.companies.length > 0
      //     ? action.payload.companies[0]
      //     : null;
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
      state.companies = [];
      state.redirectTo = undefined;
      state.newUser = undefined;
      state.pluginInstalled = undefined;
    },

    clearCompanies: (state) => {
      if (state === null) {
        console.error("State is null in clearCompanies reducer");
        return initialState;
      }

      state.companies = [];
      state.selectedCompany = null;
    },

    setCompanies: (state, action: PayloadAction<Company[]>) => {
      // Completely replace the companies array with fresh data
      // This ensures that companies from different organizations don't mix
      state.companies = action.payload || [];
    },

    /**
     * Adds a single company to the companies array, preventing duplicates
     * If the company already exists (based on ID), it will be updated
     * If it's a new company, it will be added to the array
     */
    addCompany: (state, action: PayloadAction<Company>) => {
      if (!action.payload || !action.payload.id) {
        console.error("Invalid company provided to addCompany");
        return;
      }

      // Check if company already exists
      const existingCompanyIndex = state.companies.findIndex(
        company => company.id === action.payload.id
      );

      if (existingCompanyIndex !== -1) {
        // Update existing company
        state.companies[existingCompanyIndex] = action.payload;
      } else {
        // Add new company
        state.companies.push(action.payload);
      }
    },

    updateOrganizationName: (state, action: PayloadAction<{ id: string; name: string }>) => {
      if (!action.payload || !action.payload.id || !action.payload.name) {
        console.error("Invalid organization name update payload");
        return;
      }

      // Update the selected organization name if it matches
      if (state.selectedOrganization && state.selectedOrganization.id === action.payload.id) {
        state.selectedOrganization.name = action.payload.name;
      }

      // Update the organization name in user's organizations array if it exists
      if (state.user && state.user.organizations) {
        state.user.organizations = state.user.organizations.map(org => {
          if (org.organization.id === action.payload.id) {
            return {
              ...org,
              organization: {
                ...org.organization,
                name: action.payload.name
              }
            };
          }
          return org;
        });
      }

      // Note: We no longer store selectedOrganization in the user object
      // The top-level selectedOrganization is the single source of truth
    },

    setNewUserFalse: (state) => {
      if (state === null) {
        console.error("State is null in setNewUserFalse reducer");
        return initialState;
      }

      state.newUser = false;
    },
  },
});


export const {
  setUserData,
  setToken,
  setSelectedOrganization,
  setSelectedCompany,
  clearUserData,
  clearCompanies,
  setCompanies,
  addCompany,
  updateOrganizationName,
  setNewUserFalse,
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
  [];

export const selectUserPermissions = (state: { user: UserState }) =>
    state.user?.user?.role?.permissions || [];

export const selectCompanies = (state: { user: UserState }) =>
  state.user?.companies || [];

// New selectors for organization features and contact info
export const selectOrganizationEnabledFeatures = (state: { user: UserState }) =>
  state.user?.selectedOrganization?.enabledFeatures || [];

export const selectOrganizationBillingEmail = (state: { user: UserState }) =>
  state.user?.selectedOrganization?.billingEmail;

export const selectOrganizationContactEmail = (state: { user: UserState }) =>
  state.user?.selectedOrganization?.contactEmail;

export const selectHasConsolidationFeature = (state: { user: UserState }) =>
  state.user?.selectedOrganization?.enabledFeatures?.includes('CONSOLIDATION') || false;

export const selectHasReportingFeature = (state: { user: UserState }) =>
  state.user?.selectedOrganization?.enabledFeatures?.includes('REPORTING') || false;

export const selectHasDashboardFeature = (state: { user: UserState }) =>
  state.user?.selectedOrganization?.enabledFeatures?.includes('DASHBOARD') || false;

export const selectHasChatFeature = (state: { user: UserState }) =>
  state.user?.selectedOrganization?.enabledFeatures?.includes('FINB_AGENT') || false;

export const selectHasComponentsFeature = (state: { user: UserState }) =>
  state.user?.selectedOrganization?.enabledFeatures?.includes('COMPONENTS') || false;

export const selectRedirectTo = (state: { user: UserState }) =>
  state.user?.redirectTo;

export const selectNewUser = (state: { user: UserState }) =>
  state.user?.newUser;

export const selectPluginInstalled = (state: { user: UserState }) =>
  state.user?.pluginInstalled;

export const clearRedirectTo = (state: { user: UserState }) => {
  state.user.redirectTo = undefined;
};

/**
 * Utility function to safely add a company to the Redux store
 * This function can be used from anywhere in the application to add a company
 * while preventing duplicates
 */
export const addCompanySafely = (company: Company) => {
  return addCompany(company);
};

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
  UserOrganization,
};

export default userSlice.reducer;