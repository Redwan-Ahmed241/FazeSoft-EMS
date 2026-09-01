// Clients API — matches app/api/v1/routers/client_router.py.
import { apiClient } from "../utils/apiClient";
import type { ClientCreate, ClientOut } from "../types/client";

export const clientsApi = {
  create: (data: ClientCreate) => apiClient.post<ClientOut>("/clients", data),
  list: () => apiClient.get<ClientOut[]>("/clients"),
  get: (id: string) => apiClient.get<ClientOut>(`/clients/${id}`),
};
