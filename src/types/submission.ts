export interface SubmissionCreate {
  commit_link?: string | null;
  notes?: string | null;
}

export interface SubmissionOut {
  submission_id: string;
  task_id: string;
  submitted_by: string;
  submitted_by_name?: string | null;
  commit_link?: string | null;
  notes?: string | null;
  submitted_at: string;
  created_at: string;
}
