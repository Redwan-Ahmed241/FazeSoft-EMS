import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Report } from "./pages/dashboard/Report";
import { Employees } from "./pages/employees/Employees";
import { JobPosting } from "./pages/projects/JobPosting";
import { Candidate } from "./pages/candidates/Candidate";
import { CalendarPage } from "./pages/interviews/CalendarPage";
import { ResumeParsing } from "./pages/candidates/ResumeParsing";
import { Profile } from "./pages/profile/Profile";
import { Settings } from "./pages/settings/Settings";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { SharedProvider } from "./context/SharedContext";
import Login from "./pages/auth/login";
import Signup from "./pages/auth/signup";
import { PortalCareer } from "./pages/career/PortalCareer";
import { PortalAuthProvider } from "./context/PortalAuthContext";
import { PortalProvider } from "./context/PortalContext";
import { EmployeeDashboard } from "./pages/employees/EmployeeDashboard";
import { MyTasks } from "./pages/employees/MyTasks";
import { TeamProgress } from "./pages/employees/TeamProgress";
import { History } from "./pages/employees/History";

import { CreateProject } from "./pages/projects/CreateProject";
import { CreateTeam } from "./pages/projects/CreateTeam";
import { ProjectDetail } from "./pages/projects/ProjectDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/career",
    Component: () => (
      <PortalAuthProvider>
        <PortalProvider>
          <PortalCareer />
        </PortalProvider>
      </PortalAuthProvider>
    )
  },
  {
    path: "/dashboard",
    Component: () => (
      <ProtectedRoute>
        <PortalAuthProvider>
          <PortalProvider>
            <SharedProvider>
              <Layout />
            </SharedProvider>
          </PortalProvider>
        </PortalAuthProvider>
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "report", Component: () => <ProtectedRoute allowedRoles={["hr", "admin"]}><Report /></ProtectedRoute> },
      { path: "employees", Component: () => <ProtectedRoute allowedRoles={["hr", "admin"]}><Employees /></ProtectedRoute> },
      { path: "job-posting", Component: () => <ProtectedRoute allowedRoles={["hr", "admin"]}><JobPosting /></ProtectedRoute> },
      { path: "candidate", Component: () => <ProtectedRoute allowedRoles={["hr", "admin"]}><Candidate /></ProtectedRoute> },
      { path: "projects/create", Component: () => <ProtectedRoute allowedRoles={["hr", "admin"]}><CreateProject /></ProtectedRoute> },
      { path: "projects/:projectId/create-team", Component: () => <ProtectedRoute allowedRoles={["hr", "admin"]}><CreateTeam /></ProtectedRoute> },
      { path: "projects/:projectId", Component: () => <ProtectedRoute allowedRoles={["hr", "admin"]}><ProjectDetail /></ProtectedRoute> },
      { path: "calendar", Component: CalendarPage },
      { path: "resume-parsing", Component: ResumeParsing },
      { path: "tasks", Component: () => <ProtectedRoute allowedRoles={["employee"]}><MyTasks /></ProtectedRoute> },
      { path: "team", Component: () => <ProtectedRoute allowedRoles={["employee"]}><TeamProgress /></ProtectedRoute> },
      { path: "history", Component: () => <ProtectedRoute allowedRoles={["employee"]}><History /></ProtectedRoute> },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
    ],
  },
]);