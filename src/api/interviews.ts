// Interviews API — matches app/api/v1/routers/interview_router.py.
import { apiClient } from "../utils/apiClient";
import type { InterviewCreate, InterviewOut } from "../types/interview";

export const interviewApi = {
  list: () => apiClient.get<InterviewOut[]>("/interviews"),
  get: (id: number) => apiClient.get<InterviewOut>(`/interviews/${id}`),
  create: (data: InterviewCreate) => apiClient.post<InterviewOut>("/interviews", data),
  delete: (id: number) => apiClient.delete<void>(`/interviews/${id}`),
};