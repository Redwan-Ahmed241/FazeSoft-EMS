// Teams API — matches app/api/v1/routers/team_router.py.
import { apiClient } from "../utils/apiClient";
import type {
  TeamCreate,
  TeamWithMembersOut,
  ProjectTeamsOut,
  ProjectTeamAssign,
} from "../types/team";

export const teamApi = {
  // Team CRUD
  createTeam: (data: TeamCreate) => apiClient.post<TeamWithMembersOut>("/v1/teams", data),
  listTeams: () => apiClient.get<TeamWithMembersOut[]>("/v1/teams"),
  getTeam: (teamId: string) => apiClient.get<TeamWithMembersOut>(`/v1/teams/${teamId}`),

  // Project Teams
  assignTeamToProject: (projectId: string, payload: ProjectTeamAssign) =>
    apiClient.post<ProjectTeamsOut>(`/v1/projects/${projectId}/teams`, payload),
  getProjectTeams: (projectId: string) =>
    apiClient.get<TeamWithMembersOut[]>(`/v1/projects/${projectId}/teams`),
};
