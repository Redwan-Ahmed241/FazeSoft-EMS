import {
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  History as HistoryIcon,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSharedContext } from "../../context/SharedContext";
import { formatDate } from "../../utils/taskUtils";

export function History() {
  const { user } = useAuth();
  const { tasks, employees } = useSharedContext();

  const myEmail = user?.email?.toLowerCase() ?? "";
  const myEmployee = employees.find((e) => e.email?.toLowerCase() === myEmail);

  const jobTitle = myEmployee?.jobTitle || user?.job_title || "Employee";
  const department = myEmployee?.department || user?.department || "General";
  const joiningDate = myEmployee?.joining_date || user?.joining_date || "";
  const employeeId = myEmployee?.employee_id || user?.employee_id || "";
  const employmentStatus = myEmployee?.employment_status || user?.employment_status || "Active";
  const displayName = user?.name && !user.name.includes("@") ? user.name : user?.email?.split("@")[0] || "Employee";

  const myTasks = tasks.filter((t) => t.assigneeEmail.toLowerCase() === myEmail);
  const completedTasks = [...myTasks]
    .filter((t) => t.status === "completed")
    .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

  const totalDone = completedTasks.length;
  const totalTasks = myTasks.length;
  const completion = totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0;

  // Build a unified timeline: completed tasks (most recent first)
  const timeline = completedTasks.map((t) => ({
    date: t.completedAt || t.createdAt,
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-100",
    title: `Completed: ${t.title}`,
    sub: `Finished on ${formatDate(t.completedAt)}`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your employment record, completed tasks, and activity timeline.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employment overview */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2"><Briefcase className="h-4 w-4 text-primary" /></div>
              <h2 className="text-base font-bold text-foreground">Employment</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{displayName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Job Title</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{jobTitle}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Department</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{department}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Employee ID</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{employeeId || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Joining Date</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{formatDate(joiningDate)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                <span className="text-xs text-muted-foreground">Employment Status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                  <BadgeCheck className="h-3 w-3" /> {employmentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Career summary */}
          <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-purple-100 p-2"><Award className="h-4 w-4 text-purple-600" /></div>
              <h2 className="text-base font-bold text-foreground">Career Summary</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-bold text-foreground">{totalDone}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Tasks Completed</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Total Tasks</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-bold text-green-600">{completion}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Completion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Task history */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-100 p-2"><FileText className="h-4 w-4 text-green-600" /></div>
              <h2 className="text-base font-bold text-foreground">Completed Task History</h2>
            </div>
            <span className="text-xs text-muted-foreground">{completedTasks.length} completed</span>
          </div>

          {completedTasks.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No completed tasks yet</p>
              <p className="text-xs text-muted-foreground mt-1">Tasks you finish will show up here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedTasks.map((t) => (
                <div key={t.id} className="flex items-start gap-3 rounded-xl border border-border p-4 hover:bg-accent/40 transition-all">
                  <div className="mt-0.5 rounded-lg bg-green-100 p-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground">{t.title}</p>
                      <span className="text-[11px] text-muted-foreground">
                        Completed {formatDate(t.completedAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {t.department}</span>
                      <span className="inline-flex items-center gap-1">
                        {t.createdAt ? <CalendarDays className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        Assigned {formatDate(t.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="mb-5 flex items-center gap-2">
            <div className="rounded-lg bg-amber-100 p-2"><HistoryIcon className="h-4 w-4 text-amber-600" /></div>
            <h2 className="text-base font-bold text-foreground">Activity Timeline</h2>
          </div>
          <div className="space-y-4">
            {timeline.slice(0, 12).map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 rounded-full p-1 ${item.bg}`}>
                    <Icon className={`h-3 w-3 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
