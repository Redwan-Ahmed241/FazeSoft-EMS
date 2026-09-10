import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { candidateApi } from "../api/candidates";
import { getToken } from "../api/client";
import type { CandidateOut as CandidateApiData } from "../types/candidate";
import { authApi } from "../api/auth";
import { useAuth } from "./AuthContext";

export interface CandidateData {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  aiScore: number;
  experience: string;
  skills: string[];
  education?: any[];
  certifications?: string[];
  status: "Applied" | "Screened" | "Interview" | "Offer" | "Hired" | "Approved" | "Rejected";
  avatar: string;
  appliedDate: string;
  matchReasons?: string[];
}

export interface InterviewData {
  id: number;
  candidate: string;
  candidateEmail: string;
  position: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  interviewer: string;
  meetingLink: string;
  avatar: string;
}

export interface NotificationData {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "interview" | "application";
  isRead: boolean;
  createdAt: string;
}

export interface EmployeeData {
  id: string | number;
  name: string;
  email: string;
  jobTitle: string;
  role: string;
  status: string;
  statusColor: string;
  securityStatus: string;
  avatar: string;
  department?: string;
  employee_id?: string;
  joining_date?: string;
  employment_status?: string;
}

// ── Employee portal: tasks ───────────────────────────────────
export type TaskStatus = "assigned" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskData {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;        // YYYY-MM-DD
  assigneeEmail: string;
  assigneeName: string;
  department: string;     // team the task belongs to (same as assignee's team)
  createdBy: string;
  createdAt: string;      // YYYY-MM-DD
  completedAt: string | null; // YYYY-MM-DD when completed
  progress: number;       // 0-100
}

export interface JobPost {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  applicants: number;
  views: number;
  status: string;
  postedDate: string;
  salary: string;
  platforms: string[];
  description?: string;
  requirements?: string;
}

// ─────────────────────────────────────────────────────────────
//  Map API response (snake_case) → frontend shape (camelCase)
// ─────────────────────────────────────────────────────────────

function mapApiCandidate(c: any): CandidateData {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? "",
    position: c.position,
    aiScore: c.ai_score ?? 0,
    experience: c.experience ?? "",
    skills: c.skills ?? [],
    education: c.education ?? [],
    certifications: c.certifications ?? [],
    status: c.status,
    avatar: c.avatar ?? "",
    appliedDate: c.applied_date,
    matchReasons: c.match_reasons ?? [],
  };
}

function mapApiInterview(i: any): InterviewData {
  return {
    id: i.id,
    candidate: i.candidate_name,
    candidateEmail: i.candidate_email,
    position: i.position,
    date: i.date,
    time: i.time,
    duration: i.duration,
    type: i.type,
    interviewer: i.interviewer,
    meetingLink: i.meeting_link ?? "",
    avatar: i.avatar ?? "",
  };
}

function mapApiJob(j: any): JobPost {
  return {
    id: j.id,
    title: j.title,
    department: j.department ?? "",
    location: j.location ?? "Remote",
    type: j.employment_type ?? j.type ?? "Full-time",
    applicants: j.applicants ?? 0,
    views: j.views ?? 0,
    status: j.status ?? "Active",
    postedDate: j.created_at ? new Date(j.created_at).toISOString().split("T")[0] : (j.posted_date ?? j.postedDate ?? new Date().toISOString().split("T")[0]),
    salary: j.salary_range ?? j.salary ?? "Competitive",
    platforms: j.platforms ?? [],
    description: j.description ?? "",
    requirements: j.requirements ?? "",
  };
}

function mapApiNotification(n: any): NotificationData {
  return {
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type ?? "info",
    isRead: n.is_read ?? false,
    createdAt: n.created_at ?? new Date().toISOString(),
  };
}

interface SharedContextType {
  candidates: CandidateData[];
  setCandidates: React.Dispatch<React.SetStateAction<CandidateData[]>>;
  addCandidate: (candidate: Omit<CandidateData, "id"> & { id?: number }) => Promise<void>;
  updateCandidateStatus: (id: number, status: CandidateData["status"]) => Promise<void>;
  deleteCandidate: (id: number) => Promise<void>;
  interviews: InterviewData[];
  addInterview: (interview: InterviewData) => Promise<void>;
  removeInterview: (id: number) => Promise<void>;
  candidatesLoading: boolean;
  candidatesError: string | null;
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendNotification: (userId: string, title: string, message: string, type: NotificationData["type"]) => Promise<void>;
  employees: EmployeeData[];
  setEmployees: React.Dispatch<React.SetStateAction<EmployeeData[]>>;
  addEmployee: (employee: Partial<EmployeeData>, rawPassword?: string) => Promise<void>;
  updateEmployeeRole: (id: string | number, newRole: string) => Promise<void>;
  jobs: JobPost[];
  addJob: (job: Omit<JobPost, "id"> & { id?: number }) => Promise<void>;
  updateJob: (id: number, updates: Partial<JobPost>) => Promise<void>;
  deleteJob: (id: number) => Promise<void>;
  // Employee portal: tasks
  tasks: TaskData[];
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateTaskProgress: (id: string, progress: number) => void;
}

