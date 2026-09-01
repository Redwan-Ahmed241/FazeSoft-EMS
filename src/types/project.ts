// TypeScript interfaces matching app/schemas/project.py in the FastAPI backend.

export interface ProjectFormData {
  projectName: string;
  projectCode: string;
  description: string;
  clientId: string;
  startDate: string;
  endDate: string;
}

export interface ProjectCreate {
  project_name: string;
  project_code: string;
  description: string;
  client_id: string;
  start_date: string;
  end_date: string;
}

export interface ProjectOut {
  project_id: string;
  project_name: string;
  project_code: string;
  description: string;
  status: string;
  manager_id: string;
  client_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectListOut {
  project_id: string;
  project_name: string;
  project_code: string;
  status: string;
  start_date: string;
}