// TypeScript interfaces matching app/schemas/task.py in the FastAPI backend.

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface TaskOut {
  task_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string;
  assigned_to: string;
  assigned_by: string;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description: string;
  priority?: TaskPriority;
  assigned_to: string;
  deadline: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  deadline?: string;
}