const SharedContext = createContext<SharedContextType | null>(null);

const LS_INTERVIEWS = "fazemate_interviews";
const LS_NOTIFICATIONS = "fazemate_notifications";
const LS_JOBS = "fazemate_jobs";
const LS_TASKS = "fazemate_tasks";

// ── Employee portal: task seeding ────────────────────────────
const TASK_TEMPLATES: Array<{ title: string; description: string; priority: TaskPriority }> = [
  { title: "Complete onboarding checklist", description: "Finish all onboarding items including compliance training and tool access setup.", priority: "high" },
  { title: "Prepare weekly status report", description: "Summarize progress, blockers, and next steps for the team lead.", priority: "medium" },
  { title: "Refactor legacy module", description: "Clean up the legacy module and improve maintainability for the next release.", priority: "high" },
  { title: "Attend daily team standup", description: "Daily 15-minute sync to align on progress and unblock teammates.", priority: "low" },
  { title: "Write technical documentation", description: "Document the recently shipped feature for the internal knowledge base.", priority: "medium" },
  { title: "Code review — open PRs", description: "Review pull requests from the team and leave constructive feedback.", priority: "medium" },
  { title: "Fix critical bug in checkout flow", description: "Resolve the reported crash in the checkout flow before the next deploy.", priority: "high" },
  { title: "Update handbook section", description: "Refresh the remote-work policy section of the employee handbook.", priority: "low" },
  { title: "Prep for performance review", description: "Gather data and notes ahead of the quarterly review session.", priority: "medium" },
  { title: "Optimize dashboard load time", description: "Reduce bundle size and improve initial render speed of the main dashboard.", priority: "high" },
  { title: "Draft quarterly goals", description: "Write down measurable goals for the upcoming quarter with your manager.", priority: "medium" },
  { title: "Run regression tests", description: "Execute the regression suite and report any failing cases.", priority: "high" },
  { title: "Update skill profile", description: "Refresh skills and certifications on your employee profile.", priority: "low" },
  { title: "Review security training", description: "Complete the mandatory annual security awareness training.", priority: "high" },
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface TaskAssigneeSeed {
  name: string;
  email: string;
  department?: string;
}

function generateTasksForAssignee(a: TaskAssigneeSeed): TaskData[] {
  const seed = hashString((a.email || a.name || "").toLowerCase());
  const dept = a.department || "General";
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const tasks: TaskData[] = [];

  // 5 tasks per person, deterministic per email
  for (let i = 0; i < 5; i++) {
    const tpl = TASK_TEMPLATES[(seed + i * 3) % TASK_TEMPLATES.length];
    const roll = (seed + i * 7) % 10;
    let status: TaskStatus;
    if (roll < 3) status = "completed";
    else if (roll < 6) status = "in_progress";
    else status = "assigned";

    const due = new Date(today);
    due.setDate(due.getDate() + ((seed + i * 7) % 20) - 5); // -5 .. +14 days
    const created = new Date(today);
    created.setDate(created.getDate() - ((seed + i * 5) % 30) - 1);

    let completedAt: string | null = null;
    let progress = 0;
    if (status === "completed") {
      const done = new Date(today);
      done.setDate(done.getDate() - ((seed + i) % 10));
      completedAt = iso(done);
      progress = 100;
    } else if (status === "in_progress") {
      progress = 20 + ((seed + i * 13) % 60);
    }

    tasks.push({
      id: `${a.email || a.name}-${seed}-${i}`,
      title: tpl.title,
      description: tpl.description,
      status,
      priority: tpl.priority,
      dueDate: iso(due),
      assigneeEmail: a.email || "",
      assigneeName: a.name || "Employee",
      department: dept,
      createdBy: "HR Team",
      createdAt: iso(created),
      completedAt,
      progress,
    });
  }
  return tasks;
}

function mapApiTask(t: any): TaskData {
  return {
    id: String(t.id),
    title: t.title ?? "",
    description: t.description ?? "",
    status: (t.status as TaskStatus) ?? "assigned",
    priority: (t.priority as TaskPriority) ?? "medium",
    dueDate: t.due_date ?? "",
    assigneeEmail: t.assignee_email ?? "",
    assigneeName: t.assignee_name ?? "",
    department: t.department ?? "",
    createdBy: t.created_by ?? "",
    createdAt: t.created_at ?? "",
    completedAt: t.completed_at ?? null,
    progress: t.progress ?? 0,
  };
}

function toApiTask(t: TaskData): Record<string, unknown> {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    due_date: t.dueDate,
    assignee_email: t.assigneeEmail,
    assignee_name: t.assigneeName,
    department: t.department,
    created_by: t.createdBy,
    created_at: t.createdAt,
    completed_at: t.completedAt,
    progress: t.progress,
  };
}

