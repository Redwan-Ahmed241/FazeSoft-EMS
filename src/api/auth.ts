// Auth API — matches app/api/v1/routers/auth_router.py.
import { apiClient } from "../utils/apiClient";
import type { EmployeeCreate, RoleChangeRequest, Token, UserCreate, UserLogin, UserOut } from "../types/auth";

export const authApi = {
  login: (payload: UserLogin) => apiClient.post<Token>("/auth/login", payload),
  signup: (payload: UserCreate) => apiClient.post<Token>("/auth/signup", payload),
  createEmployee: (payload: EmployeeCreate) => apiClient.post<UserOut>("/auth/create-employee", payload),
  me: () => apiClient.get<UserOut>("/auth/me"),
  listUsers: () => apiClient.get<UserOut[]>("/auth/users"),
  changeRole: (userId: string, payload: RoleChangeRequest) =>
    apiClient.patch<UserOut>(`/users/${userId}/role`, payload),
};