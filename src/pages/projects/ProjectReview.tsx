import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Users,
  Layers,
  Building2,
  Calendar,
  Hash,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectApi } from "../../api/projects";
import { teamApi } from "../../api/teams";
import { clientsApi } from "../../api/clients";
import type { ProjectFormData } from "../../types/project";
import type { TeamMemberRole } from "../../types/team";
import type { ClientOut } from "../../types/client";

interface ReviewMember {
  userId: string;
  name: string;
  email: string;
  role: TeamMemberRole;
}

interface ReviewState {
  projectData?: ProjectFormData | null;
  projectId?: string;
  existingProjectName?: string;
  teamData?: {
    teamName: string;
    description: string;
    members: ReviewMember[];
  } | null;
}

export function ProjectReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [creating, setCreating] = useState(false);

  const state = (location.state ?? {}) as Partial<ReviewState>;
  const projectData = state.projectData;
  const existingProjectId = state.projectId;
  const existingProjectName = state.existingProjectName;
  const teamData = state.teamData;

  const isExistingProjectMode = !!existingProjectId && !projectData;

  const hasTeam = !!teamData;

  const [clientLabel, setClientLabel] = useState<string | null>(null);

  // Resolve client label for display
  React.useEffect(() => {
    if (!projectData?.clientId) return;
    let cancelled = false;
    clientsApi
      .list()
      .then((data: ClientOut[]) => {
        if (cancelled) return;
        const c = data.find((x) => x.client_id === projectData.clientId);
        setClientLabel(c ? `${c.client_name}${c.company_name ? ` (${c.company_name})` : ""}` : projectData.clientId);
      })
      .catch(() => {
        if (!cancelled) setClientLabel(projectData.clientId);
      });
    return () => {
      cancelled = true;
    };
  }, [projectData?.clientId]);

  const handleBack = () => {
    if (isExistingProjectMode) {
      navigate(`/dashboard/projects/${existingProjectId}`);
      return;
    }
    navigate(`/dashboard/projects/create/team`, {
      state: {
        projectData,
        teamData: teamData ?? null,
      },
    });
  };

  const handleCreate = async () => {
    if (isExistingProjectMode && !teamData) {
      toast.error("Please assemble a team before saving.");
      navigate(`/dashboard/projects/${existingProjectId}`);
      return;
    }

    let createdProjectId: string | null = isExistingProjectMode ? existingProjectId! : null;
    let createdTeamId: string | null = null;

    try {
      setCreating(true);

      // 1. Create the project (only in the full create flow)
      if (!isExistingProjectMode) {
        if (
          !projectData ||
          !projectData.projectName ||
          !projectData.projectCode ||
          !projectData.clientId ||
          !projectData.startDate ||
          !projectData.endDate
        ) {
          toast.error("Project details are incomplete.");
          navigate(`/dashboard/projects/create`, { replace: true });
          return;
        }

        const project = await projectApi.create({
          project_name: projectData.projectName,
          project_code: projectData.projectCode.toUpperCase(),
          description: projectData.description,
          client_id: projectData.clientId,
          start_date: projectData.startDate,
          end_date: projectData.endDate,
        });
        createdProjectId = project.project_id;

        toast.success("Project created successfully!", {
          description: project.project_name,
        });
      }

      // 2 & 3. Create the team and assign it to the project (unless skipped)
      if (teamData) {
        if (!teamData.teamName || !teamData.description || teamData.members.length === 0) {
          toast.error("Team details are incomplete.");
          navigate(`/dashboard/projects/create/team`, {
            replace: true,
            state: { projectData, teamData },
          });
          return;
        }

        const team = await teamApi.createTeam({
          team_name: teamData.teamName,
          description: teamData.description,
          members: teamData.members.map((m) => ({ user_id: m.userId, role: m.role })),
        });
        createdTeamId = team.team_id;

        await teamApi.assignTeamToProject(createdProjectId, {
          team_id: team.team_id,
        });

        toast.success("Team created and assigned successfully!", {
          description: `${team.team_name} with ${teamData.members.length} member(s).`,
        });
      }

      navigate(`/dashboard/projects/${createdProjectId}`, { replace: true });
    } catch (err: unknown) {
      console.error("Create project/team failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to create project and team.";
      toast.error(msg, { description: "Rolling back any partial changes." });

      // Rollback: remove anything that was already created so nothing is left orphaned.
      try {
        if (createdTeamId) {
          await teamApi.removeTeam(createdTeamId);
        }
        if (!isExistingProjectMode && createdProjectId) {
          await projectApi.remove(createdProjectId);
        }
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }

      // Go back to a fresh Create Project page after the failed attempt.
      navigate(`/dashboard/projects/create`, { replace: true });
    } finally {
      setCreating(false);
    }
  };

  if ((!isExistingProjectMode && !projectData) || (isExistingProjectMode && !existingProjectId)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground">Missing form data</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Project or team details are missing. Please restart the creation flow.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/projects/create`)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium transition cursor-pointer"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xl shadow-inner">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                  {isExistingProjectMode ? "Final Review" : "Step 3 of 3"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Final Review
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-0.5">Review &amp; Create</h1>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Verify the details below before saving.
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 text-sm font-medium bg-muted/60 px-4 py-2 rounded-xl border border-border/50">
            {isExistingProjectMode ? (
              <>
                <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">✓</span>
                <span className="text-muted-foreground line-through">Team Setup</span>
                <span className="text-muted-foreground">→</span>
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">✓</span>
                <span className="text-foreground font-semibold">Review</span>
              </>
            ) : (
              <>
                <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">✓</span>
                <span className="text-muted-foreground line-through">Project Details</span>
                <span className="text-muted-foreground">→</span>
                <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">✓</span>
                <span className="text-muted-foreground line-through">Team Setup</span>
                <span className="text-muted-foreground">→</span>
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">3</span>
                <span className="text-foreground font-semibold">Review</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Project Summary — only in the full create flow */}
      {!isExistingProjectMode && (
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-border/60 pb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Project Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project Name</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{projectData.projectName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Hash className="w-3 h-3" /> Project Code
            </p>
            <p className="text-sm font-semibold text-foreground font-mono mt-0.5">{projectData.projectCode}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
            <p className="text-sm text-foreground mt-0.5">{projectData.description}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Client
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{clientLabel || "Loading..."}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Start Date
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{projectData.startDate}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Calendar className="w-3 h-3" /> End Date
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{projectData.endDate}</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Team Summary */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-border/60 pb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-foreground">Team Details</h2>
        </div>

        {teamData ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team Name</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{teamData.teamName}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team Description</p>
                <p className="text-sm text-foreground mt-0.5">{teamData.description}</p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> Members ({teamData.members.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {teamData.members.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-600 text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        m.role === "front_end"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-dashed border-border bg-muted/40">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">No team added</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                You skipped team assembly. The project will be created without a team — you can add one later from the project page.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />{" "}
              {isExistingProjectMode ? "Creating Team..." : hasTeam ? "Creating Project & Team..." : "Creating Project..."}
            </>
          ) : (
            <>
              {isExistingProjectMode
                ? "Create & Assign Team"
                : hasTeam
                  ? "Create Project & Team"
                  : "Create Project"}{" "}
              <CheckCircle2 className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
export default ProjectReview;