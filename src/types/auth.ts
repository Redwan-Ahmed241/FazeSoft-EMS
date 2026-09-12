// TypeScript interfaces matching app/schemas/user.py in the FastAPI backend.

export type UserRole = "hr" | "candidate" | "admin" | "employee";

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string | null;
}

export interface EmployeeCreate {
  email: string;
  password: string;
  full_name?: string | null;
  job_title?: string | null;
}

export interface UserOut {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  role_name?: string | null;
  role_desc?: string | null;
  phone: string | null;
  location: string | null;
  job_title: string | null;
  bio: string | null;
  avatar: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: UserOut;
}