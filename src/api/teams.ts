// Teams API — matches app/api/v1/routers/team_router.py.
import { apiClient } from "../utils/apiClient";
import type {
  TeamCreate,
  TeamWithMembersOut,
  ProjectTeamsOut,
  ProjectTeamAssign,
  TeamMemberInput,
} from "../types/team";

export const teamApi = {
  // Team CRUD
  createTeam: (data: TeamCreate) => apiClient.post<TeamWithMembersOut>("/teams", data),
  listTeams: () => apiClient.get<TeamWithMembersOut[]>("/teams"),
  getTeam: (teamId: string) => apiClient.get<TeamWithMembersOut>(`/teams/${teamId}`),
  removeTeam: (teamId: string) => apiClient.delete(`/teams/${teamId}`),
  addMembers: (teamId: string, members: TeamMemberInput[]) =>
    apiClient.post<TeamWithMembersOut>(`/teams/${teamId}/members`, members),

  // Project Teams
  assignTeamToProject: (projectId: string, payload: ProjectTeamAssign) =>
    apiClient.post<ProjectTeamsOut>(`/projects/${projectId}/teams`, payload),
  getProjectTeams: (projectId: string) =>
    apiClient.get<TeamWithMembersOut[]>(`/projects/${projectId}/teams`),
};
