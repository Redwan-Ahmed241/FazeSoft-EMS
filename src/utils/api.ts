/**
 * api.ts — API utility for FazeMate frontend.
 *
 * MODE: json-server (temporary, until Supabase/FastAPI is ready)
 * Candidates → http://localhost:3001/candidates
 * Auth       → localStorage mock (no server needed for now)
 *
 * To switch to FastAPI later, just change JSON_SERVER_URL to
 * http://localhost:8000 and restore the auth endpoints.
 */

const JSON_SERVER_URL = "http://localhost:3001";

// ─────────────────────────────────────────────────────────────
//  Token helpers (kept for future FastAPI migration)
// ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}

// ─────────────────────────────────────────────────────────────
//  Core request helper — points at json-server
// ─────────────────────────────────────────────────────────────

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

async function request<T = unknown>(url: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body } = options;

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204 || response.status === 200 && response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }

  return data as T;
}

// ─────────────────────────────────────────────────────────────
//  Auth types (used by AuthContext)
// ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// ─────────────────────────────────────────────────────────────
//  Candidate API — backed by json-server /candidates
// ─────────────────────────────────────────────────────────────

export interface CandidateApiData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  ai_score: number;
  experience: string | null;
  skills: string[];
  status: "Applied" | "Screened" | "Interview" | "Offer" | "Hired" | "Approved" | "Rejected";
  avatar: string | null;
  applied_date: string;
  match_reasons: string[] | null;
}

export const candidateApi = {
  list: () =>
    request<CandidateApiData[]>(`${JSON_SERVER_URL}/candidates`),

  get: (id: number) =>
    request<CandidateApiData>(`${JSON_SERVER_URL}/candidates/${id}`),

  create: (data: Omit<CandidateApiData, "id">) =>
    request<CandidateApiData>(`${JSON_SERVER_URL}/candidates`, {
      method: "POST",
      body: data,
    }),

  update: (id: number, data: Partial<CandidateApiData>) =>
    request<CandidateApiData>(`${JSON_SERVER_URL}/candidates/${id}`, {
      method: "PUT",
      body: data,
    }),

  // json-server supports PATCH natively for partial updates
  updateStatus: (id: number, status: string) =>
    request<CandidateApiData>(`${JSON_SERVER_URL}/candidates/${id}`, {
      method: "PATCH",
      body: { status },
    }),

  delete: (id: number) =>
    request<void>(`${JSON_SERVER_URL}/candidates/${id}`, {
      method: "DELETE",
    }),
};
