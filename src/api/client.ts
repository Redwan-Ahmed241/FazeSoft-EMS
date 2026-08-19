// API layer — token helpers shared by all src/api modules.
// The HTTP client lives in src/utils/apiClient.ts (single FastAPI client).
import { apiClient } from "../utils/apiClient";

export { apiClient };

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}