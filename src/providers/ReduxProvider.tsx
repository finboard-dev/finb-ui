"use client";

import { persistor, store } from "@/lib/store/store";
import { PropsWithChildren, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

function PersistLoading() {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export function ReduxProvider({ children }: PropsWithChildren) {
  const [showPersistGate, setShowPersistGate] = useState(false);
  const [isRehydrated, setIsRehydrated] = useState(false);

  useEffect(() => {
    setShowPersistGate(true);

    const unsubscribe = persistor.subscribe(() => {
      const { bootstrapped } = persistor.getState();
      if (bootstrapped) {
        setIsRehydrated(true);
        unsubscribe();
        console.log("Redux persist rehydration complete");
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && isRehydrated) {
      const state = store.getState();
      console.log("Redux state after rehydration:", {
        userState: state.user,
        hasToken: !!state.user?.token,
        tokenAccessToken: state.user?.token?.accessToken ? "exists" : "missing",
      });
    }
  }, [isRehydrated]);

  return (
    <Provider store={store}>
      {showPersistGate ? (
        <PersistGate loading={<PersistLoading />} persistor={persistor}>
          {children}
        </PersistGate>
      ) : (
        <PersistLoading />
      )}
    </Provider>
  );
}

export default ReduxProvider;
