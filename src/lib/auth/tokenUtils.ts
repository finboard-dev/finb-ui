import { store } from "@/lib/store/store"

export const getBearerToken = (): string | null => {
    const state = store.getState()
    return state.user?.token?.accessToken || null
}

export const clearBearerToken = (): void => {
    if (typeof document !== "undefined") {
        document.cookie = "auth_token=; path=/"
        document.cookie = "has_selected_company=; path=/"
    }
}

export const setAuthCookies = (token: string): void => {
    if (typeof document !== "undefined") {
        document.cookie = `auth_token=${token}; path=/`
    }
}
