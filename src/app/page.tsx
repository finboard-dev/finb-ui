"use client";

import React, { useEffect } from "react";
import Home from "./components/chat/Home";
import { useDispatch, useSelector } from "react-redux";
import { useUser } from "@/hooks/useUser";
import { User } from "@/types/user";
import Sidebar from "./components/common/Sidebar";
import { useClickEventTracking } from "@/hooks/useClickTracking";
import { useSelectedUserId } from "@/hooks/useSelectedUserId";

const Page = () => {
  const dispatch = useDispatch();
  const userId = useSelectedUserId();

  useClickEventTracking();

  return (
    <>
      <Sidebar />
      <Home />
    </>
  );
};

export default Page;
