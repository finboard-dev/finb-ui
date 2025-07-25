import {  fetcher } from "../axios/config";
import { store } from "../store/store";

  export const getAllCompany = async () => {
  const orgId = store.getState().user.selectedOrganization?.id;
  const response = await fetcher.get(`${process.env.NEXT_PUBLIC_API_DEV}/company/all?orgId=${orgId}`);
  return response;
};

export const getCurrentCompany = async (companyId: string) => {
  return await fetcher.post(`${process.env.NEXT_PUBLIC_API_DEV}/company/current`, { companyId });
};