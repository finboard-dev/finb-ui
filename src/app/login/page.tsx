"use client"

import React, { useEffect } from "react"
import LoginPage from "./components/LoginPage"
import { SSO_LOGIN } from "@/constants"
import { intuitSSOLogin } from "@/lib/api/intuitService"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/lib/store/hooks"
import { userBearerToken } from "@/lib/store/slices/userSlice"

const LoginPageContainer = () => {
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const token = useAppSelector(userBearerToken)

  useEffect(() => {
    if (token) {
      // Check if company is selected via cookie
      const hasSelectedCompany = document.cookie.includes("has_selected_company=true")

      if (hasSelectedCompany) {
        router.push("/")
      } else {
        router.push("/company-selection")
      }
    }
  }, [token, router])

  const handleInuitLoginClick = async () => {
    try {
      setIsLoading(true)
      const redirectUrl = await intuitSSOLogin(SSO_LOGIN)
      if (redirectUrl) {
        // Open in same window instead of new tab
        window.location.href = redirectUrl
      } else {
        console.error("No redirect URL provided")
        setIsLoading(false)
      }
    } catch (error) {
      console.error(error)
      setIsLoading(false)
    }
  }

  return <LoginPage handleIntuitLogin={handleInuitLoginClick} isLoading={isLoading} />
}

export default LoginPageContainer
