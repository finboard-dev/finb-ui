"use client";

import QueryProvider from "@/lib/react-query";
import { AuthGuard } from "@/lib/auth/authGuard";
import ReduxProvider from "./ReduxProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <AuthGuard>{children}</AuthGuard>
      </QueryProvider>
    </ReduxProvider>
  );
}
