import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  ListTodo,
  PlayCircle,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSharedContext, TaskStatus } from "../SharedContext";
import { Progress } from "../ui/progress";
import { toast } from "sonner@2.0.3";
import {
  PRIORITY_BADGE,
  STATUS_ORDER,
  dueColor,
  dueLabel,
  formatDate,
  isOverdue,
} from "./taskUtils";

const COLUMNS: Array<{ status: TaskStatus; title: string; icon: React.ElementType; accent: string; dot: string }> = [
  { status: "assigned", title: "Assigned", icon: ListTodo, accent: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  { status: "in_progress", title: "In Progress", icon: PlayCircle, accent: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { status: "completed", title: "Completed", icon: CheckCircle2, accent: "bg-green-100 text-green-700", dot: "bg-green-500" },
];

export function MyTasks() {
  const { user } = useAuth();
  const { tasks, updateTaskStatus } = useSharedContext();

  const myEmail = user?.email?.toLowerCase() ?? "";
  const myTasks = tasks.filter((t) => t.assigneeEmail.toLowerCase() === myEmail);

  const handleMove = (id: string, to: TaskStatus, label: string) => {
    updateTaskStatus(id, to);
    toast.success(label);
  };

  const orderValue: Record<TaskStatus, number> = { assigned: 0, in_progress: 1, completed: 2 };

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
            {myTasks.filter((t) => t.status === "completed").length}
          </span>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid gap-5 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const colTasks = myTasks
            .filter((t) => t.status === col.status)
            .sort((a, b) => {
              if (col.status === "completed") return (b.completedAt || "").localeCompare(a.completedAt || "");
              return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
            });

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
                    <div key={t.id} className="rounded-xl bg-card border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-foreground leading-snug">{t.title}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[t.priority]}`}>
                          {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{t.description}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className={`inline-flex items-center gap-1 ${dueColor(t)}`}>
                          <CalendarDays className="h-3 w-3" /> {dueLabel(t)}
                        </span>
                        {t.status === "completed" && t.completedAt && (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" /> {formatDate(t.completedAt)}
                          </span>
                        )}
                        {isOverdue(t) && (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-3 w-3" /> Overdue
                          </span>
                        )}
                      </div>

                      {t.status === "in_progress" && (
                        <div className="mt-3">
                          <Progress value={t.progress} className="h-1.5" />
                          <p className="mt-1 text-right text-[10px] text-muted-foreground">{t.progress}% complete</p>
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        {t.status === "assigned" && (
                          <button
                            onClick={() => handleMove(t.id, "in_progress", "Task started!")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                          >
                            <PlayCircle className="h-3.5 w-3.5" /> Start Task
                          </button>
                        )}
                        {t.status === "in_progress" && (
                          <>
                            <button
                              onClick={() => handleMove(t.id, "assigned", "Moved back to Assigned")}
                              className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Reassign
                            </button>
                            <button
                              onClick={() => handleMove(t.id, "completed", "Task completed! 🎉")}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                            </button>
                          </>
                        )}
                        {t.status === "completed" && (
                          <button
                            onClick={() => handleMove(t.id, "in_progress", "Task reopened")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reopen
                          </button>
                        )}
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
          <ListTodo className="h-3.5 w-3.5 text-amber-500" /> Assigned
          <ArrowRight className="h-3 w-3" />
          <PlayCircle className="h-3.5 w-3.5 text-blue-500" /> In Progress
          <ArrowRight className="h-3 w-3" />
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Completed
        </span>
        <span className="ml-auto">Only tasks assigned to you are shown here.</span>
      </div>
    </div>
  );
}
