import {
  Building2,
  CheckCircle2,
  ListTodo,
  Lock,
  PlayCircle,
  ShieldCheck,
  Users,
  Award,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSharedContext } from "../../context/SharedContext";
import InitialsAvatar from "../../components/common/ui/InitialsAvatar";
import { Progress } from "../../components/common/ui/progress";

export function TeamProgress() {
  const { user } = useAuth();
  const { tasks, employees } = useSharedContext();

  const myEmail = user?.email?.toLowerCase() ?? "";
  const myEmployee = employees.find((e) => e.email?.toLowerCase() === myEmail);
  const department = myEmployee?.department || user?.department || "General";

  // Privacy rule: only teammates in the SAME department are visible.
  const teammates = employees.filter(
    (e) => e.email && (e.department || "").toLowerCase() === department.toLowerCase()
  );

  const members = teammates.map((tm) => {
    const email = tm.email.toLowerCase();
    const personTasks = tasks.filter((t) => t.assigneeEmail.toLowerCase() === email);
    const assigned = personTasks.filter((t) => t.status === "assigned").length;
    const inProgress = personTasks.filter((t) => t.status === "in_progress").length;
    const completed = personTasks.filter((t) => t.status === "completed").length;
    const progress = personTasks.length
      ? Math.round((completed / personTasks.length) * 100)
      : 0;
    return { member: tm, assigned, inProgress, completed, progress, total: personTasks.length };
  });

  const teamProgress = members.length
    ? Math.round(members.reduce((sum, m) => sum + m.progress, 0) / members.length)
    : 0;
  const teamCompleted = members.reduce((sum, m) => sum + m.completed, 0);
  const teamTotal = members.reduce((sum, m) => sum + m.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">
            See how your teammates are doing — {department} only.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
          <Building2 className="h-3.5 w-3.5" /> {department}
        </span>
      </div>

      {/* Privacy banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
        <p>
          <span className="font-semibold">Privacy note:</span> you can only see progress for your own
          team (<span className="font-semibold">{department}</span>). Other teams' progress is never
          shown to you.
        </p>
      </div>

      {/* Team summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-purple-100 p-2"><Users className="h-4 w-4 text-purple-600" /></div>
            <p className="text-sm text-muted-foreground">Team Members</p>
          </div>
          <h3 className="text-3xl font-bold text-foreground">{members.length}</h3>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-green-100 p-2"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
            <p className="text-sm text-muted-foreground">Completed Tasks</p>
          </div>
          <h3 className="text-3xl font-bold text-foreground">
            {teamCompleted}<span className="text-base font-semibold text-muted-foreground"> / {teamTotal}</span>
          </h3>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-amber-100 p-2"><Award className="h-4 w-4 text-amber-600" /></div>
            <p className="text-sm text-muted-foreground">Team Completion</p>
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-bold text-foreground">{teamProgress}%</h3>
            <div className="flex-1"><Progress value={teamProgress} className="h-2" /></div>
          </div>
        </div>
      </div>

      {/* Member list */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Teammates</h2>
          <span className="text-xs text-muted-foreground">sorted by completion</span>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No teammates found in {department}</p>
            <p className="text-xs text-muted-foreground mt-1">You'll see your team here once members join.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {members
              .sort((a, b) => b.progress - a.progress || b.completed - a.completed)
              .map(({ member, assigned, inProgress, completed, progress, total }) => {
                const isMe = member.email?.toLowerCase() === myEmail;
                return (
                  <div key={String(member.id)} className="rounded-xl border border-border p-4 hover:bg-accent/40 transition-all">
                    <div className="flex flex-wrap items-center gap-3">
                      <InitialsAvatar name={member.name} src={member.avatar} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground truncate">{member.name}</p>
                          {isMe && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">You</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.jobTitle}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm font-bold text-amber-600">{assigned}</p>
                          <p className="text-[10px] text-muted-foreground">Assigned</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-blue-600">{inProgress}</p>
                          <p className="text-[10px] text-muted-foreground">Doing</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-green-600">{completed}</p>
                          <p className="text-[10px] text-muted-foreground">Done</p>
                        </div>
                        <div className="hidden sm:block w-32">
                          <Progress value={progress} className="h-2" />
                          <p className="mt-1 text-right text-[10px] font-semibold text-foreground">{progress}%</p>
                        </div>
                      </div>
                    </div>
                    {/* Mobile progress */}
                    <div className="mt-3 sm:hidden">
                      <Progress value={progress} className="h-2" />
                      <p className="mt-1 text-right text-[10px] font-semibold text-foreground">{progress}% · {total} tasks</p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Task breakdown legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card border border-border px-5 py-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><ListTodo className="h-3.5 w-3.5 text-amber-500" /> Assigned</span>
        <span className="flex items-center gap-1.5"><PlayCircle className="h-3.5 w-3.5 text-blue-500" /> In Progress</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Completed</span>
        <span className="ml-auto flex items-center gap-1.5">
          <Lock className="h-3 w-3" /> Other teams are hidden
        </span>
      </div>
    </div>
  );
}
