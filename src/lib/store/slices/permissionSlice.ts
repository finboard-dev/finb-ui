import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

export const PERMISSION_MAP = {
  COMPANY: {
    READ: 'company:read',
    WRITE: 'company:write',
    DELETE: 'company:delete',
    CREATE: 'company:create',
    UPDATE: 'company:update'
  },
} as const;

const hasPermission = (userPermissions: string[], permission: string): boolean => {
  return userPermissions.includes(permission);
};

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
    
  },
});

export default permissionsSlice.reducer;

export const selectUserPermissions = (state: RootState) => state.user.user?.permissions || [];
export const selectUserRoles = (state: RootState) => state.user.user?.roles || [];

export const canPerformAction = (state: RootState, permission: string): boolean => {
  const userPermissions = selectUserPermissions(state);
  return hasPermission(userPermissions, permission);
};

export const companyPermissions = {
  canRead: (state: RootState) => canPerformAction(state, PERMISSION_MAP.COMPANY.READ),
  canWrite: (state: RootState) => canPerformAction(state, PERMISSION_MAP.COMPANY.WRITE),
  canDelete: (state: RootState) => canPerformAction(state, PERMISSION_MAP.COMPANY.DELETE),
  canCreate: (state: RootState) => canPerformAction(state, PERMISSION_MAP.COMPANY.CREATE),
  canUpdate: (state: RootState) => canPerformAction(state, PERMISSION_MAP.COMPANY.UPDATE)
};