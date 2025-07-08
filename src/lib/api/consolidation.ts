import { store } from "../store/store";


const API_BASE_URL = 'https://dev.api.finboard.ai/api/v1';

const getAuthHeaders = () => {
    const token = store.getState().user.token?.accessToken;
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export const consolidationApi = {
    async getChartOfAccounts(id: string) {
        const response = await fetch(`${API_BASE_URL}/mapping/chart_of_accounts/${id}`, {
            headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch chart of accounts');
        }
        
        return response.json();
    },

    async getMappingForAccountByType(id: string, type: string) {
        const response = await fetch(`${API_BASE_URL}/mapping/${id}/${type}`, {
            headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch mapping data');
        }
        
        return response.json();
    },

    async saveMappings(data: any) {
        const response = await fetch(`${API_BASE_URL}/mapping/save`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error('Failed to save mappings');
        }
        
        return response.json();
    },

    async initReconnectQuickBookAccount(id: string) {
        const response = await fetch(`${API_BASE_URL}/qb/reconnect/${id}`, {
            headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
            throw new Error('Failed to initiate reconnection');
        }
        
        return response.json();
    },

    async getAllSpreadsheets(id: string) {
        const response = await fetch(`${API_BASE_URL}/template/qb/user/${id}`, {
            headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch spreadsheets');
        }
        
        return response.json();
    }
};
