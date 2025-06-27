"use client";

import React from "react";
import LeftSidebar from "../components/ui/LeftSidebar";
import Settings from "@/app/components/pages/Settings";

const page = () => {
  return (
    <div className="flex">
      <div className="flex-1 flex justify-end">
        <div className="max-w-2/12">
          <LeftSidebar collapsible={false} isEditing={false} />
        </div>
        <div className="w-full max-w-10/12">
          <Settings onBackClick={() => window.history.back()} />
        </div>
      </div>
    </div>
  );
};

export default page;
