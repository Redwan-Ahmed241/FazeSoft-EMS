import { useState } from "react";
import { useSharedContext } from "../../context/SharedContext";
import { Link, Outlet, useLocation } from "react-router";
import InitialsAvatar from "../common/ui/InitialsAvatar";
import { Toaster } from "sonner";
import Frame35 from "../common/Frame35";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  FileText,
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
} from "lucide-react";
import { History as HistoryIcon } from "lucide-react";

function getNotifColor(type: string): string {
  const map: { [key: string]: string } = {
    success: "bg-green-100 text-green-700",
    interview: "bg-purple-100 text-purple-700",
    application: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    info: "bg-gray-100 text-gray-700",
  };
  return map[type] || map.info;
}

function getNotifIcon(type: string): string {
  if (type === "interview") return "🗓️";
  if (type === "success") return "✓";
  if (type === "warning") return "⚠️";
  return "i";
}

const allMenuItems = [
  { path: "/dashboard",               icon: LayoutDashboard, label: "Dashboard",  roles: ["hr", "candidate", "admin", "employee"] },
  { path: "/dashboard/projects",      icon: Briefcase,       label: "Projects",   roles: ["admin"] },
  { path: "/dashboard/projects/create", icon: FolderPlus,    label: "New Project", roles: ["hr", "admin"] },
  { path: "/dashboard/candidate",     icon: UserCheck,       label: "Candidates", roles: ["hr", "admin"] },
  { path: "/dashboard/employees",     icon: Users,           label: "Employees",  roles: ["hr", "admin"] },
  { path: "/dashboard/calendar",      icon: Calendar,        label: "Interviews", roles: ["hr", "admin"] },
  { path: "/dashboard/calendar",      icon: Calendar,        label: "Calendar",   roles: ["candidate"] },
  { path: "/dashboard/job-posting",   icon: Briefcase,       label: "Analytics",  roles: ["hr", "admin"] },
  { path: "/dashboard/resume-parsing",icon: FileSearch,      label: "Analyse Resumes",  roles: ["hr", "admin"] },
  { path: "/dashboard/resume-parsing",icon: FileSearch,      label: "My Resume",  roles: ["candidate"] },
  { path: "/dashboard/tasks",         icon: ListTodo,       label: "My Tasks",    roles: ["employee"] },
  { path: "/dashboard/team",          icon: Users,           label: "Team Progress", roles: ["employee"] },
  { path: "/dashboard/history",       icon: HistoryIcon,     label: "My History",  roles: ["employee"] },
  { path: "/dashboard/report",        icon: FileText,        label: "Reports",    roles: ["hr", "admin"] },
  { path: "/dashboard/profile",       icon: User,            label: "Profile",    roles: ["hr", "candidate", "admin", "employee"] },
  { path: "/dashboard/settings",      icon: SettingsIcon,    label: "Settings",   roles: ["hr", "candidate", "admin", "employee"] },
];

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSharedContext();

  const isHR = user?.role === "hr" || user?.role === "admin";
  const role = user?.role || "candidate";

  // Deduplicate paths per role and filter by current user role
  const seen: string[] = [];
  const menuItems = allMenuItems.filter((item) => {
    if (!item.roles.includes(role)) return false;
    const key = item.path + role;
    if (seen.includes(key)) return false;
    seen.push(key);
    return true;
  });

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
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
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
              name={user?.name && !user.name.includes("@") ? user.name : user?.email?.split("@")[0] || "User"}
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
                  const displayRole = user?.role_name || (user?.role === "admin" ? "Admin" : user?.role === "hr" ? "HR" : user?.role === "employee" ? "Employee" : "Candidate");
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
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-foreground lg:hidden"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-lg border border-input bg-input-background pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Notification */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-full p-2 hover:bg-accent text-foreground transition-all"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm ring-2 ring-card">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 z-50 w-80 rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                  <h3 className="text-sm font-bold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-semibold text-muted-foreground">No notifications yet</p>
                      <p className="text-xs text-muted-foreground mt-1">We will notify you when something happens.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 p-4 hover:bg-muted/30 transition-all ${!n.isRead ? "bg-primary/5" : ""}`}
                      >
                        <div className={`rounded-full p-2 text-xs font-medium ${getNotifColor(n.type)}`}>
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed break-words">
                            {n.message}
                          </p>
                          {!n.isRead && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-[10px] font-semibold text-primary mt-1 hover:underline block"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role badge in header */}
          <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${user?.role === "admin" ? "bg-red-100 text-red-700" : isHR ? "bg-primary/10 text-primary" : user?.role === "employee" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
            {user?.role === "admin" ? (
              <>
                <Shield className="h-3 w-3" />
                Admin Portal
              </>
            ) : isHR ? (
              <>
                <Shield className="h-3 w-3" />
                HR Portal
              </>
            ) : user?.role === "employee" ? (
              <>
                <Users className="h-3 w-3" />
                Employee Portal
              </>
            ) : (
              <>
                <ClipboardList className="h-3 w-3" />
                Candidate Portal
              </>
            )}
          </span>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" richColors={true} />
    </div>
  );
}