import React from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  Calendar,
  FileSearch,
  User,
  Settings as SettingsIcon,
  Shield,
  ClipboardList,
  ListTodo,
  FolderPlus,
  FileText,
  LogOut,
  History as HistoryIcon,
} from "lucide-react";
import Frame35 from "../common/Frame35";
import InitialsAvatar from "../common/ui/InitialsAvatar";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

// Tier 1 and Candidate menu items (existing logic)
const tier1AndCandidateMenuItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["hr", "candidate", "admin"] },
  { path: "/dashboard/projects", icon: Briefcase, label: "Projects", roles: ["admin"] },
  { path: "/dashboard/projects/create", icon: FolderPlus, label: "New Project", roles: ["hr", "admin"] },
  { path: "/dashboard/candidate", icon: UserCheck, label: "Candidates", roles: ["hr", "admin"] },
  { path: "/dashboard/employees", icon: Users, label: "Employees", roles: ["hr", "admin"] },
  { path: "/dashboard/calendar", icon: Calendar, label: "Interviews", roles: ["hr", "admin"] },
  { path: "/dashboard/calendar", icon: Calendar, label: "Calendar", roles: ["candidate"] },
  { path: "/dashboard/job-posting", icon: Briefcase, label: "Analytics", roles: ["hr", "admin"] },
  { path: "/dashboard/resume-parsing", icon: FileSearch, label: "Analyse Resumes", roles: ["hr", "admin"] },
  { path: "/dashboard/resume-parsing", icon: FileSearch, label: "My Resume", roles: ["candidate"] },
  { path: "/dashboard/report", icon: FileText, label: "Reports", roles: ["hr", "admin"] },
  { path: "/dashboard/profile", icon: User, label: "Profile", roles: ["hr", "candidate", "admin"] },
  { path: "/dashboard/settings", icon: SettingsIcon, label: "Settings", roles: ["hr", "candidate", "admin"] },
];

// Tier 2 sidebar items:
const tier2MenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", path: "/dashboard/projects", icon: Briefcase },
  { label: "My Team", path: "/dashboard/team", icon: Users },
  { label: "Tasks", path: "/dashboard/tasks", icon: ListTodo },
  { label: "Profile", path: "/dashboard/profile", icon: User },
  { label: "Settings", path: "/dashboard/settings", icon: SettingsIcon },
];

// Tier 3 sidebar items:
const tier3MenuItems: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", path: "/dashboard/projects", icon: Briefcase },
  { label: "My Tasks", path: "/dashboard/tasks", icon: ListTodo },
  { label: "Profile", path: "/dashboard/profile", icon: User },
  { label: "Settings", path: "/dashboard/settings", icon: SettingsIcon },
];

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const currentUser = user as (typeof user & { permissions?: string[] });
  const canAssignTask = currentUser?.permissions?.includes("assign_task");

  const isTier1 = user?.role === "admin" || user?.role === "hr";
  const isTier2 = user?.role === "employee" && Boolean(canAssignTask);
  const isTier3 = user?.role === "employee" && !canAssignTask;

  let menuItems: MenuItem[] = [];

  if (isTier1 || user?.role === "candidate") {
    const role = user?.role || "candidate";
    const seen: string[] = [];
    menuItems = tier1AndCandidateMenuItems
      .filter((item) => item.roles.includes(role))
      .filter((item) => {
        const key = item.path + role;
        if (seen.includes(key)) return false;
        seen.push(key);
        return true;
      })
      .map((item) => ({ label: item.label, path: item.path, icon: item.icon }));
  } else if (isTier2) {
    menuItems = tier2MenuItems;
  } else if (isTier3) {
    menuItems = tier3MenuItems;
  }

  const isActive = (path: string) => {
    const current = location.pathname.replace(/\/+$/, "") || "/";
    const target = path.replace(/\/+$/, "") || "/";

    if (target === "/dashboard") {
      return current === "/dashboard";
    }

    const matchesTarget = current === target || current.startsWith(target + "/");
    if (!matchesTarget) return false;

    // Avoid highlighting parent/prefix paths if a more specific menu item matches
    const hasMoreSpecificMatch = menuItems.some((other) => {
      const otherTarget = other.path.replace(/\/+$/, "") || "/";
      if (otherTarget === target || otherTarget.length <= target.length) return false;
      return current === otherTarget || current.startsWith(otherTarget + "/");
    });

    return !hasMoreSpecificMatch;
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-border">
          <Frame35 />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <InitialsAvatar
            name={
              user?.name && !user.name.includes("@")
                ? user.name
                : user?.email?.split("@")[0] || "User"
            }
            src={user?.avatar}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {user?.name && !user.name.includes("@")
                ? user.name
                : user?.email?.split("@")[0] || "User"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {(() => {
                const displayRole =
                  user?.role_name ||
                  (user?.role === "admin"
                    ? "Admin"
                    : user?.role === "hr"
                    ? "HR"
                    : user?.role === "employee"
                    ? "Employee"
                    : "Candidate");
                if (user?.role === "admin") {
                  return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      <Shield className="h-2.5 w-2.5" /> {displayRole}
                    </span>
                  );
                }
                if (user?.role === "hr") {
                  return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      <Shield className="h-2.5 w-2.5" /> {displayRole}
                    </span>
                  );
                }
                if (user?.role === "employee") {
                  return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      <Users className="h-2.5 w-2.5" /> {displayRole}
                    </span>
                  );
                }
                return (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    <ClipboardList className="h-2.5 w-2.5" /> {displayRole}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar logout (bottom) */}
        <div className="border-t border-border p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
