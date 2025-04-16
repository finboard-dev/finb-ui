import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Define the permission map with all relevant permissions from the schema
export const PERMISSION_MAP = {
  COMPANY: {
    READ: 'company:read',
    WRITE: 'company:write',
    DELETE: 'company:delete',
    CREATE: 'company:create',
    UPDATE: 'company:update'
  },
  DASHBOARD: {
    READ: 'dashboard:read',
    WRITE: 'dashboard:write'
  },
  ROLE: {
    READ: 'role:read',
    WRITE: 'role:write'
  },
  PACKAGE: {
    READ: 'package:read',
    WRITE: 'package:write'
  },
  TEMPLATE: {
    READ: 'template:read',
    WRITE: 'template:write'
  },
  USER: {
    READ: 'user:read',
    WRITE: 'user:write'
  },
  DATASOURCE: {
    READ: 'datasource:read',
    WRITE: 'datasource:write'
  },
  COMPONENT: {
    READ: 'component:read',
    WRITE: 'component:write'
  },
  ORGANIZATION: {
    READ: 'org:read',
    WRITE: 'org:write'
  }
} as const;

const hasPermission = (userPermissions: string[], permission: string): boolean => {
  return userPermissions.includes(permission);
};

// Interface for the permissions state (can be minimal since map is static)
interface PermissionsState {
  permissionMap: typeof PERMISSION_MAP;
}

const initialState: PermissionsState = {
  permissionMap: PERMISSION_MAP,
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    // No additional state mutations needed for now
  },
});

export default permissionsSlice.reducer;

// Updated selectors to handle the new schema
export const selectUserPermissions = (state: RootState): string[] => {
  const selectedCompany = state.user.selectedCompany;
  const userOrganizations = state.user.user?.organizations || [];

  // Prioritize selected company's permissions, fall back to first organization's permissions
  if (selectedCompany?.permissions) {
    return selectedCompany.permissions;
  } else if (userOrganizations.length > 0 && userOrganizations[0]?.permissions) {
    return userOrganizations[0].permissions;
  }
  return [];
};

export const selectUserRoles = (state: RootState): string[] => {
  const selectedCompany = state.user.selectedCompany;
  const userOrganizations = state.user.user?.organizations || [];

  // Prioritize selected company's roles, fall back to first organization's roles
  if (selectedCompany?.roles) {
    return selectedCompany.roles;
  } else if (userOrganizations.length > 0 && userOrganizations[0]?.roles) {
    return userOrganizations[0].roles;
  }
  return [];
};

export const canPerformAction = (state: RootState, permission: string): boolean => {
  const userPermissions = selectUserPermissions(state);
  return hasPermission(userPermissions, permission);
};

// Updated company permissions with all defined actions
export const companyPermissions = {
  canRead: (state: RootState) => canPerformAction(state, PERMISSION_MAP.COMPANY.READ),
  canWrite: (state: RootState) => canPerformAction(state, PERMISSION_MAP.COMPANY.WRITE),
  canDelete: (state: RootState) => canPerformAction(state, PERMISSION_MAP.COMPANY.DELETE),
  canCreate: (state: RootState) => canPerformAction(state, PERMISSION_MAP.COMPANY.CREATE),
  canUpdate: (state: RootState) => canPerformAction(state, PERMISSION_MAP.COMPANY.UPDATE)
};

// Additional permission helpers (optional, can expand as needed)
export const dashboardPermissions = {
  canRead: (state: RootState) => canPerformAction(state, PERMISSION_MAP.DASHBOARD.READ),
  canWrite: (state: RootState) => canPerformAction(state, PERMISSION_MAP.DASHBOARD.WRITE)
};

export const rolePermissions = {
  canRead: (state: RootState) => canPerformAction(state, PERMISSION_MAP.ROLE.READ),
  canWrite: (state: RootState) => canPerformAction(state, PERMISSION_MAP.ROLE.WRITE)
};

// Add more permission groups as needed based on PERMISSION_MAP