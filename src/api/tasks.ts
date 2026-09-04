// Tasks API — matches app/api/v1/routers/task_router.py.
import { apiClient } from "../utils/apiClient";
import type { TaskCreate, TaskOut, TaskUpdate } from "../types/task";

export const taskApi = {
  // Create / assign task
  create: (projectId: string, data: TaskCreate) =>
    apiClient.post<TaskOut>(`/projects/${projectId}/tasks`, data),

  // List tasks for a project
  listByProject: (projectId: string) =>
    apiClient.get<TaskOut[]>(`/projects/${projectId}/tasks`),

  // Get single task
  get: (projectId: string, taskId: string) =>
    apiClient.get<TaskOut>(`/projects/${projectId}/tasks/${taskId}`),

  // Update task (PATCH)
  update: (projectId: string, taskId: string, data: TaskUpdate) =>
    apiClient.patch<TaskOut>(`/projects/${projectId}/tasks/${taskId}`, data),
};
