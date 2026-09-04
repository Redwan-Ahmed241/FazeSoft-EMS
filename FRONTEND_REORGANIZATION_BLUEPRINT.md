# FazeSoft EMS — Frontend Reorganization Blueprint

Scope: reorganize the **frontend** (`FazeSoft-EMS`) into the agreed structure, wire it to the
existing **FastAPI backend** (`FazeSoft-EMS-Backend`), and document every moved/created file.
No backend files were changed. Verified with `npm run build` (Rollup resolves all imports; build
passes, same output size class as baseline).

---

## 1. Final folder structures

### 1.1 Backend (unchanged — already matches the target anatomy)

```
FazeSoft-EMS-Backend/
├── app/
│   ├── main.py                          # FastAPI entry (CORS, router registration, health)
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py              # api_v1_router aggregator (auth, candidates, interviews,
│   │       │                            #   notifications, resume, project)
│   │       └── routers/
│   │           ├── __init__.py          # router exports (+ team_router, project_team_router)
│   │           ├── auth_router.py       # /auth/signup | /login | /create-employee | /me
│   │           ├── candidate_router.py  # /candidates CRUD + PATCH /{id}/status
│   │           ├── interview_router.py  # /interviews CRUD (hr-only create/delete)
│   │           ├── notification_router.py # /notifications list, PATCH /{id}/read, create
│   │           ├── project_router.py    # /projects list, get, create (admin permission)
│   │           ├── resume_router.py     # POST /resumes/parse (multipart)
│   │           └── team_router.py
│   ├── core/
│   │   ├── auth.py                      # get_current_user, require_role_and_permission
│   │   ├── config.py                    # pydantic-settings Settings
│   │   └── database.py
│   ├── models/                          # candidate, interview, notification, project,
│   │   │                                #   role_permission, team, user (+ __init__.py)
│   ├── schemas/                         # candidate, interview, notification, project,
│   │   │                                #   team, user (+ __init__.py)
│   └── services/                        # auth, candidate, interview, notification,
│       │                                #   project, resume_parser, team (+ __init__.py)
├── postman/                             # collection + local/production environments
├── scripts/                             # db helpers, migrations, seed
├── requirements.txt
└── SETUP.md / API_ENDPOINTS.md / POSTMAN_API_GUIDE.md
```

### 1.2 Frontend (final — this repo)

