import { store } from './store';
import { userBearerToken } from './slices/userSlice';

export const getToken = () => {
    return store.getState().user.token;
};

export const getBearerToken = () => {
    const state = store.getState();
    return userBearerToken(state);
};