"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Import placeholder/fallback component for server-side rendering
const SandpackLoading = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      width: "100%",
      backgroundColor: "#f5f5f5",
    }}
  >
    <div>Loading code editor...</div>
  </div>
);

// Dynamically import the Sandpack component with SSR disabled
const SandpackComponent = dynamic(() => import("./SandpackComponent"), {
  ssr: false,
  loading: SandpackLoading,
});

export default function ComponentPreviewerPage() {
  return <SandpackComponent />;
}