```
FazeSoft-EMS/
├── public…  (none)
└── src/
    ├── api/
    │   ├── client.ts                    # NEW — token helpers + re-export of shared client
    │   ├── auth.ts                      # NEW — login/signup/createEmployee/me
    │   ├── candidates.ts                # NEW — CRUD + status update
    │   ├── interviews.ts                # NEW — CRUD
    │   ├── notifications.ts             # NEW — list / mark-read / create
    │   ├── projects.ts                  # NEW — list / get / create
    │   └── resumes.ts                   # NEW — multipart resume parse
    ├── assets/
    │   └── svg-nubmbundb.ts             # MOVED from src/imports/ (icon SVG path data)
    ├── components/
    │   ├── common/
    │   │   ├── ui/                      # MOVED from src/components/ui (49 shadcn files, unmodified)
    │   │   ├── Frame35.tsx              # MOVED from src/imports/
    │   │   ├── ImageWithFallback.tsx    # MOVED from src/components/figma/
    │   │   └── ProtectedRoute.tsx       # MOVED from src/components/
    │   └── layout/
    │       └── Layout.tsx               # MOVED from src/components/ (app shell: navbar/sidebar)
    ├── context/                         # AuthContext, PortalAuthContext, PortalContext,
    │   │                                #   ThemeContext (kept) + SharedContext (MOVED from components/)
    ├── guidelines/                      # kept (docs)
    ├── hooks/
    │   └── useAuth.ts                   # NEW — re-exports useAuth from AuthContext
    ├── pages/
    │   ├── auth/                        # login.tsx, signup.tsx
    │   ├── candidates/                  # Candidate.tsx, ResumeParsing.tsx
    │   ├── interviews/                  # CalendarPage.tsx
    │   ├── notifications/               # (empty — feature scaffold; API ready in src/api/notifications.ts)
    │   ├── projects/                    # JobPosting.tsx
    │   ├── dashboard/                   # Dashboard.tsx, Report.tsx, PerformanceTracking.tsx,
    │   │                                #   LeaveManagement.tsx
    │   ├── employees/                   # Employees.tsx, EmployeeDirectory.tsx, EmployeeDashboard.tsx,
    │   │                                #   MyTasks.tsx, TeamProgress.tsx, History.tsx
    │   ├── career/                      # PortalCareer.tsx (+ PortalCareer.css)
    │   ├── profile/                     # Profile.tsx
    │   └── settings/                    # Settings.tsx
    ├── styles/globals.css               # kept
    ├── types/
    │   ├── auth.ts                      # NEW — matches schemas/user.py
    │   ├── candidate.ts                 # NEW — matches schemas/candidate.py
    │   ├── interview.ts                 # NEW — matches schemas/interview.py
    │   ├── notification.ts              # NEW — matches schemas/notification.py
    │   └── project.ts                   # NEW — matches schemas/project.py
    ├── utils/
    │   ├── apiClient.ts                 # kept — single FastAPI HTTP client (token + 401 handling)
    │   ├── getInitials.ts               # kept
    │   ├── supabase.ts                  # kept
    │   └── taskUtils.ts                 # MOVED from src/components/employee/
    ├── App.tsx                          # kept (unchanged)
    ├── routes.tsx                       # updated imports
    ├── main.tsx                         # kept (unchanged)
    └── index.css                        # kept (unchanged)
```

Deleted: `src/utils/api.ts` (json-server based mock — fully replaced by `src/api/candidates.ts`).

---

## 2. Backend reference (start point, as requested)

No backend edits. These are the files the frontend now talks to.

### 2.1 `app/main.py` (summary)

- Mounts `api_v1_router` under `/api` (→ `/api/v1/...`).
- Adds backward-compatible mounts of every domain router directly under `/api` (→ `/api/auth`, `/api/candidates`, `/api/interviews`, `/api/notifications`, `/api/resumes`, `/api/projects`). Both paths work; the frontend client uses base `VITE_API_URL` = `http://localhost:8000/api` + those domain paths.
- CORS allows `settings.CORS_ORIGINS + [settings.FRONTEND_URL]` with `credentials: true`.

### 2.2 `app/core/config.py` (summary)

`Settings` via `pydantic-settings`, `.env` loaded, keys used by the client:
`FRONTEND_URL` (default `http://localhost:5173`), `VERSION`, `PROJECT_NAME`, CORS origins —
`http://localhost:5173`, `3000`, `3001`, Vercel apps.

### 2.3 Models ↔ Schemas ↔ Services (what the frontend types mirror)

| Domain     | Model           | Schemas                       | Service                | Router (endpoints)                                          |
|------------|-----------------|-------------------------------|------------------------|-------------------------------------------------------------|
| Auth       | `User`          | `UserCreate/Login/Out`, `Token`, `EmployeeCreate` | `AuthService` | `/auth/signup`, `/auth/login`, `/auth/create-employee`, `/auth/me` |
| Candidate  | `Candidate`     | `CandidateCreate/Update/StatusUpdate/Out` | `CandidateService` | `/candidates` GET/POST, `/{id}` GET/PUT/DELETE, `/{id}/status` PATCH |
| Interview  | `Interview`     | `InterviewCreate/Out`         | `InterviewService`     | `/interviews` GET/POST, `/{id}` GET/DELETE                  |
| Notification| `Notification` | `NotificationCreate/Out/Update` | `NotificationService` | `/notifications` GET/POST, `/{id}/read` PATCH              |
| Project    | `Project`       | `ProjectCreate/Out/ListOut`   | `ProjectService`       | `/projects` GET/POST, `/{project_id}` GET                   |
| Resume     | —               | `UploadFile` → parsed dict    | `resume_parser`        | `/resumes/parse` POST (multipart)                           |
| Team       | `Team`          | `Team` schemas                | `TeamService`          | `/teams`, `/projects/{id}/team`                             |

---

## 3. Frontend — moved files (updated content / corrected imports)

Files listed as the *minimum changed surface*; the body of each page was not rewritten.

### 3.1 `src/components/layout/Layout.tsx` (from `src/components/Layout.tsx`)

```tsx
import { useState } from "react";
import { useSharedContext } from "../../context/SharedContext";
import { Link, Outlet, useLocation } from "react-router";
import InitialsAvatar from "../common/ui/InitialsAvatar";
import { Toaster } from "sonner";
import Frame35 from "../common/Frame35";
import { useAuth } from "../../context/AuthContext";
```

### 3.2 `src/components/common/ProtectedRoute.tsx` (from `src/components/ProtectedRoute.tsx`)

```tsx
import React from 'react';
import { Navigate } from 'react-router';
import { useAuth, UserRole } from '../../context/AuthContext';
```

### 3.3 `src/components/common/Frame35.tsx` (from `src/imports/Frame35.tsx`)

```tsx
import svgPaths from "../../assets/svg-nubmbundb";
```

### 3.4 `src/components/common/ImageWithFallback.tsx` (from `src/components/figma/ImageWithFallback.tsx`)

No relative imports — moved byte-for-byte.

### 3.5 `src/components/common/ui/*` (49 files, from `src/components/ui/*`)

Moved together so their **internal** relative imports (`./utils`, `./toggle`, `./use-mobile`,
`./button`, …) are untouched. Only `InitialsAvatar.tsx` changed:

```tsx
import { getInitials, getAvatarColor } from "../../../utils/getInitials";   // was ../../utils/getInitials
```

