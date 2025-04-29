import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    currentCompanyId: string | null;
    bearerToken: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    currentCompanyId: null,
    bearerToken: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ bearerToken: string; currentCompanyId: any }>) => {
            const { currentCompanyId, bearerToken  } = action.payload;
            state.bearerToken = bearerToken;
            state.currentCompanyId = currentCompanyId;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.bearerToken = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentToken = (state: { auth: AuthState }) => state.auth.bearerToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;