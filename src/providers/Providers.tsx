"use client";

import { PersistGate } from "redux-persist/integration/react";
import { persistor } from "@/lib/store/store";
import StoreProvider from "@/lib/store/StoreProvider";
import QueryProvider from "@/lib/react-query";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <PersistGate loading={null} persistor={persistor}>
        <QueryProvider>{children}</QueryProvider>
      </PersistGate>
    </StoreProvider>
  );
}
