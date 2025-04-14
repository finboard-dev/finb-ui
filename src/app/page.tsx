"use client";

import React, { useEffect } from "react";
import Home from "./Home";
import { useDispatch, useSelector } from "react-redux";
import { useUser } from "@/hooks/useUser";
import {
  fetchUserStart,
  fetchUserSuccess,
  fetchUserFailure,
} from "@/lib/store/slices/userSlice";
import { User } from "@/types/user";

interface RootState {
  user: {
    user: User | null;
    loading: boolean;
  };
}

const Page = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state: RootState) => state.user);

  const { data, isLoading, error } = useUser({
    isEnabled: !user && !loading,
  });

  useEffect(() => {
    if (!user && !loading && !isLoading) {
      dispatch(fetchUserStart());
    }

    if (data && !user) {
      dispatch(fetchUserSuccess(data));
    }

    if (error && !loading) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      dispatch(fetchUserFailure(errorMessage));
    }
  }, [data, error, isLoading, user, loading, dispatch]);

  return <Home />;
};

export default Page;
