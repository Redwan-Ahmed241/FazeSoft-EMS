import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  ListTodo,
  PlayCircle,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { projectApi } from "../../api/projects";
import { taskApi } from "../../api/tasks";
import { submissionApi } from "../../api/submissions";
import type { TaskOut, TaskStatus } from "../../types/task";
import { toast } from "sonner@2.0.3";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/common/ui/dialog";

const COLUMNS: Array<{
  status: TaskStatus;
  title: string;
  icon: React.ElementType;
  accent: string;
  dot: string;
}> = [
  {
    status: "Todo",
    title: "To Do",
    icon: ListTodo,
    accent: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
  },
  {
    status: "In Progress",
    title: "In Progress",
    icon: PlayCircle,
    accent: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  {
    status: "Done",
    title: "Done",
    icon: CheckCircle2,
    accent: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
];

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
    case "Medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
    case "Low":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
};

const isTaskOverdue = (deadline: string, status: TaskStatus) => {
  if (status === "Done") return false;
  if (!deadline) return false;
  const today = new Date().toISOString().split("T")[0];
  return deadline < today;
};

export function MyTasks() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<TaskOut[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit work modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState<TaskOut | null>(null);
  const [commitLink, setCommitLink] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openSubmitModal = (task: TaskOut) => {
    setSubmittingTask(task);
    setCommitLink("");
    setNotes("");
    setSubmitModalOpen(true);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask) return;

    try {
      setIsSubmitting(true);
      await submissionApi.create(submittingTask.task_id, {
        commit_link: commitLink.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Work submitted successfully");
      setSubmitModalOpen(false);
      setCommitLink("");
      setNotes("");
      setSubmittingTask(null);
    } catch (err: unknown) {
      console.error("Failed to submit work:", err);
      const message =
        err instanceof Error ? err.message : "Failed to submit work";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchUserTasks() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch all projects
        const projects = await projectApi.list();

        // 2. Fetch tasks for each project
        const taskLists = await Promise.all(
          (projects || []).map((p) =>
            taskApi.listByProject(p.project_id).catch(() => [])
          )
        );

        // 3. Flatten and filter where task.assigned_to === user.id
        const allTasks = taskLists.flat();
        const userTasks = allTasks.filter(
          (t) => t.assigned_to?.toLowerCase() === user.id?.toLowerCase()
        );
        setMyTasks(userTasks);
      } catch (err: unknown) {
        console.error("Failed to load employee tasks:", err);
        toast.error("Failed to load your tasks from server.");
      } finally {
        setLoading(false);
      }
    }

    fetchUserTasks();
  }, [user?.id]);

  const handleMove = async (
    projectId: string,
    taskId: string,
    to: TaskStatus,
    label: string
  ) => {
    const previousTasks = [...myTasks];
    // Optimistic update
    setMyTasks((prev) =>
      prev.map((t) => (t.task_id === taskId ? { ...t, status: to } : t))
    );

    try {
      await taskApi.update(projectId, taskId, { status: to });
      toast.success(label);
    } catch (err: unknown) {
      // Revert on error
      setMyTasks(previousTasks);
      const message =
        err instanceof Error ? err.message : "Failed to update task status";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading your assigned tasks...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track what's assigned to you, what you're working on, and what you've finished.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-2.5 shadow-sm">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">{myTasks.length}</span>
          <span className="mx-1 h-4 w-px bg-border" />
          <span className="text-xs text-muted-foreground">Done</span>
          <span className="text-xl font-bold text-green-600">
            {myTasks.filter((t) => t.status === "Done").length}
          </span>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid gap-5 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const colTasks = myTasks
            .filter((t) => t.status === col.status)
            .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));

          return (
            <div key={col.status} className="rounded-2xl bg-muted/40 border border-border p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg p-1.5 ${col.accent}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-bold text-foreground">{col.title}</h2>
                  <span className="rounded-full bg-card border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              </div>

              <div className="space-y-3">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card/50 py-8 text-center">
                    <Circle className="h-6 w-6 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Nothing here</p>
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.task_id}
                      className="rounded-xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-foreground leading-snug">
                          {t.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadgeClass(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isTaskOverdue(t.deadline, t.status)
                              ? "text-red-600 font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          <CalendarDays className="h-3 w-3" /> Due {t.deadline}
                        </span>
                        {t.status === "Done" && (
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        )}
                        {isTaskOverdue(t.deadline, t.status) && (
                          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        {col.status === "Todo" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMove(
                                t.project_id,
                                t.task_id,
                                "In Progress",
                                "Task started!"
                              )
                            }
                            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                          >
                            <PlayCircle className="h-3.5 w-3.5" /> Start Task
                          </button>
                        )}

                        {col.status === "In Progress" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleMove(
                                  t.project_id,
                                  t.task_id,
                                  "Todo",
                                  "Moved back to To Do"
                                )
                              }
                              className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> To Do
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleMove(
                                  t.project_id,
                                  t.task_id,
                                  "Done",
                                  "Task completed! 🎉"
                                )
                              }
                              style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                            </button>
                          </>
                        )}

                        {col.status === "Done" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleMove(
                                t.project_id,
                                t.task_id,
                                "In Progress",
                                "Task reopened"
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reopen
                          </button>
                        )}
                      </div>

                      {/* Submit Work button */}
                      <div className="mt-2.5 pt-2 border-t border-border/60 flex justify-end">
                        <button
                          type="button"
                          onClick={() => openSubmitModal(t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 text-foreground border border-border font-medium text-xs hover:bg-muted transition cursor-pointer"
                        >
                          <Send className="w-3 h-3 text-primary" /> Submit Work
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card border border-border px-5 py-3 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Status flow:</span>
        <span className="flex items-center gap-1.5">
          <ListTodo className="h-3.5 w-3.5 text-amber-500" /> To Do
          <ArrowRight className="h-3 w-3" />
          <PlayCircle className="h-3.5 w-3.5 text-blue-500" /> In Progress
          <ArrowRight className="h-3 w-3" />
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Done
        </span>
        <span className="ml-auto">Only tasks assigned to you are shown here.</span>
      </div>

      {/* Submit Work Dialog */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Send className="w-5 h-5 text-primary" /> Submit Work
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {submittingTask?.title
                ? `Submit completed work or progress for "${submittingTask.title}".`
                : "Submit completed work or progress for this task."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitWork} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Commit / PR Link <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="https://github.com/..."
                value={commitLink}
                onChange={(e) => setCommitLink(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Notes / Deliverables <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Add any notes, description of work completed, or instructions for review..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-muted/60 text-foreground border border-border font-medium text-sm hover:bg-muted transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Work
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

export default MyTasks;
