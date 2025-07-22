import { fetcher } from "../axios/config";

export const consolidationApi = {
    async getChartOfAccounts(id: string) {
        const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV_V1}/mapping/chart_of_accounts/${id}`);
        
        return response
    },

    async getMappingForAccountByType(id: string, type: string) {
        const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV_V1}/mapping/${id}/${type}`);
        
        return response
    },

    async saveMappings(data: any) {
        const response = await fetcher.post(`${process.env.NEXT_PUBLIC_API_DEV_V1}/mapping/save`, data);
        
        return response
    },

    async initReconnectQuickBookAccount(id: string) {
        const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV_V1}/qb/reconnect/${id}`);
        
        return response
    },

    async getAllSpreadsheets(id: string) {
        const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV_V1}/template/qb/user/${id}`);
        
        return response
    }
};
