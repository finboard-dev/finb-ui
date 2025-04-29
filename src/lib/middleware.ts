import { store } from '@/lib/store/store';
import { setUserData } from '@/lib/store/slices/userSlice';
import { setCredentials } from '@/lib/store/slices/authSlice';

export const initializeAuth = () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
        try {
            const user = JSON.parse(storedUser);
            const token = JSON.parse(storedToken);

            store.dispatch(setUserData({
                token,
                user
            }));

            store.dispatch(setCredentials({
                bearerToken: token.accessToken,
                currentCompanyId: user.organizations[0]?.companies[0]?.id || null
            }));
        } catch (error) {
            console.error('Error restoring auth state:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }
};

export const persistAuthData = (user: any, token: any) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', JSON.stringify(token));
};