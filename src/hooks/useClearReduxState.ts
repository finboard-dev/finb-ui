import { useDispatch } from 'react-redux';
import { persistor } from '@/lib/store/store';
import { clearUserData } from '@/lib/store/slices/userSlice';
import { clearAllChats } from '@/lib/store/slices/chatSlice';
import { resetToolCallResponses } from '@/lib/store/slices/responsePanelSlice';
import { resetComponents } from '@/lib/store/slices/uiSlice';
import { resetLoading } from '@/lib/store/slices/loadingSlice';

export const useClearReduxState = () => {
  const dispatch = useDispatch();
  
  const clearAll = async () => {
    try {
      dispatch(clearUserData());
      dispatch(clearAllChats());
      dispatch(resetToolCallResponses());
      dispatch(resetComponents());
      dispatch(resetLoading());
      
      await persistor.purge();
      await persistor.flush();
      
      console.log('Redux state cleared successfully');
    } catch (error) {
      console.error('Error clearing Redux state:', error);
      throw error;
    }
  };
  
  return clearAll;
};