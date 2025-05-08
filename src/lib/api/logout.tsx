import {store} from "@/lib/store/store";

export async function logout() {
    const bearerToken = store.getState().user.token;
    const token = bearerToken?.accessToken;
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_DEV}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Logout failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Logout successful:', data);
        return data;
    } catch (error: any) {
        console.error('Error during logout:', error.message);
        throw error;
    }
}