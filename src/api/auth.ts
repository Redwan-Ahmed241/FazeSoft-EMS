// Auth API — matches app/api/v1/routers/auth_router.py.
import { apiClient } from "../utils/apiClient";
import type { EmployeeCreate, RoleChangeRequest, Token, UserCreate, UserLogin, UserOut } from "../types/auth";

let cachedUsers: { data: UserOut[]; timestamp: number } | null = null;
const USERS_CACHE_TTL_MS = 60_000; // 1 minute in-memory cache

export const authApi = {
  login: (payload: UserLogin) => apiClient.post<Token>("/auth/login", payload),
  signup: (payload: UserCreate) => apiClient.post<Token>("/auth/signup", payload),
  createEmployee: async (payload: EmployeeCreate) => {
    cachedUsers = null;
    return apiClient.post<UserOut>("/auth/create-employee", payload);
  },
  me: () => apiClient.get<UserOut>("/auth/me"),
  listUsers: async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && cachedUsers && now - cachedUsers.timestamp < USERS_CACHE_TTL_MS) {
      return cachedUsers.data;
    }
    const users = await apiClient.get<UserOut[]>("/auth/users");
    cachedUsers = { data: users || [], timestamp: now };
    return users;
  },
  invalidateUsersCache: () => {
    cachedUsers = null;
  },
  changeRole: async (userId: string, payload: RoleChangeRequest) => {
    cachedUsers = null;
    return apiClient.patch<UserOut>(`/users/${userId}/role`, payload);
  },
};