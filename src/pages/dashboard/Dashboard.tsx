import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import InitialsAvatar from "../../components/common/ui/InitialsAvatar";
import {
  TrendingUp, TrendingDown, Users, Eye, UserPlus, UserMinus,
  UserCheck, Video, RefreshCw, SlidersHorizontal,
  Briefcase, Calendar, CheckCircle, Clock,
  Award, AlertCircle, BarChart2, Trash2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../../context/AuthContext";
import { useSharedContext } from "../../context/SharedContext";
import { EmployeeDashboard } from "../employees/EmployeeDashboard";

// ─── Static HR Data ────────────────────────────────────────────────────────────

// Dynamic stats logic will be inside the component
// to access useSharedContext()

// ─── HR Dashboard ──────────────────────────────────────────────────────────────

function HRDashboard() {
  const navigate = useNavigate();
  const { candidates, interviews, employees, removeInterview } = useSharedContext();
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Compute Next Interview
  const now = new Date();
  const upcomingInterviews = interviews
    .map(i => ({ ...i, dateObj: new Date(`${i.date}T${i.time.replace(/ AM| PM/, ':00')}`) })) // naive parse for demo
    .filter(i => i.date >= now.toISOString().split("T")[0])
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  const nextInterview = upcomingInterviews.length > 0 ? upcomingInterviews[0] : null;

  useEffect(() => {
    // Basic countdown to next interview, just visual demo
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else if (minutes > 0) { minutes--; seconds = 59; }
        else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Stats Data dynamically
  const statsData = [
    { title: "Total Employees", value: employees.length.toString(), subtitle: "Employees", change: 5.0, trend: "up", icon: Users },
    { title: "Scheduled Interviews", value: interviews.length.toString(), subtitle: "Interviews", change: 12.0, trend: "up", icon: Calendar },
    { title: "Job Applied", value: candidates.length.toString(), subtitle: "Applicants", change: 8.0, trend: "up", icon: UserPlus },
    { title: "Resigned Employees", value: employees.filter(e => e.status === "Resigned").length.toString(), subtitle: "Employee", change: 0, trend: "down", icon: UserMinus },
  ];

  // Compute basic chart data by interview month (demo logic)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const interviewCounts = Array(12).fill(0);
  interviews.forEach(i => {
    const m = new Date(i.date).getMonth();
    if (!isNaN(m)) interviewCounts[m]++;
  });
  const chartData = monthNames.map((m, idx) => ({ month: m, value: interviewCounts[idx] })).slice(0, 8); // Showing first 8 for demo

  const formatTime = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
          Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-2xl bg-card p-6 shadow-sm border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1">
                {stat.trend === "up"
                  ? <TrendingUp className="h-4 w-4 text-green-500" />
                  : <TrendingDown className="h-4 w-4 text-red-500" />}
                <span className={`text-sm font-semibold ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {stat.trend === "up" ? "+" : ""}{stat.change}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart + Reminder */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Job Statistics</h2>
            <select className="rounded-lg border border-input bg-input-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barSize={40}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} ticks={[0, 2, 4, 6, 8, 10]} />
              <Bar dataKey="value" radius={[20, 20, 20, 20]}>
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.month === "Aug" ? "#6B5CE7" : entry.value === 0 ? "#E5E7EB" : "#6B5CE7"} fillOpacity={entry.month === "Aug" ? 1 : entry.value === 0 ? 0.3 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {chartData[chartData.length - 1] && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <div className="rounded-lg bg-primary px-3 py-1 text-sm font-semibold text-white">
                {chartData[chartData.length - 1].value}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Reminders</h2>
          {nextInterview ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-primary">Interview: {nextInterview.candidate}</h3>
              <p className="text-sm text-muted-foreground">Date: {nextInterview.date} at {nextInterview.time}</p>
              <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 py-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {formatTime(timeRemaining.hours)}:{formatTime(timeRemaining.minutes)}:{formatTime(timeRemaining.seconds)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Time Remaining</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button 
                  onClick={() => window.open(nextInterview.meetingLink, "_blank")}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all">
                  <Video className="h-4 w-4" /> Start Meeting
                </button>
                <button 
                  onClick={() => navigate('/dashboard/calendar')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-primary py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-all">
                  <RefreshCw className="h-4 w-4" /> Reschedule
                </button>
              </div>
              <button 
                onClick={() => {
                  removeInterview(nextInterview.id);
                  toast.success("Interview cancelled successfully");
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-red-500 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-all">
                <Trash2 className="h-4 w-4" /> Cancel Interview
              </button>
            </div>
          ) : (
            <div className="text-center py-10">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No upcoming interviews</p>
            </div>
          )}
        </div>
      </div>

      {/* Employee Status + Project Progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl bg-card p-6 shadow-sm border border-border">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Employee Status</h2>
            <button className="flex items-center gap-2 rounded-lg border border-input bg-input-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-all">
              <SlidersHorizontal className="h-4 w-4" /> Filter &amp; Sort
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted-foreground">Employee Name</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted-foreground">Email</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted-foreground">Job Title</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 5).map((emp) => (
                  <tr key={emp.id} className="border-b border-border last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={emp.name} src={emp.avatar} size="sm" />
                        <span className="text-sm font-medium text-foreground">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">{emp.email}</td>
                    <td className="py-4 text-sm text-foreground">{emp.jobTitle}</td>
                    <td className="py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${emp.statusColor}`}>{emp.status}</span>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No employees found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
          <h2 className="text-sm font-semibold text-muted-foreground mb-6">Project Progress</h2>
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-52 w-52">
              <svg className="h-full w-full" style={{ transform: "rotate(-90deg)" }}>
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9D8FF0" />
                    <stop offset="50%" stopColor="#7B5FED" />
                    <stop offset="100%" stopColor="#5932EA" />
                  </linearGradient>
                </defs>
                <circle cx="104" cy="104" r="85" stroke="#F3F4F6" strokeWidth="18" fill="none" />
                <circle cx="104" cy="104" r="85" stroke="url(#progressGradient)" strokeWidth="18" fill="none"
                  strokeDasharray={534.07} strokeDashoffset={534.07 * (1 - 0.41)} strokeLinecap="round"
                  style={{ filter: "drop-shadow(0px 4px 12px rgba(89,50,234,0.4))", transition: "stroke-dashoffset 1s ease-in-out" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-primary">41%</div>
                <div className="text-xs text-muted-foreground mt-2">Project Ended</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Candidate Dashboard ───────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  Applied:   "bg-blue-100 text-blue-700",
  Screened:  "bg-purple-100 text-purple-700",
  Interview: "bg-amber-100 text-amber-700",
  Offer:     "bg-teal-100 text-teal-700",
  Hired:     "bg-green-100 text-green-700",
  Approved:  "bg-green-100 text-green-700",
  Rejected:  "bg-red-100 text-red-700",
};

const pipelineSteps = ["Applied", "Screened", "Interview", "Offer", "Hired"];

function computeProfileCompletion(user: { name?: string; phone?: string; location?: string; job_title?: string; bio?: string; avatar?: string } | null, candidateSkills: string[], candidateEdu: any[]) {
  if (!user) return 0;
  const checks = [
    !!user.name,
    !!user.phone,
    !!user.location,
    !!user.job_title,
    !!user.bio,
    candidateSkills.length > 0,
    candidateEdu.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function CandidateDashboard() {
  const { user } = useAuth();
  const { candidates, interviews } = useSharedContext();

  const myCandidate = candidates.find((c) => c.email?.toLowerCase() === user?.email?.toLowerCase()) || null;
  const myInterviews = interviews.filter((i) => i.candidateEmail?.toLowerCase() === user?.email?.toLowerCase());
  const upcomingInterviews = myInterviews.filter((i) => i.date >= new Date().toISOString().split("T")[0]).slice(0, 3);

  const profileCompletion = computeProfileCompletion(
    user ?? null,
    myCandidate?.skills ?? [],
    myCandidate?.education ?? [],
  );

  const currentStepIndex = myCandidate
    ? pipelineSteps.indexOf(myCandidate.status as string)
    : -1;

  // Derive a friendly display name (avoid showing raw email as name)
  const rawName = user?.name || "";
  const isEmailAsName = rawName.includes("@");
  const displayFirstName = isEmailAsName
    ? "Candidate"
    : rawName.split(" ")[0] || "Candidate";

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {displayFirstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's an overview of your application status and upcoming schedule.
          </p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Application Status */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg bg-primary/10 p-2"><Briefcase className="h-4 w-4 text-primary" /></div>
            <h3 className="text-sm font-bold text-foreground">Application Status</h3>
          </div>
          {myCandidate ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-base font-bold text-foreground">{myCandidate.position}</p>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold mt-1 ${statusColors[myCandidate.status] || "bg-gray-100 text-gray-700"}`}>
                    {myCandidate.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">AI Match Score</p>
                  <p className="text-2xl font-bold text-primary">{myCandidate.aiScore}%</p>
                </div>
              </div>
              {/* Pipeline progress */}
              <div className="flex items-center gap-1 mt-4">
                {pipelineSteps.map((step, idx) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`h-2 flex-1 rounded-full transition-all ${idx <= currentStepIndex ? "bg-primary" : "bg-muted"}`} />
                    {idx < pipelineSteps.length - 1 && <div className="w-1" />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {pipelineSteps.map((step, idx) => (
                  <span key={step} className={`text-[9px] font-medium ${idx <= currentStepIndex ? "text-primary" : "text-muted-foreground"}`}>
                    {step}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No application found</p>
              <p className="text-xs text-muted-foreground mt-1">Upload your resume to apply</p>
            </div>
          )}
        </div>

        {/* Profile Completion */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg bg-green-100 p-2"><UserCheck className="h-4 w-4 text-green-600" /></div>
            <h3 className="text-sm font-bold text-foreground">Profile</h3>
          </div>
          <div className="relative mx-auto" style={{ width: 112, height: 112 }}>
            <svg width="112" height="112" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="45" stroke="#F3F4F6" strokeWidth="10" fill="none" />
              <circle
                cx="56" cy="56" r="45"
                stroke={profileCompletion >= 80 ? "#22c55e" : profileCompletion >= 50 ? "#f59e0b" : "#6B5CE7"}
                strokeWidth="10" fill="none" strokeLinecap="round"
                strokeDasharray={282.74}
                strokeDashoffset={282.74 * (1 - profileCompletion / 100)}
                transform="rotate(-90 56 56)"
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{profileCompletion}%</span>
              <span className="text-[10px] text-muted-foreground">Complete</span>
            </div>
          </div>
          {profileCompletion < 100 && (
            <Link
              to="/dashboard/profile"
              className="block text-xs text-amber-600 font-medium text-center mt-3 hover:text-amber-700 hover:underline transition-colors"
            >
              Complete profile to stand out! →
            </Link>
          )}
        </div>

        {/* Upcoming interviews count */}
        <div className="rounded-2xl bg-card p-5 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-lg bg-purple-100 p-2"><Calendar className="h-4 w-4 text-purple-600" /></div>
            <h3 className="text-sm font-bold text-foreground">Interviews</h3>
          </div>
          <p className="text-4xl font-bold text-primary">{upcomingInterviews.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Upcoming scheduled</p>
          {myInterviews.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {upcomingInterviews.slice(0, 2).map((iv) => (
                <div key={iv.id} className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-foreground font-medium truncate">{iv.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Interviews (full width) */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Upcoming Interviews</h2>
          <span className="text-xs font-medium text-primary">{upcomingInterviews.length} scheduled</span>
        </div>
        {upcomingInterviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No upcoming interviews</p>
            <p className="text-xs text-muted-foreground mt-1">We'll notify you when an interview is scheduled.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingInterviews.map((iv) => (
              <div key={iv.id} className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-accent/50 transition-all">
                <InitialsAvatar name={iv.interviewer} src={iv.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{iv.position}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{iv.interviewer}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(iv.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {iv.time}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                  {iv.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills + Certifications */}
      {myCandidate && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Skills */}
          <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-primary/10 p-2"><BarChart2 className="h-4 w-4 text-primary" /></div>
              <h2 className="text-base font-bold text-foreground">My Skills</h2>
            </div>
            {myCandidate.skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills listed yet. Upload your resume to populate.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {myCandidate.skills.map((skill, idx) => (
                  <span key={idx} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{skill}</span>
                ))}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="rounded-2xl bg-card p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-amber-100 p-2"><Award className="h-4 w-4 text-amber-600" /></div>
              <h2 className="text-base font-bold text-foreground">Certifications</h2>
            </div>
            {(myCandidate.certifications ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No certifications listed yet.</p>
            ) : (
              <div className="space-y-2">
                {(myCandidate.certifications ?? []).map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-foreground">{cert}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root Export ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuth();
  if (["CTO", "Head_of_Operations", "HR", "HR_Manager"].includes(user?.role || "")) return <HRDashboard />;
  if (user?.role === "Candidate") return <CandidateDashboard />;
  return <EmployeeDashboard />;
}