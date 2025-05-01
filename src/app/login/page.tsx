"use client";

import React from "react";
import LoginPage from "./components/LoginPage";
import { SSO_LOGIN } from "@/constants";
import { intuitSSOLogin } from "@/lib/api/intuitService";

const page = () => {
  const handleInuitLoginClick = async () => {
    try {
      const redirectUrl = await intuitSSOLogin(SSO_LOGIN);
      if (redirectUrl) {
        window.open(redirectUrl, "_blank");
      } else {
        console.error("No redirect URL provided");
      }
    } catch (error) {
      console.error(error);
    } finally {
    }
  };

  return (
    <LoginPage handleIntuitLogin={handleInuitLoginClick} isLoading={false} />
  );
};

export default page;
