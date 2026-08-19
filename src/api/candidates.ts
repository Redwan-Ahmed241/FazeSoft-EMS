// Candidates API — matches app/api/v1/routers/candidate_router.py.
import { apiClient } from "../utils/apiClient";
import type { CandidateCreate, CandidateOut, CandidateUpdate } from "../types/candidate";

export const candidateApi = {
  list: () => apiClient.get<CandidateOut[]>("/candidates"),
  get: (id: number) => apiClient.get<CandidateOut>(`/candidates/${id}`),
  create: (data: CandidateCreate) => apiClient.post<CandidateOut>("/candidates", data),
  update: (id: number, data: CandidateUpdate) => apiClient.put<CandidateOut>(`/candidates/${id}`, data),
  updateStatus: (id: number, status: string) =>
    apiClient.patch<CandidateOut>(`/candidates/${id}/status`, { status }),
  delete: (id: number) => apiClient.delete<void>(`/candidates/${id}`),
};