import {fetcher} from "@/lib/axios/config";


export interface SSOResponse {
  token?: {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
  };
  user?: any;
  code?: string;
  message?: string;
  redirectUrl?: string;
}

class QuickbooksService {
  async ssoLogin(authCode: string, realmId: string | null): Promise<SSOResponse> {
    try {
      const endpoint = realmId ? '/qb/add_app' : '/auth/login';
      const response = await fetcher.post(endpoint, {
        source: "QuickBooks",
        metadata: {
          auth_code: authCode,
          realm_id: realmId
        },
        sso_provider: "INTUIT"
      });

      return response.data || response;
    } catch (error) {
      console.error("SSO login error:", error);
      throw new Error(
          (error as any).response?.data?.message ||
          "SSO login failed. Please check the error logs for more details."
      );
    }
  }
}

export const quickbooksService = new QuickbooksService();