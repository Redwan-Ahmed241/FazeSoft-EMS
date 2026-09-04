// TypeScript interfaces matching app/schemas/notification.py in the FastAPI backend.

export interface NotificationCreate {
  user_id: string;
  title: string;
  message: string;
  type?: string;
}

export interface NotificationUpdate {
  is_read: boolean;
}

export interface NotificationOut {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}