import { fetcher } from "@/lib/axios/config";

export interface SSOResponse {
  token: {
    accessToken: string;    
    expiresIn: number;     
    tokenType: string;    
  };
  user: {
    id: string;
    email: string;
    firstName: string;     
    lastName: string;      
    organizations: Array<{
      id: string;
      name: string;
      status: string;
      companies: Array<{
        id: string;
        name: string;
        status: string;
        role: {
          id: number;
          name: string;
          permissions: string[];
        };
      }>;
      role: {
        id: number;
        name: string;
        permissions: string[];
      };
    }>;
    lastLoginTime: string; 
  };
}

export const ssoLogin = async (authCode: any, realmId: null) : Promise<SSOResponse> => {
  try {
    const response = await fetcher.post(realmId != null ? `/qb/add_app` : `/auth/login`, {
      source: "QuickBooks",
      metadata: {
        auth_code: authCode,
        realm_id: realmId
      },
      sso_provider: "INTUIT"
    });
    const data = response
    return data;
  } catch (error) {
    console.error("SSO login error:", error);
    throw new Error("SSO login failed. Please check the error logs for more details.");
  }
};