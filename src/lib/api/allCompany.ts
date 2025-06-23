import { apiClient, fetcher } from "../axios/config";

export const getAllCompany = async () => {
  const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/company/all`);
  return response;
};

export const getCurrentCompany = async (companyId: string) => {
  return await fetcher.post(`${process.env.NEXT_PUBLIC_API_DEV}/company/current`, { companyId });
};