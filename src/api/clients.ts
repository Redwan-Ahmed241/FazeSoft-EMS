// Clients API — matches app/api/v1/routers/client_router.py.
import { apiClient } from "../utils/apiClient";
import type { ClientCreate, ClientOut } from "../types/client";

import { supabase } from "../utils/supabase";

export const clientsApi = {
  create: async (data: ClientCreate): Promise<ClientOut> => {
    try {
      return await apiClient.post<ClientOut>("/clients", data);
    } catch (err) {
      const { data: created, error } = await supabase.from("client").insert([data]).select().single();
      if (!error && created) return created as ClientOut;
      const { data: createdPlural, error: errorPlural } = await supabase.from("clients").insert([data]).select().single();
      if (!errorPlural && createdPlural) return createdPlural as ClientOut;
      throw err;
    }
  },
  list: async (): Promise<ClientOut[]> => {
    try {
      const res = await apiClient.get<ClientOut[]>("/clients");
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (e) {
      console.warn("Backend /clients request failed, trying Supabase:", e);
    }
    try {
      const { data, error } = await supabase.from("client").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data as ClientOut[];
      const { data: dataPlural, error: errorPlural } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (!errorPlural && dataPlural && dataPlural.length > 0) return dataPlural as ClientOut[];
    } catch (sbErr) {
      console.warn("Supabase client fetch failed:", sbErr);
    }
    return [];
  },
  get: async (id: string): Promise<ClientOut> => {
    try {
      return await apiClient.get<ClientOut>(`/clients/${id}`);
    } catch (e) {
      const { data, error } = await supabase.from("client").select("*").eq("client_id", id).single();
      if (!error && data) return data as ClientOut;
      const { data: dataPlural, error: errorPlural } = await supabase.from("clients").select("*").eq("client_id", id).single();
      if (!errorPlural && dataPlural) return dataPlural as ClientOut;
      throw e;
    }
  },
};
