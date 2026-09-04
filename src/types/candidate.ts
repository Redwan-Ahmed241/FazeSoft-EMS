// TypeScript interfaces matching app/schemas/candidate.py in the FastAPI backend.

export type CandidateStatus =
  | "Applied"
  | "Screened"
  | "Interview"
  | "Offer"
  | "Hired"
  | "Approved"
  | "Rejected";

export interface CandidateCreate {
  name: string;
  email: string;
  phone?: string | null;
  position: string;
  ai_score?: number;
  experience?: string | null;
  skills?: string[];
  education?: Record<string, unknown>[] | null;
  certifications?: string[] | null;
  status?: string;
  avatar?: string | null;
  applied_date?: string | null;
  match_reasons?: string[] | null;
}

export interface CandidateUpdate {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  ai_score?: number | null;
  experience?: string | null;
  skills?: string[] | null;
  education?: Record<string, unknown>[] | null;
  certifications?: string[] | null;
  avatar?: string | null;
  match_reasons?: string[] | null;
}

export interface CandidateStatusUpdate {
  status: string;
}

export interface CandidateOut {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  ai_score: number;
  experience: string | null;
  skills: string[];
  education: Record<string, unknown>[] | null;
  certifications: string[] | null;
  status: string;
  avatar: string | null;
  applied_date: string;
  match_reasons: string[] | null;
  created_at: string;
  updated_at: string;
}