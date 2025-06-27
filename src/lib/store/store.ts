import chatReducer from "./slices/chatSlice"
import responsePanelReducer from "./slices/responsePanelSlice"
import uiReducer from "./slices/uiSlice"
import loadingReducer from "./slices/loadingSlice"
import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist"
import userReducer from "./slices/userSlice"
import storage from "redux-persist/lib/storage"

// Combine all reducers
const rootReducer = combineReducers({
  chat: chatReducer,
  responsePanel: responsePanelReducer,
  ui: uiReducer,
  loading: loadingReducer,
  user: userReducer,
})

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["user"],
  debug: process.env.NODE_ENV === "development",
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  devTools: process.env.NODE_ENV !== "production",
})

export const persistor = persistStore(store)

if (process.env.NODE_ENV === "development") {
  store.subscribe(() => {
    const state = store.getState()
    const hasToken = !!state.user?.token?.accessToken
    const hasCompany = !!state.user?.selectedCompany
    console.log("Redux state updated - Token exists:", hasToken, "Company selected:", hasCompany)
  })
}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
