import { configureStore } from '@reduxjs/toolkit'
import chatReducer from './slices/chatSlice'
import responsePanelReducer from './slices/responsePanelSlice'
import userReducer from './slices/userSlice'
import permissionReducer from './slices/permissionSlice'

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    responsePanel: responsePanelReducer,
    user: userReducer,
    permissions: permissionReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch