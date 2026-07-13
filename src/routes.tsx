import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Report } from "./components/Report";
import { Employees } from "./components/Employees";
import { JobPosting } from "./components/JobPosting";
import { Candidate } from "./components/Candidate";
import { CalendarPage } from "./components/CalendarPage";
import { ResumeParsing } from "./components/ResumeParsing";
import { Profile } from "./components/Profile";
import { Settings } from "./components/Settings";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SharedProvider } from "./components/SharedContext";
import Login from "./components/login";
import Signup from "./components/signup";
import { PortalCareer } from "./components/PortalCareer";
import { PortalAuthProvider } from "./context/PortalAuthContext";
import { PortalProvider } from "./context/PortalContext";

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
      { path: "calendar", Component: CalendarPage },
      { path: "resume-parsing", Component: ResumeParsing },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
    ],
  },
]);