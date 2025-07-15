import { store } from "../store/store";

export const getCompanyId = () => {
  const data = store.getState().user;
  return data?.selectedCompany?.id;
};

export const getOrgId = () => {
  const data = store.getState().user;
  return data?.selectedOrganization?.id;
};