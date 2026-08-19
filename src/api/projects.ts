// Projects API — matches app/api/v1/routers/project_router.py.
import { apiClient } from "../utils/apiClient";
import type { ProjectCreate, ProjectListOut, ProjectOut } from "../types/project";

export const projectApi = {
  create: (data: ProjectCreate) => apiClient.post<ProjectOut>("/projects", data),
  list: () => apiClient.get<ProjectListOut[]>("/projects"),
  get: (id: string) => apiClient.get<ProjectOut>(`/projects/${id}`),
};