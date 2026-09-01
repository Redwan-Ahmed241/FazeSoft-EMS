import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Folder,
  Users,
  Calendar,
  Building2,
  User as UserIcon,
  Clock,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Briefcase,
  Layers,
  Sparkles,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectApi } from "../../api/projects";
import { teamApi } from "../../api/teams";
import { clientsApi } from "../../api/clients";
import type { ProjectOut } from "../../types/project";
import type { TeamWithMembersOut } from "../../types/team";
import type { ClientOut } from "../../types/client";

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectOut | null>(null);
  const [teams, setTeams] = useState<TeamWithMembersOut[]>([]);
  const [client, setClient] = useState<ClientOut | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      try {
        setLoading(true);
        // Load project
        const projData = await projectApi.get(projectId);
        setProject(projData);

        // Load project teams
        try {
          const teamsData = await teamApi.getProjectTeams(projectId);
          setTeams(teamsData || []);
        } catch (teamErr) {
          console.warn("Could not load project teams:", teamErr);
        }

        // Load client
        if (projData?.client_id) {
          try {
            const clientData = await clientsApi.get(projData.client_id);
            setClient(clientData);
          } catch (clientErr) {
            console.warn("Could not load client details:", clientErr);
          }
        }
      } catch (err: unknown) {
        console.error("Failed to load project:", err);
        toast.error("Failed to load project details.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading project overview...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-lg mx-auto mt-10 space-y-4">
        <Folder className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Project Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested project could not be found or has been moved.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <Link
            to={`/dashboard/projects/${projectId}/create-team`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Another Team
          </Link>
        </div>
      </div>

      {/* Project Banner Card */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                {project.project_code}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  project.status === "In Progress"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    : project.status === "Completed"
                    ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                }`}
              >
                {project.status}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Active Workspace
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {project.project_name}
            </h1>

            <p className="text-muted-foreground text-sm leading-relaxed pt-1">
              {project.description}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex flex-row md:flex-col gap-4 bg-muted/40 p-4 rounded-xl border border-border/60 min-w-[200px]">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Start Date</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" /> {project.start_date}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">End Date</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" /> {project.end_date}
              </p>
            </div>
          </div>
        </div>

        {/* Client & Info Meta Strip */}
        <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Client / Organization</p>
              <p className="font-semibold text-foreground">
                {client?.client_name || client?.company_name || "Client #" + project.client_id.slice(0, 8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Project Manager</p>
              <p className="font-semibold text-foreground">Admin Lead</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Assigned Squads</p>
              <p className="font-semibold text-foreground">{teams.length} Team(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teams and Members Roster Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" /> Assigned Teams & Members
            </h2>
            <p className="text-sm text-muted-foreground">
              Teams assembled to execute and deliver this project.
            </p>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-2xl p-10 text-center space-y-3">
            <Users className="w-10 h-10 text-muted-foreground mx-auto opacity-60" />
            <h3 className="text-base font-semibold text-foreground">No Teams Assigned Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You have not created or assigned a team for this project yet.
            </p>
            <Link
              to={`/dashboard/projects/${projectId}/create-team`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 transition"
            >
              <Plus className="w-4 h-4" /> Create First Team
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {teams.map((t) => (
              <div
                key={t.team_id}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{t.team_name}</h3>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-foreground border border-border w-fit">
                    {t.members?.length || 0} Member(s)
                  </span>
                </div>

                {/* Member Badges & Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {t.members && t.members.length > 0 ? (
                    t.members.map((m) => (
                      <div
                        key={m.user_id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">
                            {m.user_id.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              Member #{m.user_id.slice(0, 8)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Joined squad</p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            m.role === "front_end"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {m.role}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic col-span-3">
                      No members attached to this team yet.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default ProjectDetail;
