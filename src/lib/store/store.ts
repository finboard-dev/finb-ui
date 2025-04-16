import { configureStore } from '@reduxjs/toolkit'
import chatReducer from './slices/chatSlice'
import responsePanelReducer from './slices/responsePanelSlice'
import userReducer from './slices/userSlice'
import permissionReducer from './slices/permissionSlice'
import uiReducer from './slices/uiSlice'
import loadingReducer from './slices/loadingSlice'

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    responsePanel: responsePanelReducer,
    user: userReducer,
    permissions: permissionReducer,
    ui: uiReducer,
    loading: loadingReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch