// TypeScript interfaces matching backend models for Teams and Project-Teams.

export type TeamMemberRole = "front_end" | "back_end";

export interface TeamMemberInput {
  user_id: string;
  role: TeamMemberRole;
}

export interface TeamCreate {
  team_name: string;
  description: string;
  members: TeamMemberInput[];
}

export interface TeamMemberOut {
  user_id: string;
  role: TeamMemberRole;
  joined_at: string;
}

export interface TeamOut {
  team_id: string;
  team_name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TeamWithMembersOut extends TeamOut {
  members: TeamMemberOut[];
}

export interface ProjectTeamAssign {
  team_id: string;
}

export interface ProjectTeamsOut {
  project_id: string;
  team_id: string;
  assigned_at: string;
}
