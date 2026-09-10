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
  Pencil,
  ListTodo,
  Flag,
  User as LucideUser,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { projectApi } from "../../api/projects";
import { teamApi } from "../../api/teams";
import { clientsApi } from "../../api/clients";
import { taskApi } from "../../api/tasks";
import { useAuth } from "../../context/AuthContext";
import type { ProjectOut } from "../../types/project";
import type { TeamWithMembersOut } from "../../types/team";
import type { ClientOut } from "../../types/client";
import type { TaskOut, TaskPriority, TaskStatus } from "../../types/task";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/common/ui/dialog";

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentUser = user as (typeof user & { permissions?: string[] });
  const canAssignTask =
    currentUser?.permissions?.includes("assign_task") ||
    ["CTO", "HR", "HR_Manager", "Head_of_Operations", "Senior_Frontend", "Senior_Backend"].includes(currentUser?.role || "");
  const canUpdateTask =
    currentUser?.permissions?.includes("update_task") ||
    ["CTO", "HR", "HR_Manager", "Head_of_Operations", "Senior_Frontend", "Senior_Backend"].includes(currentUser?.role || "");

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectOut | null>(null);
  const [teams, setTeams] = useState<TeamWithMembersOut[]>([]);
  const [client, setClient] = useState<ClientOut | null>(null);

  // Task section state
  const [tasks, setTasks] = useState<TaskOut[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Assign task modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("Medium");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  // Edit task modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskOut | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("Medium");
  const [editStatus, setEditStatus] = useState<TaskStatus>("Todo");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

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
    loadTasks();
  }, [projectId]);

  async function loadTasks() {
    if (!projectId) return;
    try {
      setTasksLoading(true);
      const data = await taskApi.listByProject(projectId);
      setTasks(data || []);
    } catch (err: unknown) {
      console.error("Failed to load project tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  }

  // Unique team members across all teams assigned to this project
  const projectTeamMembers = Array.from(
    new Map(
      teams.flatMap((t) => t.members || []).map((m) => [m.user_id, m])
    ).values()
  );

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    if (!newAssignedTo) {
      toast.error("Please select a team member to assign this task to.");
      return;
    }
    try {
      setAssignSubmitting(true);
      await taskApi.create(projectId, {
        title: newTitle.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        assigned_to: newAssignedTo,
        deadline: newDeadline,
      });
      toast.success("Task assigned successfully!");
      setAssignModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewPriority("Medium");
      setNewAssignedTo("");
      setNewDeadline("");
      await loadTasks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to assign task.";
      toast.error(message);
    } finally {
      setAssignSubmitting(false);
    }
  }

  function openEditModal(t: TaskOut) {
    setEditingTask(t);
    setEditTitle(t.title);
    setEditDescription(t.description);
    setEditPriority(t.priority);
    setEditStatus(t.status);
    setEditAssignedTo(t.assigned_to);
    setEditDeadline(t.deadline);
    setEditModalOpen(true);
  }

  async function handleUpdateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !editingTask) return;
    try {
      setEditSubmitting(true);
      await taskApi.update(projectId, editingTask.task_id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        status: editStatus,
        assigned_to: editAssignedTo,
        deadline: editDeadline,
      });
      toast.success("Task updated successfully!");
      setEditModalOpen(false);
      await loadTasks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update task.";
      toast.error(message);
    } finally {
      setEditSubmitting(false);
    }
  }

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
            to={`/dashboard/projects/${projectId}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 transition shadow-xs cursor-pointer"
          >
            <Pencil className="w-4 h-4" /> Edit Project
          </Link>
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

      {/* Task Section */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" /> Project Tasks & Deliverables
            </h2>
            <p className="text-sm text-muted-foreground">
              Assign and track individual tasks for this project's team members.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-foreground border border-border">
              {tasks.length} Task(s)
            </span>
            {canAssignTask && (
              <button
                type="button"
                onClick={() => setAssignModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Assign Task
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeleton */}
        {tasksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="rounded-xl bg-card border border-border p-4 shadow-sm animate-pulse space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded-md w-1/3" />
                  <div className="h-4 bg-muted rounded-full w-16" />
                </div>
                <div className="h-3 bg-muted rounded-md w-3/4" />
                <div className="h-3 bg-muted rounded-md w-1/2" />
                <div className="pt-2 border-t border-border flex justify-between">
                  <div className="h-3 bg-muted rounded-md w-24" />
                  <div className="h-3 bg-muted rounded-md w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          /* Empty State */
          <div className="bg-card border border-border border-dashed rounded-2xl p-10 text-center space-y-3">
            <ListTodo className="w-10 h-10 text-muted-foreground mx-auto opacity-60" />
            <h3 className="text-base font-semibold text-foreground">No Tasks Assigned Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              There are no tasks created for this project. Use the button above to assign tasks to team members.
            </p>
            {canAssignTask && (
              <button
                type="button"
                onClick={() => setAssignModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Assign First Task
              </button>
            )}
          </div>
        ) : (
          /* Task Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <div
                key={task.task_id}
                className="rounded-xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        task.priority === "High"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                          : task.priority === "Medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        task.status === "Done"
                          ? "bg-green-100 text-green-700"
                          : task.status === "In Progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {task.status}
                    </span>
                    {canUpdateTask && (
                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        title="Edit Task"
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                  {task.description}
                </p>

                <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <LucideUser className="w-3.5 h-3.5 text-primary" />
                    <span>Assignee: #{task.assigned_to.slice(0, 8)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Due: {task.deadline}</span>
                  </div>

                  <div className="w-full text-[10px] text-muted-foreground/70 truncate">
                    Assigned by: #{task.assigned_by.slice(0, 8)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Plus className="w-5 h-5 text-primary" /> Assign New Task
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Assign a deliverable to a member of this project's teams.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Task Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Implement API Endpoints"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Detailed specifications, deliverables, and acceptance criteria..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Deadline <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Assign To Team Member <span className="text-destructive">*</span>
              </label>
              {projectTeamMembers.length === 0 ? (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400">
                  No team members found in this project. Please assign a team with members first.
                </div>
              ) : (
                <select
                  required
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Select Team Member --</option>
                  {projectTeamMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      Member #{m.user_id.slice(0, 8)} ({m.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <DialogFooter className="pt-3 gap-2">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-muted/60 text-foreground border border-border font-medium text-sm hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignSubmitting || projectTeamMembers.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {assignSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Assign Task
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Pencil className="w-5 h-5 text-primary" /> Edit Task
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update task details, status, or reassign within project squads.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateTask} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Task Title
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Description
              </label>
              <textarea
                required
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Priority
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Deadline
                </label>
                <input
                  type="date"
                  required
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Assigned Member
                </label>
                <select
                  required
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  {projectTeamMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      Member #{m.user_id.slice(0, 8)} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-muted/60 text-foreground border border-border font-medium text-sm hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {editSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default ProjectDetail;
