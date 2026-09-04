// Notifications API — matches app/api/v1/routers/notification_router.py.
import { apiClient } from "../utils/apiClient";
import type { NotificationCreate, NotificationOut, NotificationUpdate } from "../types/notification";

export const notificationApi = {
  list: () => apiClient.get<NotificationOut[]>("/notifications"),
  markAsRead: (id: number, payload: NotificationUpdate) =>
    apiClient.patch<NotificationOut>(`/notifications/${id}/read`, payload),
  create: (data: NotificationCreate) => apiClient.post<NotificationOut>("/notifications", data),
};