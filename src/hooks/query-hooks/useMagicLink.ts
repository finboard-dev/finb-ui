import { useMutation } from '@tanstack/react-query';
import { sendMagicLink } from '@/lib/api/magicLink';

interface MagicLinkParams {
  link: string;
}

interface Token {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastLoginTime: string;
  organizations?: any[];
  selectedCompany?: any;
  selectedOrganization?: any;
  redirectTo?: string;
  newUser?: boolean;
  pluginInstalled?: boolean;
}

interface MagicLinkResponse {
  token: Token;
  user: User;
  redirectTo?: string;
  newUser?: boolean;
  pluginInstalled?: boolean;
  success?: boolean;
  message?: string;
  error?: {
    message: string;
  };
}

export const useMagicLink = () => {
  return useMutation({
    mutationFn: async (params: MagicLinkParams): Promise<MagicLinkResponse> => {
      const response = await sendMagicLink(params.link);
      return response;
    },
    onError: (error) => {
      console.error('Magic link error:', error);
    },
  });
}; 