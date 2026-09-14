import { apiClient } from "../utils/apiClient";
import type { ProjectCreate, ProjectListOut, ProjectOut, ProjectUpdate } from "../types/project";
import type { UserOut } from "../types/auth";

export const projectApi = {
  create: (data: ProjectCreate) => apiClient.post<ProjectOut>("/projects", data),
  list: () => apiClient.get<ProjectListOut[]>("/projects"),
  listManagers: () => apiClient.get<UserOut[]>("/projects/managers"),
  get: (id: string) => apiClient.get<ProjectOut>(`/projects/${id}`),
  update: (id: string, data: ProjectUpdate) => apiClient.put<ProjectOut>(`/projects/${id}`, data),
  remove: (id: string) => apiClient.delete(`/projects/${id}`),
};