### 3.6 `src/context/SharedContext.tsx` (from `src/components/SharedContext.tsx`)

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { candidateApi } from "../api/candidates";
import { getToken } from "../api/client";
import type { CandidateOut as CandidateApiData } from "../types/candidate";
import { authApi } from "../api/auth";
import { useAuth } from "./AuthContext";
```

The old inline `fetch(.../auth/create-employee)` block is replaced by:

```tsx
try {
  await authApi.createEmployee({
    email: emp.email,
    password: rawPassword || 'password123',
    full_name: emp.name,
    job_title: emp.jobTitle,
  });
} catch (err: unknown) {
  throw new Error(err instanceof Error ? err.message : 'Failed to create employee login account.');
}
```

All `import("../utils/supabase")` dynamic imports resolve unchanged from `context/`.

### 3.7 `src/utils/taskUtils.ts` (from `src/components/employee/taskUtils.ts`)

```ts
import type { TaskData, TaskPriority, TaskStatus } from "../context/SharedContext";
```

### 3.8 `src/assets/svg-nubmbundb.ts` (from `src/imports/svg-nubmbundb.ts`)

No imports — moved byte-for-byte.

### 3.9 Pages

| New path | Corrected imports |
|---|---|
| `pages/auth/login.tsx` | `useAuth` from `../../context/AuthContext` (was `../context/AuthContext`) |
| `pages/auth/signup.tsx` | `useAuth, type UserRole` from `../../context/AuthContext` |
| `pages/candidates/Candidate.tsx` | `useSharedContext, type CandidateData` from `../../context/SharedContext`; `InitialsAvatar` from `../../components/common/ui/InitialsAvatar` |
| `pages/candidates/ResumeParsing.tsx` | `useSharedContext/CandidateData`, `useAuth`, `usePortal` from `../../context/…`; new `import { parseResume } from "../../api/resumes";`. Inline `fetch + FormData` helper replaced with `parseResume(ParsedResumeData)` wrapper |
| `pages/interviews/CalendarPage.tsx` | `useSharedContext, type InterviewData` + `useAuth` from `../../context/…`; `InitialsAvatar` from `../../components/common/ui/InitialsAvatar` |
| `pages/projects/JobPosting.tsx` | `useSharedContext, type JobPost` from `../../context/SharedContext` |
| `pages/dashboard/Dashboard.tsx` | `useAuth`, `useSharedContext` from `../../context/…`; `InitialsAvatar` from `../../components/common/ui/InitialsAvatar`; `EmployeeDashboard` from `../employees/EmployeeDashboard` |
| `pages/dashboard/Report.tsx` | `useSharedContext` from `../../context/SharedContext` |
| `pages/dashboard/PerformanceTracking.tsx` | all `'./ui/…'` → `'../../components/common/ui/…'` |
| `pages/dashboard/LeaveManagement.tsx` | all `'./ui/…'` → `'../../components/common/ui/…'` |
| `pages/employees/Employees.tsx` | `useAuth`, `useSharedContext` from `../../context/…`; `supabase` from `../../utils/supabase`; `InitialsAvatar` from `../../components/common/ui/InitialsAvatar` |
| `pages/employees/EmployeeDirectory.tsx` | all `'./ui/…'` → `'../../components/common/ui/…'` |
| `pages/employees/EmployeeDashboard.tsx` | `useSharedContext` from `../../context/SharedContext`; `InitialsAvatar`/`Progress` from `../../components/common/ui/…`; `… } from "../../utils/taskUtils"` |
| `pages/employees/MyTasks.tsx` | `useSharedContext, TaskStatus` from `../../context/SharedContext`; `Progress` from `../../components/common/ui/progress`; `… } from "../../utils/taskUtils"` |
| `pages/employees/TeamProgress.tsx` | `useSharedContext` from `../../context/SharedContext`; `InitialsAvatar`/`Progress` from `../../components/common/ui/…` |
| `pages/employees/History.tsx` | `useSharedContext` from `../../context/SharedContext`; `formatDate` from `../../utils/taskUtils` |
| `pages/career/PortalCareer.tsx` (+ `.css`) | `usePortalAuth`, `usePortal` from `../../context/…`; `./PortalCareer.css` unchanged |
| `pages/profile/Profile.tsx` | `useAuth`, `useSharedContext` from `../../context/…`; `InitialsAvatar` from `../../components/common/ui/InitialsAvatar` |
| `pages/settings/Settings.tsx` | `useTheme` from `../../context/ThemeContext` |

### 3.10 `src/routes.tsx`

```tsx
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
```

Route tree unchanged.

---

## 4. Frontend — created files

### 4.1 `src/api/client.ts`

```ts
// API layer — token helpers shared by all src/api modules.
// The HTTP client lives in src/utils/apiClient.ts (single FastAPI client).
import { apiClient } from "../utils/apiClient";

export { apiClient };

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}
```

### 4.2 `src/api/auth.ts` → `auth_router.py`

```ts
import { apiClient } from "../utils/apiClient";
import type { EmployeeCreate, Token, UserCreate, UserLogin, UserOut } from "../types/auth";

export const authApi = {
  login: (payload: UserLogin) => apiClient.post<Token>("/auth/login", payload),
  signup: (payload: UserCreate) => apiClient.post<Token>("/auth/signup", payload),
  createEmployee: (payload: EmployeeCreate) => apiClient.post<UserOut>("/auth/create-employee", payload),
  me: () => apiClient.get<UserOut>("/auth/me"),
};
```

### 4.3 `src/api/candidates.ts` → `candidate_router.py`

```ts
import { apiClient } from "../utils/apiClient";
import type { CandidateCreate, CandidateOut, CandidateUpdate } from "../types/candidate";

