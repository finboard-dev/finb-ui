import { store } from "@/lib/store/store"

export const getBearerToken = (): string | null => {
    const state = store.getState()
    return state.user?.token?.accessToken || null
}

export const clearBearerToken = (): void => {
    // This function will be called by the logout action
    // The actual token clearing happens in the userSlice reducer

    // Clear any auth cookies
    if (typeof document !== "undefined") {
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "has_selected_company=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    }
}

export const setAuthCookies = (token: string): void => {
    if (typeof document !== "undefined") {
        // Set auth token cookie - can be used by middleware
        document.cookie = `auth_token=${token}; path=/`
    }
}
