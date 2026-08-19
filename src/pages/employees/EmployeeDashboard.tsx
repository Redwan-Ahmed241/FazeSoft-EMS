import { Link } from "react-router";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  PlayCircle,
  Users,
  AlertTriangle,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSharedContext } from "../SharedContext";
import InitialsAvatar from "../ui/InitialsAvatar";
import { Progress } from "../ui/progress";
import {
  PRIORITY_BADGE,
  dueColor,
  dueLabel,
  formatDate,
  greeting,
  isOverdue,
} from "./taskUtils";

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { tasks, employees } = useSharedContext();

  const myEmail = user?.email?.toLowerCase() ?? "";
  const myEmployee = employees.find((e) => e.email?.toLowerCase() === myEmail);
  const department = myEmployee?.department || user?.department || "General";
  const jobTitle = myEmployee?.jobTitle || user?.job_title || "Employee";
  const displayName =
    user?.name && !user.name.includes("@")
      ? user.name.split(" ")[0]
      : user?.email?.split("@")[0] || "Employee";

  const myTasks = tasks.filter((t) => t.assigneeEmail.toLowerCase() === myEmail);
  const assigned = myTasks.filter((t) => t.status === "assigned");
  const inProgress = myTasks.filter((t) => t.status === "in_progress");
  const completed = myTasks.filter((t) => t.status === "completed");
  const overdue = myTasks.filter(isOverdue);

  // Team mates = same department only (privacy: other teams are never shown)
  const teammates = employees.filter(
    (e) => e.email && (e.department || "").toLowerCase() === department.toLowerCase()
  );

  const nextUp = [...assigned, ...inProgress]
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
    .slice(0, 4);

  const recentDone = [...completed]
    .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""))
    .slice(0, 4);

  const overallProgress = myTasks.length
    ? Math.round((completed.length / myTasks.length) * 100)
    : 0;

  const stats = [
    { label: "Assigned", value: assigned.length, icon: ListTodo, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "In Progress", value: inProgress.length, icon: PlayCircle, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { label: "Overdue", value: overdue.length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary to-indigo-600 p-6 text-primary-foreground shadow-lg shadow-primary/25">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {greeting()}, {displayName} 👋
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Here's what's happening in {department} today.
            </p>
          </div>
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.12)", backdropFilter: "blur(8px)" }}
          >
            <div className="rounded-xl p-2" style={{ backgroundColor: "rgba(0,0,0,0.1)" }}>
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide font-medium text-white/80">Job Title</p>
              <p className="text-sm font-bold text-white">{jobTitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl bg-card p-5 shadow-sm border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                  <h3 className="text-3xl font-bold text-foreground">{s.value}</h3>
                </div>
                <div className={`rounded-lg p-2 ${s.bg}`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next up + overall progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* My tasks preview */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2"><ListTodo className="h-4 w-4 text-primary" /></div>
              <h2 className="text-base font-bold text-foreground">Up Next</h2>
            </div>
            <Link
              to="/dashboard/tasks"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all tasks <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {nextUp.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500/60 mb-3" />
              <p className="text-sm font-semibold text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">You have no pending tasks right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nextUp.map((t) => (
                <div key={t.id} className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-accent/50 transition-all">
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.status === "in_progress" ? "bg-blue-500 animate-pulse" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{t.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className={`inline-flex items-center gap-1 ${dueColor(t)}`}>
                        <CalendarDays className="h-3 w-3" /> {dueLabel(t)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_BADGE[t.priority]}`}>
                        {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)} priority
                      </span>
                    </div>
                  </div>
                  {t.status === "in_progress" && (
                    <div className="hidden sm:block w-28">
                      <Progress value={t.progress} className="h-1.5" />
                      <p className="mt-1 text-right text-[10px] text-muted-foreground">{t.progress}%</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Overall progress ring-ish */}
          <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg bg-green-100 p-2"><TrendingIcon /></div>
              <h3 className="text-sm font-bold text-foreground">My Completion</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative" style={{ width: 84, height: 84 }}>
                <svg width="84" height="84" viewBox="0 0 84 84">
                  <circle cx="42" cy="42" r="34" stroke="#F3F4F6" strokeWidth="9" fill="none" />
                  <circle
                    cx="42" cy="42" r="34"
                    stroke={overallProgress >= 80 ? "#22c55e" : overallProgress >= 50 ? "#f59e0b" : "#6B5CE7"}
                    strokeWidth="9" fill="none" strokeLinecap="round"
                    strokeDasharray={213.6}
                    strokeDashoffset={213.6 * (1 - overallProgress / 100)}
                    transform="rotate(-90 42 42)"
                    style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">{overallProgress}%</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><span className="font-semibold text-foreground">{completed.length}</span> of {myTasks.length} tasks done</p>
                <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {overdue.length} overdue</p>
              </div>
            </div>
          </div>

          {/* Team snapshot */}
          <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-purple-100 p-2"><Users className="h-4 w-4 text-purple-600" /></div>
                <h3 className="text-sm font-bold text-foreground">My Team</h3>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                <Building2 className="h-3 w-3" /> {department}
              </span>
            </div>
            <div className="space-y-2.5">
              {teammates.slice(0, 5).map((tm) => (
                <div key={String(tm.id)} className="flex items-center gap-3">
                  <InitialsAvatar name={tm.name} src={tm.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{tm.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{tm.jobTitle}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {tasks.filter((t) => t.assigneeEmail.toLowerCase() === tm.email?.toLowerCase() && t.status === "completed").length} done
                  </span>
                </div>
              ))}
            </div>
            <Link
              to="/dashboard/team"
              className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-border py-2 text-xs font-semibold text-primary hover:bg-primary/5 transition-all"
            >
              Team progress <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent completed */}
      {recentDone.length > 0 && (
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-100 p-2"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
              <h2 className="text-base font-bold text-foreground">Recently Completed</h2>
            </div>
            <Link to="/dashboard/history" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Full history <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentDone.map((t) => (
              <div key={t.id} className="rounded-xl border border-border p-4 hover:bg-accent/50 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="h-3.5 w-3.5 text-green-500 fill-green-500/20" />
                  <span className="text-[10px] text-muted-foreground">{formatDate(t.completedAt)}</span>
                </div>
                <p className="text-sm font-semibold text-foreground line-clamp-2">{t.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrendingIcon() {
  return <CheckCircle2 className="h-4 w-4 text-green-600" />;
}
