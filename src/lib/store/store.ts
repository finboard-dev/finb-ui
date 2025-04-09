import { configureStore } from '@reduxjs/toolkit'
import chatReducer from './slices/chatSlice'
import responsePanelReducer from './slices/responsePanelSlice'

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    responsePanel: responsePanelReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch