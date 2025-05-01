"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { isPublicRoute, AUTH_CONFIG } from "../auth/authConfig";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const userState = useSelector((state: RootState) => state.user);

  const token = userState?.token;
  const isAuthenticated = !!token?.accessToken;
  const currentPathRequiresAuth = pathname && !isPublicRoute(pathname);

  useEffect(() => {
    if (!isAuthenticated && currentPathRequiresAuth) {
      console.log(
        `AuthGuard: User not authenticated, redirecting from ${pathname} to login`
      );

      sessionStorage.setItem(AUTH_CONFIG.redirectAfterLoginKey, pathname || "");

      router.push(AUTH_CONFIG.loginPath);
    } else if (isAuthenticated) {
      console.log(`AuthGuard: User is authenticated on path ${pathname}`);
    }
  }, [pathname, isAuthenticated, router]);

  if (!isAuthenticated && currentPathRequiresAuth) {
    return null;
  }

  return <>{children}</>;
}

export default AuthGuard;
