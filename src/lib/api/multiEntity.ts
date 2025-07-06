import { fetcher } from "../axios/config";

interface CreateMultiEntityRequest {
  company_name: string;
  is_active: boolean;
  currency: string;
  financial_year_start: string;
  sub_entities: string[];
}

export const createMultiEntity = async (data: CreateMultiEntityRequest) => {
  const response = await fetcher.post(`${process.env.NEXT_PUBLIC_API_DEV}/company/group/create`, data);
  return response;
};

export const deleteMultiEntity = async (id: string) => {
  const response = await fetcher.delete(`${process.env.NEXT_PUBLIC_API_DEV}/company/group/delete?company_id=${id}`);
  return response;
}