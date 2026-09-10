import { createBrowserRouter, Navigate } from "react-router";
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
import { ProjectReview } from "./pages/projects/ProjectReview";
import { ProjectDetail } from "./pages/projects/ProjectDetail";
import { ProjectList } from "./pages/projects/ProjectList";
import { EditProject } from "./pages/projects/EditProject";

const getBasename = (): string => {
  if (typeof window !== "undefined") {
    return window.location.pathname.startsWith("/ems") ? "/ems" : "";
  }
  return "/ems";
};

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/employees",
    Component: () => <Navigate to="/dashboard/employees" replace />,
  },
  {
    path: "/attendance",
    Component: () => <Navigate to="/dashboard" replace />,
  },
  {
    path: "/settings",
    Component: () => <Navigate to="/dashboard/settings" replace />,
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
      { path: "report", Component: () => <ProtectedRoute allowedRoles={["CTO", "HR", "HR_Manager", "Head_of_Operations"]}><Report /></ProtectedRoute> },
      { path: "employees", Component: () => <ProtectedRoute allowedRoles={["CTO", "HR", "HR_Manager"]}><Employees /></ProtectedRoute> },
      { path: "job-posting", Component: () => <ProtectedRoute allowedRoles={["CTO", "HR", "HR_Manager", "Head_of_Operations"]}><JobPosting /></ProtectedRoute> },
      { path: "candidate", Component: () => <ProtectedRoute allowedRoles={["CTO", "HR", "HR_Manager", "Head_of_Operations"]}><Candidate /></ProtectedRoute> },
      { path: "projects", Component: () => <ProtectedRoute allowedRoles={["CTO", "Head_of_Operations"]}><ProjectList /></ProtectedRoute> },
      { path: "projects/create", Component: () => <ProtectedRoute allowedRoles={["CTO", "HR", "HR_Manager", "Head_of_Operations"]}><CreateProject /></ProtectedRoute> },
      { path: "projects/create/team", Component: () => <ProtectedRoute allowedRoles={["CTO", "HR", "HR_Manager", "Head_of_Operations"]}><CreateTeam /></ProtectedRoute> },
      { path: "projects/create/review", Component: () => <ProtectedRoute allowedRoles={["CTO", "HR", "HR_Manager", "Head_of_Operations"]}><ProjectReview /></ProtectedRoute> },
      { path: "projects/:projectId/create-team", Component: () => <ProtectedRoute allowedRoles={["CTO", "HR", "HR_Manager", "Head_of_Operations"]}><CreateTeam /></ProtectedRoute> },
      { path: "projects/:projectId/edit", Component: () => <ProtectedRoute allowedRoles={["CTO", "Head_of_Operations"]}><EditProject /></ProtectedRoute> },
      { path: "projects/:projectId", Component: () => <ProtectedRoute allowedRoles={["CTO", "HR", "HR_Manager", "Head_of_Operations"]}><ProjectDetail /></ProtectedRoute> },
      { path: "calendar", Component: CalendarPage },
      { path: "resume-parsing", Component: ResumeParsing },
      { path: "tasks", Component: () => <ProtectedRoute allowedRoles={["CTO", "Head_of_Operations", "HR", "HR_Manager", "Senior_Frontend", "Senior_Backend", "Junior_Frontend", "Junior_Backend", "DBA", "DBA_Intern", "Frontend_Intern", "Backend_Intern", "Intern"]}><MyTasks /></ProtectedRoute> },
      { path: "team", Component: () => <ProtectedRoute allowedRoles={["CTO", "Head_of_Operations", "HR", "HR_Manager", "Senior_Frontend", "Senior_Backend", "Junior_Frontend", "Junior_Backend", "DBA", "DBA_Intern", "Frontend_Intern", "Backend_Intern", "Intern"]}><TeamProgress /></ProtectedRoute> },
      { path: "history", Component: () => <ProtectedRoute allowedRoles={["CTO", "Head_of_Operations", "HR", "HR_Manager", "Senior_Frontend", "Senior_Backend", "Junior_Frontend", "Junior_Backend", "DBA", "DBA_Intern", "Frontend_Intern", "Backend_Intern", "Intern"]}><History /></ProtectedRoute> },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
    ],
  },
], {
  basename: getBasename(),
});