// Submissions API — matches app/api/v1/routers/submission_router.py.
import { apiClient } from "../utils/apiClient";
import type { SubmissionCreate, SubmissionOut } from "../types/submission";

export const submissionApi = {
  create: (taskId: string, data: SubmissionCreate) =>
    apiClient.post<SubmissionOut>(`/tasks/${taskId}/submissions`, data),

  listByTask: (taskId: string) =>
    apiClient.get<SubmissionOut[]>(`/tasks/${taskId}/submissions`),
};
