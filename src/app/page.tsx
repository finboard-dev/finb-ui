"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useClickEventTracking } from "@/hooks/useClickTracking";
import { useSelectedUserId } from "@/hooks/useSelectedUserId";
import { store } from "@/lib/store/store";
import Sidebar from "./components/common/Sidebar";
import LoadingAnimation from "@/app/components/common/ui/GlobalLoading";
import { useAppSelector } from "@/lib/store/hooks";
import { selectDropDownLoading } from "@/lib/store/slices/loadingSlice";

const Page = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const userId = useSelectedUserId();
  const isLoading = useAppSelector(selectDropDownLoading);

  useClickEventTracking();

  useEffect(() => {
    // Redirect to chat page when accessing the root
    router.push("/chat");
  }, [router]);

  return (
    <div className="select-none">
      {isLoading ? (
        <div className="flex items-center justify-center h-screen w-screen bg-transparent">
          <LoadingAnimation message={"switching company... Please wait!"} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen w-screen bg-transparent">
          <LoadingAnimation message={"Redirecting to chat..."} />
        </div>
      )}
    </div>
  );
};

export default Page;
