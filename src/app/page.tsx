"use client";

import React from "react";
import Home from "./components/chat/Home";
import { useDispatch } from "react-redux";
import { useClickEventTracking } from "@/hooks/useClickTracking";
import { useSelectedUserId } from "@/hooks/useSelectedUserId";
import { store } from "@/lib/store/store";
import Sidebar from "./components/common/Sidebar";
import LoadingAnimation from "@/app/components/common/ui/GlobalLoading";

const Page = () => {
    const dispatch = useDispatch();
    const userId = useSelectedUserId();
    const isLoading = store.getState().loading.isCompanyDropDownLoading === true;

    useClickEventTracking();

    return (
        <>
            {isLoading ? (
                <div className="flex items-center justify-center h-screen w-screen bg-transparent">
                    <LoadingAnimation message={"switching company... Please wait!"} />
                </div>
            ) : (
                <>
                    <Sidebar />
                    <Home />
                </>
            )}
        </>
    );
};

export default Page;