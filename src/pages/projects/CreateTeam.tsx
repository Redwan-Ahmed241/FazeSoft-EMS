import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  Users,
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { authApi } from "../../api/auth";
import { useSharedContext } from "../../context/SharedContext";
import type { TeamMemberRole } from "../../types/team";
import type { ProjectFormData } from "../../types/project";
import type { UserOut } from "../../types/auth";

interface MemberSelection {
  userId: string;
  name: string;
  email: string;
  jobTitle?: string;
  role: TeamMemberRole;
}

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
}

export function CreateTeam() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { employees } = useSharedContext();

  const existingProjectMode = !!projectId && !location.state?.projectData;
  const projectData = (location.state?.projectData ?? {}) as Partial<ProjectFormData>;

  const restoredTeamData = location.state?.teamData as
    | {
        teamName?: string;
        description?: string;
        members?: {
          userId: string;
          name: string;
          email: string;
          role: TeamMemberRole;
          jobTitle?: string;
        }[];
      }
    | null
    | undefined;

  const [teamName, setTeamName] = useState(restoredTeamData?.teamName ?? "");
  const [description, setDescription] = useState(restoredTeamData?.description ?? "");

  const [allEmployees, setAllEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Map<string, MemberSelection>>(
    () => {
      const map = new Map<string, MemberSelection>();
      restoredTeamData?.members?.forEach((m) => {
        map.set(m.userId, {
          userId: m.userId,
          name: m.name,
          email: m.email,
          jobTitle: m.jobTitle,
          role: m.role,
        });
      });
      return map;
    }
  );

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

      if (employees && employees.length > 0) {
        const mapped = employees.map((e) => ({
          id: String(e.id),
          name: e.name,
          email: e.email,
          jobTitle: e.jobTitle || "Staff Member",
        }));
        setAllEmployees(mapped);
      } else {
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

  const filteredEmployees = allEmployees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.jobTitle.toLowerCase().includes(q)
    );
  });

  const handleToggleMember = (emp: EmployeeOption, defaultRole: TeamMemberRole = "front_end") => {
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

  const handleRoleChange = (userId: string, newRole: TeamMemberRole) => {
    const next = new Map(selectedMembers);
    const existing = next.get(userId);
    if (existing) {
      next.set(userId, { ...existing, role: newRole });
      setSelectedMembers(next);
    }
  };

  const handleRemoveMember = (userId: string) => {
    const next = new Map(selectedMembers);
    next.delete(userId);
    setSelectedMembers(next);
  };

  const canContinue =
    teamName.trim().length > 0 &&
    description.trim().length > 0 &&
    selectedMembers.size > 0;

  const hasSelectedMembers = selectedMembers.size > 0;

  const handleSkipForNow = () => {
    if (existingProjectMode) {
      navigate(`/dashboard/projects/${projectId}`);
      return;
    }
    // Skip team assembly — proceed to review to create the project only.
    navigate(`/dashboard/projects/create/review`, {
      state: {
        projectData,
        teamData: null,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast.error("Please enter a Team Name");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a Team Description");
      return;
    }
    if (selectedMembers.size === 0) {
      toast.error("Please select at least one team member");
      return;
    }

    const teamData = {
      teamName: teamName.trim(),
      description: description.trim(),
      members: Array.from(selectedMembers.values()).map((m) => ({
        userId: m.userId,
        name: m.name,
        email: m.email,
        role: m.role,
      })),
    };

    if (existingProjectMode) {
      navigate(`/dashboard/projects/create/review`, {
        state: {
          projectId,
          projectData: null,
          existingProjectName: projectData.projectName || "Existing Project",
          teamData,
        },
      });
      return;
    }

    navigate(`/dashboard/projects/create/review`, {
      state: {
        projectData,
        teamData,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shadow-inner">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {existingProjectMode ? "Team Setup" : "Step 2 of 3"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Team Assembly
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-0.5">
                {existingProjectMode ? "Add Team to Project" : "Create Team & Assign Members"}
              </h1>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                Project:{" "}
                <span className="font-semibold text-foreground">
                  {existingProjectMode
                    ? projectData.projectName || "Existing Project"
                    : projectData.projectName || "New Project"}
                </span>
                {projectData.projectCode && (
                  <span className="ml-2 font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">
                    {projectData.projectCode}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center gap-2 text-sm font-medium bg-muted/60 px-4 py-2 rounded-xl border border-border/50">
            <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">✓</span>
            <span className="text-muted-foreground line-through">Project Details</span>
            <span className="text-muted-foreground">→</span>
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>
            <span className="text-foreground font-semibold">Team Setup</span>
            {!existingProjectMode && (
              <>
                <span className="text-muted-foreground">→</span>
                <span className="w-6 h-6 rounded-full bg-muted-foreground/20 text-muted-foreground text-xs flex items-center justify-center font-medium">3</span>
                <span className="text-muted-foreground">Review</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Team Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section 1: Team Info */}
        <div className="space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-lg font-semibold text-foreground">Team Details</h2>
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
              className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
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
              className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-y"
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
            onClick={() => {
              if (existingProjectMode) {
                navigate(`/dashboard/projects/${projectId}`);
              } else {
                navigate(`/dashboard/projects/create`, { state: { ...projectData } });
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> {existingProjectMode ? "Back to Project" : "Back to Project Details"}
          </button>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleSkipForNow}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground font-medium transition cursor-pointer"
            >
              Skip For Now
            </button>

            <button
              type="submit"
              disabled={!hasSelectedMembers}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {existingProjectMode ? "Assign & Review Team" : "Continue to Review"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
export default CreateTeam;