export function SharedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [tasksReady, setTasksReady] = useState(false);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);

  const useSupabase = !!import.meta.env.VITE_SUPABASE_URL;

  // ── 1. Fetch candidates ──
  useEffect(() => {
    const loadCandidates = async () => {
      if (!user) return;
      if (useSupabase) {
        try {
          const { supabase } = await import("../utils/supabase");
          let query = supabase.from("candidates").select("*");
          
          // RBAC listing check
          if (!["CTO", "HR", "HR_Manager", "Head_of_Operations"].includes(user.role)) {
            query = query.eq("email", user.email);
          } else {
            query = query.order("ai_score", { ascending: false });
          }

          const { data, error } = await query;
          if (error) throw new Error(error.message);
          setCandidates((data || []).map(mapApiCandidate));
          setCandidatesError(null);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to load candidates";
          setCandidatesError(message);
        } finally {
          setCandidatesLoading(false);
        }
      } else {
        const token = getToken();
        if (!token) {
          setCandidatesLoading(false);
          return;
        }
        try {
          const apiCandidates = await candidateApi.list();
          // Filter locally for role
          const filtered = ["CTO", "HR", "HR_Manager", "Head_of_Operations"].includes(user.role)
            ? apiCandidates
            : apiCandidates.filter((c: CandidateApiData) => c.email === user.email);
          setCandidates(filtered.map(mapApiCandidate));
          setCandidatesError(null);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to load candidates";
          setCandidatesError(message);
        } finally {
          setCandidatesLoading(false);
        }
      }
    };

    loadCandidates();
  }, [user]);

  // ── 2. Fetch interviews ──
  useEffect(() => {
    const loadInterviews = async () => {
      if (!user) return;
      if (useSupabase) {
        try {
          const { supabase } = await import("../utils/supabase");
          let query = supabase.from("interviews").select("*");
          
          if (!["CTO", "HR", "HR_Manager", "Head_of_Operations"].includes(user.role)) {
            query = query.ilike("candidate_email", user.email);
          }

          const { data, error } = await query;
          if (error) throw new Error(error.message);
          setInterviews((data || []).map(mapApiInterview));
        } catch (err) {
          console.error("Failed to load interviews:", err);
        }
      } else {
        const stored = localStorage.getItem(LS_INTERVIEWS);
        if (stored) {
          const all = JSON.parse(stored).map(mapApiInterview);
          const filtered = ["CTO", "HR", "HR_Manager", "Head_of_Operations"].includes(user.role)
            ? all
            : all.filter((i: any) => i.candidateEmail?.toLowerCase() === user.email?.toLowerCase());
          setInterviews(filtered);
        } else {
          localStorage.setItem(LS_INTERVIEWS, JSON.stringify([]));
          setInterviews([]);
        }
      }
    };

    loadInterviews();
  }, [user]);

  // ── 3. Fetch notifications ──
  const loadNotifications = async () => {
    if (!user) return;
    if (useSupabase) {
      try {
        const { supabase } = await import("../utils/supabase");
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        setNotifications((data || []).map(mapApiNotification));
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    } else {
      const stored = localStorage.getItem(LS_NOTIFICATIONS) || "[]";
      const list = JSON.parse(stored).filter((n: any) => n.user_id === user.id);
      setNotifications(list.map(mapApiNotification));
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  // ── 3.5 Fetch employees ──
  useEffect(() => {
    const loadEmployees = async () => {
      if (!user) return;
      try {
        if (useSupabase) {
          const { supabase } = await import("../utils/supabase");
          const { data, error } = await supabase
            .from("profiles")
            .select("id, name, email, job_title, role, avatar, department, employee_id, joining_date, employment_status")
            .neq("role", "Candidate");
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            const mapped: EmployeeData[] = data.map((p: any) => ({
              id: p.id,
              name: p.name || "Unknown",
              email: p.email || "",
              jobTitle: p.job_title || "Staff",
              role: p.role || "Intern",
                status: p.employment_status || "Permanent",
                statusColor: "bg-green-100 text-green-700",
                securityStatus: "Verified",
                avatar: p.avatar || "",
                department: p.department || "",
                employee_id: p.employee_id || "",
                joining_date: p.joining_date || "",
                employment_status: p.employment_status || "Active",
              }));
              setEmployees(mapped);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    loadEmployees();
  }, [user]);

  // ── 3.5b Employee portal: load & seed tasks ──
  useEffect(() => {
    const loadTasks = async () => {
      if (!user) return;
      let list: TaskData[] = [];
      if (useSupabase) {
        try {
          const { supabase } = await import("../utils/supabase");
          const { data, error } = await supabase.from("tasks").select("*");
          if (!error && data && data.length > 0) list = (data as any[]).map(mapApiTask);
        } catch (err) {
          console.warn("Failed to load tasks from Supabase:", err);
        }
      }
      if (list.length === 0) {
        const stored = localStorage.getItem(LS_TASKS);
        if (stored) {
          try { list = JSON.parse(stored); } catch { list = []; }
        }
      }

      let changed = false;
      // Seed tasks for every staff member that doesn't have any yet
      const staff: TaskAssigneeSeed[] = employees
        .filter((e) => e.email && e.role !== "Candidate")
        .map((e) => ({ name: e.name, email: e.email, department: e.department }));
      for (const emp of staff) {
        const key = emp.email.toLowerCase();
        const has = list.some((t) => t.assigneeEmail.toLowerCase() === key);
        if (!has) {
          list = list.concat(generateTasksForAssignee(emp));
          changed = true;
        }
      }
      // Ensure the logged-in employee always has tasks (even without a directory row)
      if (["CTO", "Head_of_Operations", "HR", "HR_Manager", "Senior_Frontend", "Senior_Backend", "Junior_Frontend", "Junior_Backend", "DBA", "DBA_Intern", "Frontend_Intern", "Backend_Intern", "Intern"].includes(user.role) && user.email) {
        const key = user.email.toLowerCase();
        const has = list.some((t) => t.assigneeEmail.toLowerCase() === key);
        if (!has) {
          list = list.concat(generateTasksForAssignee({
            name: user.name || user.email.split("@")[0],
            email: user.email,
            department: user.department || "General",
          }));
          changed = true;
        }
      }

      if (changed) setTasks(list);
      else setTasks(list.length ? list : []);
      setTasksReady(true);
    };
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, employees]);

  // Persist tasks whenever they change (localStorage always, Supabase when available)
  useEffect(() => {
    if (!tasksReady) return;
    localStorage.setItem(LS_TASKS, JSON.stringify(tasks));
    if (useSupabase && tasks.length > 0) {
      import("../utils/supabase").then(async ({ supabase }) => {
        try {
          await supabase.from("tasks").upsert(tasks.map(toApiTask), { onConflict: "id" });
        } catch (err: unknown) {
          console.warn("Failed to sync tasks to Supabase:", err);
        }
      });
    }
  }, [tasks, tasksReady, useSupabase]);

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const today = new Date().toISOString().slice(0, 10);
        if (status === "completed") {
          return { ...t, status, progress: 100, completedAt: t.completedAt || today };
        }
        if (status === "in_progress") {
          return { ...t, status, progress: t.progress > 0 && t.progress < 100 ? t.progress : 10, completedAt: null };
        }
        // assigned
        return { ...t, status, completedAt: null };
      })
    );
  };

  const updateTaskProgress = (id: string, progress: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const clamped = Math.max(0, Math.min(100, Math.round(progress)));
        if (clamped >= 100) {
          return { ...t, progress: 100, status: "completed", completedAt: t.completedAt || new Date().toISOString().slice(0, 10) };
        }
        return { ...t, progress: clamped, status: clamped > 0 ? "in_progress" : t.status };
      })
    );
  };

  // ── 3.6 Fetch jobs ──
  useEffect(() => {
    const loadJobs = async () => {
      if (!user) return;
      if (useSupabase) {
        try {
          const { supabase } = await import("../utils/supabase");
          const { data, error } = await supabase
            .from("jobs")
            .select("*")
            .order("created_at", { ascending: false });
          if (error) throw new Error(error.message);
          const mapped = (data || []).map(mapApiJob);
          setJobs(mapped);
          // Sync to localStorage so the public /career portal can read them
          localStorage.setItem(LS_JOBS, JSON.stringify(mapped));
        } catch (err) {
          console.error("Failed to load jobs from Supabase:", err);
          loadLocalJobs();
        }
      } else {
        loadLocalJobs();
      }
    };

    const loadLocalJobs = () => {
      const stored = localStorage.getItem(LS_JOBS);
      if (stored) {
        setJobs(JSON.parse(stored).map(mapApiJob));
      } else {
        const initialMockJobs: JobPost[] = [
          {
            id: 1,
            title: "Senior Frontend Developer",
            department: "Engineering",
            location: "Remote",
            type: "Full-time",
            applicants: 45,
            views: 342,
            status: "Active",
            postedDate: "2024-02-20",
            salary: "$90k - $120k",
            platforms: ["LinkedIn", "Company Site"],
            description: "We are looking for a Senior Frontend Developer to build cutting-edge web applications using React, TypeScript, and modern frontend technologies.",
          },
          {
            id: 2,
            title: "Product Manager",
            department: "Product",
            location: "New York, NY",
            type: "Full-time",
            applicants: 28,
            views: 215,
            status: "Active",
            postedDate: "2024-02-18",
            salary: "$100k - $140k",
            platforms: ["LinkedIn", "Indeed", "Company Site"],
            description: "Seeking an experienced Product Manager to lead cross-functional teams and drive product strategy from ideation to launch.",
          },
          {
            id: 3,
            title: "UX/UI Designer",
            department: "Design",
            location: "Hybrid",
            type: "Full-time",
            applicants: 67,
            views: 489,
            status: "Active",
            postedDate: "2024-02-15",
            salary: "$70k - $95k",
            platforms: ["LinkedIn", "Company Site", "Behance"],
            description: "Join our design team to create beautiful, intuitive user experiences across our product suite.",
          },
          {
            id: 4,
            title: "Backend Developer",
            department: "Engineering",
            location: "Remote",
            type: "Contract",
            applicants: 33,
            views: 267,
            status: "Draft",
            postedDate: "2024-02-22",
            salary: "$80k - $110k",
            platforms: ["LinkedIn"],
            description: "Looking for a Backend Developer proficient in Node.js, Python, and cloud infrastructure.",
          },
          {
            id: 5,
            title: "Data Analyst",
            department: "Analytics",
            location: "San Francisco, CA",
            type: "Full-time",
            applicants: 52,
            views: 398,
            status: "Active",
            postedDate: "2024-02-12",
            salary: "$75k - $100k",
            platforms: ["LinkedIn", "Indeed", "Company Site"],
            description: "We need a Data Analyst to transform complex datasets into actionable insights that drive business decisions.",
          },
          {
            id: 6,
            title: "DevOps Engineer",
            department: "Engineering",
            location: "Remote",
            type: "Full-time",
            applicants: 19,
            views: 156,
            status: "Closed",
            postedDate: "2024-01-30",
            salary: "$95k - $130k",
            platforms: ["LinkedIn", "Company Site"],
            description: "Seeking a DevOps Engineer to build and maintain CI/CD pipelines, manage cloud infrastructure, and ensure system reliability.",
          },
        ];
        localStorage.setItem(LS_JOBS, JSON.stringify(initialMockJobs));
        setJobs(initialMockJobs);
      }
    };

    loadJobs();
  }, [user, useSupabase]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── 4. Notifications actions ──
  const markAsRead = async (id: number) => {
    if (useSupabase) {
      const { supabase } = await import("../utils/supabase");
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    } else {
      const stored = JSON.parse(localStorage.getItem(LS_NOTIFICATIONS) || "[]");
      const updated = stored.map((n: any) => n.id === id ? { ...n, is_read: true } : n);
      localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(updated));
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    if (useSupabase) {
      const { supabase } = await import("../utils/supabase");
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
    } else {
      const stored = JSON.parse(localStorage.getItem(LS_NOTIFICATIONS) || "[]");
      const updated = stored.map((n: any) => n.user_id === user.id ? { ...n, is_read: true } : n);
      localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(updated));
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const sendNotification = async (
    targetUserId: string,
    title: string,
    message: string,
    type: NotificationData["type"]
  ) => {
    const newNotifyRow = {
      id: Date.now() + Math.floor(Math.random() * 100),
      user_id: targetUserId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    if (useSupabase) {
      const { supabase } = await import("../utils/supabase");
      await supabase.from("notifications").insert([newNotifyRow]);
    } else {
      const stored = JSON.parse(localStorage.getItem(LS_NOTIFICATIONS) || "[]");
      stored.unshift(newNotifyRow);
      localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(stored));
    }

    if (user && targetUserId === user.id) {
      setNotifications((prev) => [mapApiNotification(newNotifyRow), ...prev]);
    }
  };

  const notifyCandidateByEmail = async (
    candidateEmail: string,
    title: string,
    message: string,
    type: NotificationData["type"]
  ) => {
    // Look up user ID of the candidate in profiles
    if (useSupabase) {
      const { supabase } = await import("../utils/supabase");
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", candidateEmail)
        .maybeSingle();
      if (data?.id) {
        await sendNotification(data.id, title, message, type);
      }
    } else {
      const accounts = JSON.parse(localStorage.getItem("fazemate_accounts") || "[]");
      const matched = accounts.find((a: any) => a.email === candidateEmail);
      if (matched?.id) {
        await sendNotification(matched.id, title, message, type);
      }
    }
  };

  // ── 5. Candidate Actions ──
  const addCandidate = async (candidate: Omit<CandidateData, "id"> & { id?: number }) => {
    try {
      if (useSupabase) {
        const { supabase } = await import("../utils/supabase");

        // Base payload — columns guaranteed to exist in the original schema
        const basePayload: Record<string, unknown> = {
          name: candidate.name,
          phone: candidate.phone,
          position: candidate.position,
          ai_score: candidate.aiScore,
          experience: candidate.experience,
          skills: candidate.skills,
          status: candidate.status,
          avatar: candidate.avatar,
          applied_date: candidate.appliedDate,
          match_reasons: candidate.matchReasons,
        };

        // Extended payload — needs migration v2 (adds education + certifications columns)
        const extendedPayload: Record<string, unknown> = {
          ...basePayload,
          education: candidate.education || [],
          certifications: candidate.certifications || [],
        };

        // Helper: save with extended fields, retry with base if schema cache error
        const saveCandidate = async (isUpdate: boolean, existingId?: number) => {
          const doSave = async (payload: Record<string, unknown>) => {
            if (isUpdate && existingId) {
              return supabase.from("candidates")
                .update({ ...payload, updated_at: new Date().toISOString() })
                .eq("id", existingId).select();
            }
            return supabase.from("candidates")
              .insert([{ ...payload, email: candidate.email }]).select();
          };

          let result = await doSave(extendedPayload);
          if (result.error?.message?.includes("schema cache")) {
            // Missing columns — run supabase_migration_v2.sql to fix permanently
            console.warn("[FazeMate] Retrying without education/certifications — run supabase_migration_v2.sql");
            result = await doSave(basePayload);
          }
          return result;
        };

        const { data: existing } = await supabase
          .from("candidates").select("id").eq("email", candidate.email).maybeSingle();

        if (existing) {
          const { data, error } = await saveCandidate(true, existing.id);
          if (error) throw new Error(error.message);
          if (data && data.length > 0) {
            setCandidates((prev) =>
              prev.map((c) => (c.email === candidate.email ? mapApiCandidate(data[0]) : c))
            );
          }
        } else {
          const { data, error } = await saveCandidate(false);
          if (error) throw new Error(error.message);
          if (data && data.length > 0) {
            setCandidates((prev) => [mapApiCandidate(data[0]), ...prev]);
          }
        }
      } else {
        const existing = candidates.find(c => c.email === candidate.email);
        if (existing) {
          const apiData = await candidateApi.update(existing.id, {
            name: candidate.name,
            phone: candidate.phone,
            position: candidate.position,
            ai_score: candidate.aiScore,
            experience: candidate.experience,
            skills: candidate.skills,
            education: candidate.education || [],
            certifications: candidate.certifications || [],
            status: candidate.status,
            avatar: candidate.avatar,
            applied_date: candidate.appliedDate,
            match_reasons: candidate.matchReasons,
          });
          setCandidates((prev) =>
            prev.map((c) => (c.id === existing.id ? mapApiCandidate(apiData) : c))
          );
        } else {
          const apiData = await candidateApi.create({
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            position: candidate.position,
            ai_score: candidate.aiScore,
            experience: candidate.experience,
            skills: candidate.skills,
            education: candidate.education || [],
            certifications: candidate.certifications || [],
            status: candidate.status,
            avatar: candidate.avatar,
            applied_date: candidate.appliedDate,
            match_reasons: candidate.matchReasons ?? [],
          });
          setCandidates((prev) => [mapApiCandidate(apiData), ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to add or update candidate:", err);
      throw err;
    }
  };

  const updateCandidateStatus = async (
    id: number,
    status: CandidateData["status"]
  ) => {
    // Read current info for notifications
    const target = candidates.find((c) => c.id === id);
    if (!target) return;

    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );

    try {
      if (useSupabase) {
        const { supabase } = await import("../utils/supabase");
        const { error } = await supabase
          .from("candidates")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw new Error(error.message);
      } else {
        await candidateApi.updateStatus(id, status);
      }

      // Generate trigger notifications
      let title = "Application Status Update";
      let msg = `Your application status for ${target.position} has been updated to "${status}".`;
      let type: NotificationData["type"] = "application";

      if (status === "Screened") {
        title = "Application Shortlisted";
        msg = `Your application for ${target.position} has been shortlisted!`;
        type = "success";
      } else if (status === "Interview") {
        title = "Interview Invitation";
        msg = `You have been invited to schedule an interview for ${target.position}.`;
        type = "interview";
      } else if (status === "Offer") {
        title = "Job Offer Received";
        msg = `Congratulations! You have received a job offer for the ${target.position} position.`;
        type = "success";
      } else if (status === "Hired") {
        title = "Hired!";
        msg = `Welcome to the team! You have been marked as hired for ${target.position}.`;
        type = "success";
      } else if (status === "Rejected") {
        title = "Application Update";
        msg = `Thank you for your interest in the ${target.position} position. Unfortunately, we are not moving forward at this time.`;
        type = "warning";
      }

      await notifyCandidateByEmail(target.email, title, msg, type);
    } catch (err) {
      console.error("Failed to sync candidate status:", err);
    }
  };

  const deleteCandidate = async (id: number) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    try {
      if (useSupabase) {
        const { supabase } = await import("../utils/supabase");
        const { error } = await supabase.from("candidates").delete().eq("id", id);
        if (error) throw new Error(error.message);
      } else {
        await candidateApi.delete(id);
      }
    } catch (err) {
      console.error("Failed to delete candidate:", err);
    }
  };

  // ── 6. Interview Actions ──
  const addInterview = async (interview: InterviewData) => {
    const row = {
      candidate_name: interview.candidate,
      candidate_email: interview.candidateEmail,
      position: interview.position,
      date: interview.date,
      time: interview.time,
      duration: interview.duration,
      type: interview.type,
      interviewer: interview.interviewer,
      meeting_link: interview.meetingLink,
      avatar: interview.avatar,
    };

    try {
      let inserted: InterviewData;
      if (useSupabase) {
        const { supabase } = await import("../utils/supabase");
        const { data, error } = await supabase.from("interviews").insert([row]).select();
        if (error) throw new Error(error.message);
        inserted = mapApiInterview(data[0]);
      } else {
        const stored = JSON.parse(localStorage.getItem(LS_INTERVIEWS) || "[]");
        const newInt = { ...row, id: Date.now() };
        stored.push(newInt);
        localStorage.setItem(LS_INTERVIEWS, JSON.stringify(stored));
        inserted = mapApiInterview(newInt);
      }

      setInterviews((prev) => [...prev, inserted]);

      // Generate trigger notification
      await notifyCandidateByEmail(
        interview.candidateEmail,
        "New Interview Scheduled",
        `You have a new interview scheduled for ${interview.position} on ${interview.date} at ${interview.time}.`,
        "interview"
      );
    } catch (err) {
      console.error("Failed to schedule interview:", err);
    }
  };

  const removeInterview = async (id: number) => {
    const target = interviews.find((i) => i.id === id);
    if (!target) return;

    setInterviews((prev) => prev.filter((i) => i.id !== id));

    try {
      if (useSupabase) {
        const { supabase } = await import("../utils/supabase");
        const { error } = await supabase.from("interviews").delete().eq("id", id);
        if (error) throw new Error(error.message);
      } else {
        const stored = JSON.parse(localStorage.getItem(LS_INTERVIEWS) || "[]");
        const updated = stored.filter((i: any) => i.id !== id);
        localStorage.setItem(LS_INTERVIEWS, JSON.stringify(updated));
      }

      // Generate trigger notification
      await notifyCandidateByEmail(
        target.candidateEmail,
        "Interview Cancelled",
        `Your interview for ${target.position} on ${target.date} has been cancelled.`,
        "warning"
      );
    } catch (err) {
      console.error("Failed to delete interview:", err);
    }
  };

  const addJob = async (job: Omit<JobPost, "id"> & { id?: number }) => {
    const newJob: JobPost = {
      ...job,
      id: job.id ?? Date.now(),
      applicants: job.applicants ?? 0,
      views: job.views ?? 0,
      status: job.status ?? "Active",
      postedDate: job.postedDate ?? new Date().toISOString().split("T")[0],
    };

    if (useSupabase) {
      try {
        const { supabase } = await import("../utils/supabase");
        const row = {
          title: newJob.title,
          department: newJob.department,
          description: newJob.description,
          employment_type: newJob.type,
          location: newJob.location,
          salary_range: newJob.salary,
          status: newJob.status,
          platforms: newJob.platforms,
          applicants: newJob.applicants,
          views: newJob.views,
          created_by: user?.id,
        };
        const { data, error } = await supabase.from("jobs").insert([row]).select();
        if (error) throw new Error(error.message);
        if (data && data[0]) {
          setJobs((prev) => {
            const updated = [mapApiJob(data[0]), ...prev];
            localStorage.setItem(LS_JOBS, JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error("Failed to add job to Supabase:", err);
        saveLocalJob(newJob);
      }
    } else {
      saveLocalJob(newJob);
    }
  };

  const saveLocalJob = (newJob: JobPost) => {
    const stored = JSON.parse(localStorage.getItem(LS_JOBS) || "[]");
    stored.unshift(newJob);
    localStorage.setItem(LS_JOBS, JSON.stringify(stored));
    setJobs((prev) => [newJob, ...prev]);
  };

  const updateJob = async (id: number, updates: Partial<JobPost>) => {
    setJobs((prev) => {
      const updated = prev.map((j) => (j.id === id ? { ...j, ...updates } : j));
      localStorage.setItem(LS_JOBS, JSON.stringify(updated));
      return updated;
    });

    if (useSupabase) {
      try {
        const { supabase } = await import("../utils/supabase");
        const row: Record<string, any> = {};
        if (updates.title !== undefined) row.title = updates.title;
        if (updates.department !== undefined) row.department = updates.department;
        if (updates.description !== undefined) row.description = updates.description;
        if (updates.type !== undefined) row.employment_type = updates.type;
        if (updates.location !== undefined) row.location = updates.location;
        if (updates.salary !== undefined) row.salary_range = updates.salary;
        if (updates.status !== undefined) row.status = updates.status;
        if (updates.platforms !== undefined) row.platforms = updates.platforms;
        if (updates.applicants !== undefined) row.applicants = updates.applicants;
        if (updates.views !== undefined) row.views = updates.views;

        const { error } = await supabase.from("jobs").update(row).eq("id", id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("Failed to update job in Supabase:", err);
      }
    }
  };

  const updateLocalJob = (id: number, updates: Partial<JobPost>) => {
    const stored = JSON.parse(localStorage.getItem(LS_JOBS) || "[]");
    const updated = stored.map((j: any) => (j.id === id ? { ...j, ...updates } : j));
    localStorage.setItem(LS_JOBS, JSON.stringify(updated));
  };

  const deleteJob = async (id: number) => {
    setJobs((prev) => {
      const updated = prev.filter((j) => j.id !== id);
      localStorage.setItem(LS_JOBS, JSON.stringify(updated));
      return updated;
    });

    if (useSupabase) {
      try {
        const { supabase } = await import("../utils/supabase");
        const { error } = await supabase.from("jobs").delete().eq("id", id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("Failed to delete job from Supabase:", err);
      }
    }
  };

  const deleteLocalJob = (id: number) => {
    const stored = JSON.parse(localStorage.getItem(LS_JOBS) || "[]");
    const filtered = stored.filter((j: any) => j.id !== id);
    localStorage.setItem(LS_JOBS, JSON.stringify(filtered));
  };

  return (
    <SharedContext.Provider
      value={{
        candidates,
        setCandidates,
        addCandidate,
        updateCandidateStatus,
        deleteCandidate,
        interviews,
        addInterview,
        removeInterview,
        candidatesLoading,
        candidatesError,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        sendNotification,
        employees,
        setEmployees,
        addEmployee: async (emp, rawPassword) => {
          // Employee creation logic to be called by Admin
          const newRole = emp.role || "Intern";
          if (useSupabase) {
            const { supabase } = await import("../utils/supabase");
            // 1) Create the employee LOGIN account on the FastAPI backend (users table)
            //    → this is what lets the employee actually sign in to the app.
            try {
              await authApi.createEmployee({
                email: emp.email,
                password: rawPassword || 'password123',
                full_name: emp.name,
                job_title: emp.jobTitle,
              });
            } catch (err: unknown) {
              throw new Error(
                err instanceof Error ? err.message : 'Failed to create employee login account.'
              );
            }

            // 2) Show the employee in the directory (profiles table).
            //    If the insert is blocked (e.g. RLS), still show them locally.
            let mapped: EmployeeData;
            try {
              const { data, error } = await supabase.from('profiles').insert([{
                id: crypto.randomUUID(), // valid UUID (the old fake id was invalid)
                name: emp.name,
                email: emp.email,
                role: newRole,
                job_title: emp.jobTitle,
                department: emp.department,
                employment_status: emp.status,
              }]).select();
              if (error) console.warn("Login account created, but directory row failed:", error.message);
              mapped = {
                id: data?.[0]?.id || crypto.randomUUID(),
                name: data?.[0]?.name || emp.name || "Unknown",
                email: data?.[0]?.email || emp.email || "",
                jobTitle: data?.[0]?.job_title || emp.jobTitle || "Staff",
                role: emp.role || "Intern",
                status: data?.[0]?.employment_status || emp.status || "Permanent",
                statusColor: "bg-green-100 text-green-700",
                securityStatus: "Pending",
                avatar: "",
                department: data?.[0]?.department || emp.department || "",
              };
            } catch (err) {
              console.error("Supabase create user error:", err);
              mapped = {
                id: crypto.randomUUID(),
                name: emp.name || "Unknown",
                email: emp.email || "",
                jobTitle: emp.jobTitle || "Staff",
                role: emp.role || "Intern",
                status: emp.status || "Permanent",
                statusColor: "bg-green-100 text-green-700",
                securityStatus: "Pending",
                avatar: "",
                department: emp.department || "",
              };
            }
            setEmployees(prev => [...prev, mapped]);
          } else {
            // local storage approach
            const accounts = JSON.parse(localStorage.getItem("fazemate_accounts") || "[]");
            const newAccount = {
              email: emp.email,
              password: rawPassword || "password123",
              name: emp.name,
              id: Math.random().toString(36).substr(2, 9),
              role: newRole,
              job_title: emp.jobTitle,
              department: emp.department,
              employment_status: emp.status || "Active",
            };
            accounts.push(newAccount);
            localStorage.setItem("fazemate_accounts", JSON.stringify(accounts));
            
            setEmployees(prev => [...prev, {
              id: newAccount.id,
              name: newAccount.name || "",
              email: newAccount.email!,
              jobTitle: newAccount.job_title!,
              role: emp.role || "Intern",
              status: newAccount.employment_status,
              statusColor: "bg-green-100 text-green-700",
              securityStatus: "Pending",
              avatar: "",
              department: newAccount.department,
            }]);
          }
        },
        updateEmployeeRole: async (id, newRole) => {
          const dbRole = newRole || "Intern";
          
          if (useSupabase) {
            const { supabase } = await import("../utils/supabase");
            await supabase.from("profiles").update({ role: dbRole }).eq("id", id);
          } else {
            const accounts = JSON.parse(localStorage.getItem("fazemate_accounts") || "[]");
            const idx = accounts.findIndex((a: any) => a.id === id || a.email === id);
            if (idx !== -1) {
              accounts[idx].role = dbRole;
              localStorage.setItem("fazemate_accounts", JSON.stringify(accounts));
            }
          }
          setEmployees(prev => prev.map(e => e.id === id ? { ...e, role: newRole } : e));
        },
        jobs,
        addJob,
        updateJob,
        deleteJob,
        tasks,
        updateTaskStatus,
        updateTaskProgress,
      }}
    >
      {children}
    </SharedContext.Provider>
  );
}

export function useSharedContext() {
  const context = useContext(SharedContext);
  if (!context) {
    throw new Error("useSharedContext must be used within a SharedProvider");
  }
  return context;
}