export const candidateApi = {
  list: () => apiClient.get<CandidateOut[]>("/candidates"),
  get: (id: number) => apiClient.get<CandidateOut>(`/candidates/${id}`),
  create: (data: CandidateCreate) => apiClient.post<CandidateOut>("/candidates", data),
  update: (id: number, data: CandidateUpdate) => apiClient.put<CandidateOut>(`/candidates/${id}`, data),
  updateStatus: (id: number, status: string) =>
    apiClient.patch<CandidateOut>(`/candidates/${id}/status`, { status }),
  delete: (id: number) => apiClient.delete<void>(`/candidates/${id}`),
};
```

> API surface is drop-in compatible with the module it replaces (`utils/api.ts`): same method names,
> same snake_case payloads — `SharedContext` needed no logic changes.

### 4.4 `src/api/interviews.ts` → `interview_router.py`

```ts
import { apiClient } from "../utils/apiClient";
import type { InterviewCreate, InterviewOut } from "../types/interview";

export const interviewApi = {
  list: () => apiClient.get<InterviewOut[]>("/interviews"),
  get: (id: number) => apiClient.get<InterviewOut>(`/interviews/${id}`),
  create: (data: InterviewCreate) => apiClient.post<InterviewOut>("/interviews", data),
  delete: (id: number) => apiClient.delete<void>(`/interviews/${id}`),
};
```

### 4.5 `src/api/notifications.ts` → `notification_router.py`

```ts
import { apiClient } from "../utils/apiClient";
import type { NotificationCreate, NotificationOut, NotificationUpdate } from "../types/notification";

export const notificationApi = {
  list: () => apiClient.get<NotificationOut[]>("/notifications"),
  markAsRead: (id: number, payload: NotificationUpdate) =>
    apiClient.patch<NotificationOut>(`/notifications/${id}/read`, payload),
  create: (data: NotificationCreate) => apiClient.post<NotificationOut>("/notifications", data),
};
```

### 4.6 `src/api/projects.ts` → `project_router.py`

```ts
import { apiClient } from "../utils/apiClient";
import type { ProjectCreate, ProjectListOut, ProjectOut } from "../types/project";

export const projectApi = {
  create: (data: ProjectCreate) => apiClient.post<ProjectOut>("/projects", data),
  list: () => apiClient.get<ProjectListOut[]>("/projects"),
  get: (id: string) => apiClient.get<ProjectOut>(`/projects/${id}`),
};
```

### 4.7 `src/api/resumes.ts` → `resume_router.py`

```ts
// Resume parsing API — matches app/api/v1/routers/resume_router.py.
// Uses multipart/form-data upload (not JSON), so it talks to the backend directly.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function parseResume<T = Record<string, unknown>>(file: File): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/resumes/parse`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(errorData?.detail || `Server error: ${response.status}`);
  }

  return (await response.json()) as T;
}
```

### 4.8 `src/hooks/useAuth.ts`

```ts
// Custom hooks — organized per the reorganized folder structure.
// useAuth re-exports the canonical hook from the AuthContext provider.
export { useAuth } from "../context/AuthContext";
```

---

## 5. Frontend — created types (mirror backend schemas)

### 5.1 `src/types/auth.ts` — `schemas/user.py`

```ts
export type UserRole = "hr" | "candidate" | "admin" | "employee";

export interface UserLogin { email: string; password: string; }
export interface UserCreate { email: string; password: string; full_name?: string | null; }
export interface EmployeeCreate { email: string; password: string; full_name?: string | null; job_title?: string | null; }

export interface UserOut {
  id: string; email: string; full_name: string | null; role: string;
  phone: string | null; location: string | null; job_title: string | null;
  bio: string | null; avatar: string | null; is_active: boolean; created_at: string;
}

export interface Token { access_token: string; token_type: string; user: UserOut; }
```

### 5.2 `src/types/candidate.ts` — `schemas/candidate.py`

```ts
export type CandidateStatus =
  | "Applied" | "Screened" | "Interview" | "Offer" | "Hired" | "Approved" | "Rejected";

