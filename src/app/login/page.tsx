"use client";

import React from "react";
import LoginPage from "../components/common/SignInWithIntuit";
import { SSO_LOGIN } from "@/constants";
import { intuitSSOLogin } from "@/lib/api/intuitService";

const page = () => {
  const handleInuitLoginClick = async () => {
    // setLoading(true);
    try {
      const redirectUrl = await intuitSSOLogin(SSO_LOGIN);
      if (redirectUrl) {
        window.open(redirectUrl, "_self");
      } else {
        // Handle the case where no redirect URL is returned
        console.error("No redirect URL provided");
        // Optionally, show an error message to the user
      }
      // Navigate to dashboard or perform other actions on success
    } catch (error) {
      console.error(error); // Handle error
    } finally {
      // setLoading(false);
    }
  };

  return <LoginPage handleIntuitLogin={handleInuitLoginClick} />;
};

export default page;
