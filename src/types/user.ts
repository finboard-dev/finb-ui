// types.ts

export interface Company {
  id: string;
  is_active: boolean;
  name: string;
}

export interface Organization {
  id: string;
  is_active: boolean;
  name: string;
}

export interface User {
  email: string;
  username: string;
  full_name: string | null;
  id: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  companies: Company[];
  organization: Organization;
  roles: string[];
  permissions: string[];
}