export interface CandidateCreate {
  name: string; email: string; phone?: string | null; position: string;
  ai_score?: number; experience?: string | null; skills?: string[];
  education?: Record<string, unknown>[] | null; certifications?: string[] | null;
  status?: string; avatar?: string | null; applied_date?: string | null;
  match_reasons?: string[] | null;
}
export interface CandidateUpdate {
  name?: string | null; email?: string | null; phone?: string | null; position?: string | null;
  ai_score?: number | null; experience?: string | null; skills?: string[] | null;
  education?: Record<string, unknown>[] | null; certifications?: string[] | null;
  avatar?: string | null; match_reasons?: string[] | null;
}
export interface CandidateStatusUpdate { status: string; }
export interface CandidateOut {
  id: number; name: string; email: string; phone: string | null; position: string;
  ai_score: number; experience: string | null; skills: string[];
  education: Record<string, unknown>[] | null; certifications: string[] | null;
  status: string; avatar: string | null; applied_date: string;
  match_reasons: string[] | null; created_at: string; updated_at: string;
}
```

### 5.3 `src/types/interview.ts` — `schemas/interview.py`

```ts
export interface InterviewCreate {
  candidate_name: string; candidate_email: string; position: string;
  date: string; time: string; duration: string; type: string; interviewer: string;
  meeting_link?: string | null; avatar?: string | null;
}
export interface InterviewOut {
  id: number; candidate_name: string; candidate_email: string; position: string;
  date: string; time: string; duration: string; type: string; interviewer: string;
  meeting_link: string | null; avatar: string | null; created_at: string;
}
```

### 5.4 `src/types/notification.ts` — `schemas/notification.py`

```ts
export interface NotificationCreate { user_id: string; title: string; message: string; type?: string; }
export interface NotificationUpdate { is_read: boolean; }
export interface NotificationOut {
  id: number; user_id: string; title: string; message: string; type: string;
  is_read: boolean; created_at: string;
}
```

### 5.5 `src/types/project.ts` — `schemas/project.py`

```ts
export interface ProjectCreate {
  project_name: string; project_code: string; description: string;
  client_id: string; start_date: string; end_date: string;
}
export interface ProjectOut {
  project_id: string; project_name: string; project_code: string; description: string;
  status: string; manager_id: string; client_id: string; start_date: string;
  end_date: string; created_at: string; updated_at: string;
}
export interface ProjectListOut {
  project_id: string; project_name: string; project_code: string; status: string; start_date: string;
}
```

---

## 6. Connection notes

- **HTTP client**: `src/utils/apiClient.ts` (kept) is the only place raw `fetch` wrappers live for
  JSON calls. Base URL: `VITE_API_URL || http://localhost:8000/api`. Attaches
  `Authorization: Bearer <token>` from `localStorage['token']` (same key AuthContext writes), handles
  401 → redirect to `/`.
- **Auth flow** (`context/AuthContext.tsx`): backend login now goes through `authApi.login()`
  (JWT stored to `localStorage['token']`), keeps the Supabase-first / localStorage-fallback logic.
- **SharedContext** uses `candidateApi` (FastAPI) on the non-Supabase path and
  `authApi.createEmployee` for HR account creation; Supabase paths unchanged.
- **`fetch()` policy**: after this refactor, `fetch()` appears only in `src/api/*` and
  `src/utils/apiClient.ts` — never in components/pages.
- **Not wired yet (by design)**: `interviewApi`, `notificationApi`, `projectApi` are ready but not yet
  consumed by pages (no existing Interviews/Notifications/Projects pages were present). `pages/notifications/`
  is an empty scaffold alongside them.

## 7. Verification

`npm run build` → `✓ 2712 modules transformed`, `✓ built in ~22s` (baseline: 2708 modules).
All `git mv`-renamed files preserve history; no type errors surface (project has no `tsc` script;
Vite/ESBuild strips types, Rollup verified every import resolves).