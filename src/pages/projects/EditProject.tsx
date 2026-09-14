import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Pencil,
  ArrowLeft,
  Calendar,
  Building2,
  Hash,
  FileText,
  Loader2,
  Users,
  Plus,
  Check,
  Layers,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectApi } from "../../api/projects";
import { teamApi } from "../../api/teams";
import { clientsApi } from "../../api/clients";
import { authApi } from "../../api/auth";
import type { ProjectOut } from "../../types/project";
import type { ClientOut } from "../../types/client";
import type { TeamWithMembersOut, TeamMemberRole } from "../../types/team";
import type { UserOut } from "../../types/auth";

interface MemberPick {
  userId: string;
  name: string;
  email: string;
  role: TeamMemberRole;
}

const NEW_TEAM_KEY = "__new__";

export function EditProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<ProjectOut | null>(null);
  const [clients, setClients] = useState<ClientOut[]>([]);
  const [teams, setTeams] = useState<TeamWithMembersOut[]>([]);

  // Project form state
  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Team member picker state
  const [allUsers, setAllUsers] = useState<UserOut[]>([]);
  const [perTeamAdds, setPerTeamAdds] = useState<Record<string, MemberPick[]>>({});

  useEffect(() => {
    async function load() {
      if (!projectId) return;
      try {
        setLoading(true);
        const [proj, clientList, teamsData, users] = await Promise.all([
          projectApi.get(projectId),
          clientsApi.list().catch(() => [] as ClientOut[]),
          teamApi.getProjectTeams(projectId).catch(() => [] as TeamWithMembersOut[]),
          authApi.listUsers().catch(() => [] as UserOut[]),
        ]);
        setProject(proj);
        setClients(clientList);
        setTeams(teamsData || []);
        setAllUsers(users || []);
        setProjectName(proj.project_name);
        setProjectCode(proj.project_code);
        setDescription(proj.description);
        setClientId(proj.client_id);
        setStartDate(proj.start_date);
        setEndDate(proj.end_date);
      } catch (err) {
        console.error("Failed to load project:", err);
        toast.error("Failed to load project.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    if (!projectName.trim() || !projectCode.trim() || !description.trim() || !clientId || !startDate || !endDate) {
      toast.error("Please fill all required project fields.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("End Date cannot be earlier than Start Date.");
      return;
    }
    setSaving(true);
    try {
      // 1) Update project details
      await projectApi.update(projectId, {
        project_name: projectName.trim(),
        project_code: projectCode.trim().toUpperCase(),
        description: description.trim(),
        client_id: clientId,
        start_date: startDate,
        end_date: endDate,
      });

      // 2) Persist member picks serially (one call per team)
      for (const [teamKey, picks] of Object.entries(perTeamAdds)) {
        if (picks.length === 0) continue;

        if (teamKey === NEW_TEAM_KEY && teams.length === 0) {
          // No team exists yet — create one, assign it, then mark members added.
          const created = await teamApi.createTeam({
            team_name: projectName.trim(),
            description: description.trim() || "Members assembled for this project.",
            members: [],
          });
          await teamApi.assignTeamToProject(projectId, { team_id: created.team_id });
          await teamApi.addMembers(
            created.team_id,
            picks.map((m) => ({ user_id: m.userId, role: m.role }))
          );
        } else if (teamKey !== NEW_TEAM_KEY && teams.some((t) => t.team_id === teamKey)) {
          await teamApi.addMembers(
            teamKey,
            picks.map((m) => ({ user_id: m.userId, role: m.role }))
          );
        }
      }

      setPerTeamAdds({});
      await refreshTeams();
      toast.success("Project and team members updated successfully!");
    } catch (err) {
      console.error("Failed to save project:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save project.");
      // Refresh so the UI reflects what actually persisted.
      try {
        await Promise.all([refreshProject(), refreshTeams()]);
      } catch {
        /* state refresh is best-effort */
      }
    } finally {
      setSaving(false);
    }
  };

  const refreshProject = async () => {
    if (!projectId) return;
    const proj = await projectApi.get(projectId);
    setProject(proj);
    setProjectName(proj.project_name);
    setProjectCode(proj.project_code);
    setDescription(proj.description);
    setClientId(proj.client_id);
    setStartDate(proj.start_date);
    setEndDate(proj.end_date);
  };

  const refreshTeams = async () => {
    if (!projectId) return;
    const teamsData = await teamApi.getProjectTeams(projectId);
    setTeams(teamsData || []);
  };

  const toggleMember = (teamId: string, u: UserOut) => {
    setPerTeamAdds((prev) => {
      const current = prev[teamId] || [];
      const exists = current.some((m) => m.userId === u.id);
      const next = exists
        ? current.filter((m) => m.userId !== u.id)
        : [
            ...current,
            {
              userId: u.id,
              name: u.full_name || u.email.split("@")[0],
              email: u.email,
              role: "front_end" as TeamMemberRole,
            },
          ];
      return { ...prev, [teamId]: next };
    });
  };

  const setMemberRole = (teamId: string, userId: string, role: TeamMemberRole) => {
    setPerTeamAdds((prev) => {
      const current = (prev[teamId] || []).map((m) =>
        m.userId === userId ? { ...m, role } : m
      );
      return { ...prev, [teamId]: current };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-bold text-foreground">Project Not Found</h2>
        <button
          onClick={() => navigate("/dashboard/projects")}
          className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition cursor-pointer"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const addableUsers = (teamId: string) => {
    if (teamId === NEW_TEAM_KEY) {
      const picked = new Set((perTeamAdds[NEW_TEAM_KEY] || []).map((m) => m.userId));
      return allUsers.filter((u) => !picked.has(u.id));
    }
    const team = teams.find((t) => t.team_id === teamId);
    const existing = new Set((team?.members || []).map((m) => m.user_id));
    const picked = new Set((perTeamAdds[teamId] || []).map((m) => m.userId));
    return allUsers.filter((u) => !existing.has(u.id) && !picked.has(u.id));
  };

  const renderTeamMemberCard = (
    cardKey: string,
    title: string,
    desc: string,
    memberCount: number,
    currentMembers: { user_id: string; role: TeamMemberRole }[]
  ) => {
    const pending = perTeamAdds[cardKey] || [];
    const addable = addableUsers(cardKey);
    return (
      <div key={cardKey} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-foreground border border-border w-fit">
            {memberCount} Member(s)
          </span>
        </div>

        {/* Current members */}
        <div className="flex flex-wrap gap-2">
          {currentMembers.map((m) => {
            const userObj = allUsers.find((u) => u.id === m.user_id);
            const name = userObj?.full_name || userObj?.email?.split("@")[0] || `Member #${m.user_id.slice(0, 8)}`;
            return (
              <span
                key={m.user_id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-border bg-background/50 text-xs font-medium"
                title={userObj?.email || ""}
              >
                <span className={m.role === "front_end" ? "text-blue-600 font-semibold" : "text-emerald-600 font-semibold"}>
                  {m.role === "front_end" ? "FE" : "BE"}
                </span>
                <span>{name}</span>
                {userObj?.email && (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    ({userObj.email})
                  </span>
                )}
              </span>
            );
          })}
          {currentMembers.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              {cardKey === NEW_TEAM_KEY ? "No team yet — a new team will be created on Save." : "No members yet."}
            </p>
          )}
        </div>

        {/* Add members */}
        <div className="pt-3 border-t border-border/60 space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-primary" /> Add Members
          </p>
          {addable.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {cardKey === NEW_TEAM_KEY
                ? "No more users available."
                : "All users are already on this team."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {addable.map((u) => {
                const sel = pending.some((m) => m.userId === u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleMember(cardKey, u)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      sel
                        ? "bg-primary text-white border-primary"
                        : "bg-background border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {u.full_name || u.email.split("@")[0]}
                  </button>
                );
              })}
            </div>
          )}

          {pending.length > 0 && (
            <div className="space-y-2">
              {pending.map((m) => (
                <div key={m.userId} className="flex items-center justify-between gap-2 p-2 rounded-xl border border-border bg-muted/40">
                  <span className="text-xs font-medium text-foreground truncate">{m.name}</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={m.role}
                      onChange={(e) => setMemberRole(cardKey, m.userId, e.target.value as TeamMemberRole)}
                      className="px-2 py-1 rounded-lg border border-input bg-background text-xs focus:outline-none"
                    >
                      <option value="front_end">Front End</option>
                      <option value="back_end">Back End</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => toggleMember(cardKey, allUsers.find((u) => u.id === m.userId)!)}
                      className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard/projects")}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
      </div>

      {/* Project Edit Card */}
      <form onSubmit={handleSaveProject} className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-border/60 pb-4">
          <Pencil className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Edit Project</h2>
            <p className="text-sm text-muted-foreground">Update the project details and save.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Project Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground flex items-center gap-1">
              <Hash className="w-4 h-4 text-primary" /> Project Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition uppercase"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Description <span className="text-red-500">*</span></label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition resize-y min-h-[90px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-primary" /> Client <span className="text-red-500">*</span>
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
          >
            {clients.map((c) => (
              <option key={c.client_id} value={c.client_id}>
                {c.client_name} ({c.company_name})
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-semibold shadow-md hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Project
          </button>
        </div>
      </form>

      {/* Teams Management */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" /> Teams & Members
            </h2>
            <p className="text-sm text-muted-foreground">Add members to existing teams or create a new team.</p>
          </div>
          <button
            onClick={() => navigate(`/dashboard/projects/${projectId}/create-team`)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-700 transition cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Team
          </button>
        </div>

        <div className="space-y-4">
          {teams.length === 0
            ? renderTeamMemberCard(
                NEW_TEAM_KEY,
                "Team Members",
                "No team assigned yet — a new team will be created when you Save.",
                0,
                []
              )
            : teams.map((t) =>
                renderTeamMemberCard(
                  t.team_id,
                  t.team_name,
                  t.description || "Team on this project.",
                  t.members?.length || 0,
                  (t.members || []).map((m) => ({ user_id: m.user_id, role: m.role }))
                )
              )}
        </div>
      </div>
    </div>
  );
}
export default EditProject;