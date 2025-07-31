import { fetcher } from "../axios/config"

// Types for the onboarding capture-form API
export interface OnboardingCaptureFormRequest {
  orgName: string
  source: string
  userInputs: Record<string, any> // Empty object type as requested
  orgId?: string
}

export interface OnboardingCaptureFormResponse {
  success: boolean
  message?: string
  data?: any
}

/**
 * Captures onboarding form data
 * @param payload - The onboarding form data
 * @returns Promise with the API response
 */
export const captureOnboardingForm = async (
  payload: OnboardingCaptureFormRequest
): Promise<OnboardingCaptureFormResponse> => {
  try {
    const response = await fetcher.post(
      `${process.env.NEXT_PUBLIC_API_DEV}/onboarding/capture-form`,
      payload
    )
    
    return response.data || response
  } catch (error: any) {
    console.error("Error capturing onboarding form:", error)
    throw error
  }
}
