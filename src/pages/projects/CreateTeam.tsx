import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  Users,
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectApi } from "../../api/projects";
import { teamApi } from "../../api/teams";
import { authApi } from "../../api/auth";
import { useSharedContext } from "../../context/SharedContext";
import InitialsAvatar from "../../components/common/ui/InitialsAvatar";
import type { TeamMemberRole } from "../../types/team";
import type { ProjectOut } from "../../types/project";
import type { UserOut } from "../../types/auth";

interface MemberSelection {
  userId: string;
  name: string;
  email: string;
  jobTitle?: string;
  role: TeamMemberRole;
}

export function CreateTeam() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { employees } = useSharedContext();

  const [project, setProject] = useState<ProjectOut | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");

  // Employee Selection State
  const [allEmployees, setAllEmployees] = useState<Array<{ id: string; name: string; email: string; jobTitle: string }>>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Map<string, MemberSelection>>(new Map());

  // Project details loading
  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;
      try {
        setLoadingProject(true);
        const data = await projectApi.get(projectId);
        setProject(data);
      } catch (err: unknown) {
        console.error("Failed to load project details:", err);
        // If passed from location state fallback
        if (location.state?.projectName) {
          setProject({
            project_id: projectId,
            project_name: location.state.projectName,
            project_code: location.state.projectCode || "",
            description: "",
            status: "In Progress",
            manager_id: "",
            client_id: "",
            start_date: "",
            end_date: "",
            created_at: "",
            updated_at: "",
          });
        } else {
          toast.error("Could not fetch project details.");
        }
      } finally {
        setLoadingProject(false);
      }
    }
    fetchProject();
  }, [projectId, location.state]);

  // Load available staff/employees from backend auth / sharedContext
  useEffect(() => {
    async function fetchStaff() {
      try {
        setLoadingEmployees(true);
        const users = await authApi.listUsers();
        if (users && users.length > 0) {
          const mapped = users.map((u: UserOut) => ({
            id: u.id,
            name: u.full_name || u.email.split("@")[0],
            email: u.email,
            jobTitle: u.job_title || u.role || "Staff Member",
          }));
          setAllEmployees(mapped);
          return;
        }
      } catch (err) {
        console.warn("FastAPI listUsers failed or offline, falling back to local staff directory", err);
      }

      // Fallback from SharedContext if backend users table is minimal
      if (employees && employees.length > 0) {
        const mapped = employees.map((e) => ({
          id: String(e.id),
          name: e.name,
          email: e.email,
          jobTitle: e.jobTitle || "Staff Member",
        }));
        setAllEmployees(mapped);
      } else {
        // Fallback default demo staff
        setAllEmployees([
          { id: "1", name: "John Doe", email: "john@example.com", jobTitle: "Senior Backend Engineer" },
          { id: "2", name: "Jane Smith", email: "jane@example.com", jobTitle: "UI/UX Frontend Dev" },
          { id: "3", name: "Alex Johnson", email: "alex@example.com", jobTitle: "Fullstack Architect" },
          { id: "4", name: "Sarah Connor", email: "sarah@example.com", jobTitle: "Frontend Engineer" },
          { id: "5", name: "Mike Ross", email: "mike@example.com", jobTitle: "Backend Lead" },
        ]);
      }
      setLoadingEmployees(false);
    }

    fetchStaff().finally(() => setLoadingEmployees(false));
  }, [employees]);

  // Filter employees by search query
  const filteredEmployees = allEmployees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.jobTitle.toLowerCase().includes(q)
    );
  });

  // Toggle employee selection
  const handleToggleMember = (emp: { id: string; name: string; email: string; jobTitle: string }, defaultRole: TeamMemberRole = "front_end") => {
    const next = new Map(selectedMembers);
    if (next.has(emp.id)) {
      next.delete(emp.id);
    } else {
      next.set(emp.id, {
        userId: emp.id,
        name: emp.name,
        email: emp.email,
        jobTitle: emp.jobTitle,
        role: defaultRole,
      });
    }
    setSelectedMembers(next);
  };

  // Change selected member role
  const handleRoleChange = (userId: string, newRole: TeamMemberRole) => {
    const next = new Map(selectedMembers);
    const existing = next.get(userId);
    if (existing) {
      next.set(userId, { ...existing, role: newRole });
      setSelectedMembers(next);
    }
  };

  // Remove member from badge list
  const handleRemoveMember = (userId: string) => {
    const next = new Map(selectedMembers);
    next.delete(userId);
    setSelectedMembers(next);
  };

  // On Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      toast.error("Project ID is missing.");
      return;
    }
    if (!teamName.trim()) {
      toast.error("Please enter a Team Name.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a Team Description.");
      return;
    }

    try {
      setSubmitting(true);

      // Convert selected members to backend payload
      const membersPayload = Array.from(selectedMembers.values()).map((m) => ({
        user_id: m.userId,
        role: m.role,
      }));

      // 1. Create team with members
      const createdTeam = await teamApi.createTeam({
        team_name: teamName.trim(),
        description: description.trim(),
        members: membersPayload,
      });

      // 2. Assign created team to project
      await teamApi.assignTeamToProject(projectId, {
        team_id: createdTeam.team_id,
      });

      toast.success("Team created and assigned to project!", {
        description: `${createdTeam.team_name} with ${membersPayload.length} member(s).`,
      });

      // 3. Navigate to Project Detail page
      navigate(`/dashboard/projects/${projectId}`);
    } catch (err: unknown) {
      console.error("Team creation failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to create team.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xl shadow-inner">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                  Step 2 of 2
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Team Assembly
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-0.5">
                Create Team & Assign Members
              </h1>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Project:{" "}
                <span className="font-semibold text-foreground">
                  {loadingProject ? "Loading..." : project?.project_name || "Assigned Project"}
                </span>
                {project?.project_code && (
                  <span className="ml-2 font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">
                    {project.project_code}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center gap-2 text-sm font-medium bg-muted/60 px-4 py-2 rounded-xl border border-border/50">
            <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
              ✓
            </span>
            <span className="text-muted-foreground line-through">Project Details</span>
            <span className="text-muted-foreground">→</span>
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              2
            </span>
            <span className="text-foreground font-semibold">Team Setup</span>
          </div>
        </div>
      </div>

      {/* Main Team Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section 1: Team Info */}
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" /> Team Details
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Specify the team title and mission for this project.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Core Engineering Squad"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Team Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Describe the responsibilities and focus areas of this team..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition resize-y"
            />
          </div>
        </div>

        {/* Section 2: Add Members */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" /> Add Members
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Search available employees and assign their development role.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-foreground border border-border w-fit">
              {selectedMembers.size} member{selectedMembers.size !== 1 ? "s" : ""} selected
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="🔍 Search by employee name, email or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition text-sm"
            />
          </div>

          {/* Employee Pick List */}
          <div className="border border-border rounded-xl divide-y divide-border/60 max-h-64 overflow-y-auto bg-muted/20">
            {loadingEmployees ? (
              <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> Loading available staff...
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No matching employees found.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = selectedMembers.has(emp.id);
                const currentSelection = selectedMembers.get(emp.id);
                const roleValue = currentSelection?.role || "front_end";

                return (
                  <div
                    key={emp.id}
                    className={`flex items-center justify-between p-3 sm:px-4 transition ${
                      isSelected ? "bg-purple-500/5 dark:bg-purple-950/20" : "hover:bg-muted/40"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleMember(emp, roleValue)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-border cursor-pointer"
                      />
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground flex-shrink-0">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{emp.email} • {emp.jobTitle}</p>
                      </div>
                    </label>

                    {/* Role Dropdown */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={roleValue}
                        onChange={(e) => {
                          const newRole = e.target.value as TeamMemberRole;
                          if (isSelected) {
                            handleRoleChange(emp.id, newRole);
                          } else {
                            handleToggleMember(emp, newRole);
                          }
                        }}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium cursor-pointer"
                      >
                        <option value="front_end">front_end</option>
                        <option value="back_end">back_end</option>
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Members Section */}
          {selectedMembers.size > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Selected Members ({selectedMembers.size})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Array.from(selectedMembers.values()).map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card shadow-xs gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          m.role === "front_end"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        {m.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                        title="Remove member"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(`/dashboard/projects/create`, {
                state: {
                  projectName: (location.state as any)?.projectName,
                  projectCode: (location.state as any)?.projectCode,
                  description: (location.state as any)?.description,
                  startDate: (location.state as any)?.startDate,
                  endDate: (location.state as any)?.endDate,
                  clientId: (location.state as any)?.clientId,
                },
              })
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Project
          </button>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/projects/${projectId}`)}
              className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground font-medium transition cursor-pointer"
            >
              Skip For Now
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-semibold shadow-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Team...
                </>
              ) : (
                <>
                  Create Team <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
export default CreateTeam;
