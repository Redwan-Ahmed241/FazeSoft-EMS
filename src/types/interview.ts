// TypeScript interfaces matching app/schemas/interview.py in the FastAPI backend.

export interface InterviewCreate {
  candidate_name: string;
  candidate_email: string;
  position: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  interviewer: string;
  meeting_link?: string | null;
  avatar?: string | null;
}

export interface InterviewOut {
  id: number;
  candidate_name: string;
  candidate_email: string;
  position: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  interviewer: string;
  meeting_link: string | null;
  avatar: string | null;
  created_at: string;
}