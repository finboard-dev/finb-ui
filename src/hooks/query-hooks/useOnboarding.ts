import { useMutation } from '@tanstack/react-query';
import { captureOnboardingForm, OnboardingCaptureFormRequest } from '@/lib/api/onBoarding';

interface OnboardingFormData {
  orgName: string;
  userInputs: Record<string, string>;
}

export const useOnboardingForm = () => {
  return useMutation({
    mutationFn: async (data: OnboardingFormData): Promise<any> => {
      const payload: OnboardingCaptureFormRequest = {
        orgName: data.orgName,
        source: 'Web',
        userInputs: data.userInputs,
      };
      
      return await captureOnboardingForm(payload);
    },
    onError: (error: any) => {
      console.error('Failed to submit onboarding form:', error);
      throw error;
    },
  });
}; 