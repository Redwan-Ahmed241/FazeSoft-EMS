import type { TaskData, TaskPriority, TaskStatus } from "../SharedContext";

export const STATUS_ORDER: TaskStatus[] = ["assigned", "in_progress", "completed"];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
};

export const STATUS_BADGE: Record<TaskStatus, string> = {
  assigned: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-gray-400",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export function isOverdue(t: TaskData): boolean {
  if (t.status === "completed" || !t.dueDate) return false;
  return t.dueDate < new Date().toISOString().slice(0, 10);
}

export function formatDate(d?: string | null): string {
  if (!d) return "—";
  const date = new Date(d.length === 10 ? `${d}T00:00:00` : d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(d: string): number {
  const today = new Date().toISOString().slice(0, 10);
  return Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86400000);
}

export function dueLabel(t: TaskData): string {
  if (t.status === "completed") return "Done";
  if (!t.dueDate) return "No due date";
  const d = daysUntil(t.dueDate);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d}d`;
}

export function dueColor(t: TaskData): string {
  if (t.status === "completed") return "text-green-600";
  const d = daysUntil(t.dueDate);
  if (d < 0) return "text-red-600";
  if (d === 0) return "text-amber-600";
  return "text-muted-foreground";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
