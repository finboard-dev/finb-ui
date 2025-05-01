import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {selectToken, setUserData, userBearerToken, UserState} from "@/lib/store/slices/userSlice";

export const useBearerToken = () => {
    const dispatch = useDispatch();
    const token = useSelector(userBearerToken);
    const fullToken = useSelector(selectToken);
    const user = useSelector((state: { user: UserState }) => state.user.user);

    return { token, fullToken, user };
};
