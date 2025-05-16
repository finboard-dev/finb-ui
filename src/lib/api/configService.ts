import { getBearerToken } from '@/lib/auth/authUtils';
import { store } from '../store/store';
import { fetcher } from '../axios/config';

interface ConfigItem {
    key: string;
    name: string;
    type: string;
    defaultValue?: any;
    options?: string[];
}

interface ConfigResponse {
    organizationConfig: ConfigItem[];
    companyConfig: ConfigItem[];
}

/**
 * Fetches the configuration template from the API
 * @returns Promise<ConfigResponse>
 */
export const getConfigurationTemplate = async (): Promise<ConfigResponse> => {
    try {
        const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/configurations/template`)
        return response;
    } catch (error) {
        debugger; // Debug point 9: Error handling
        console.error('Error fetching configuration template:', error);
        throw error;
    }
};
