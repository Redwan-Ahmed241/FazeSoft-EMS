// TypeScript interfaces matching backend models for Clients.

export interface ClientCreate {
  client_name: string;
  email: string;
  phone: string;
  company_name: string;
  address: string;
}

export interface ClientOut {
  client_id: string;
  client_name: string;
  email: string;
  phone: string;
  company_name: string;
  address: string;
  created_at: string;
  updated_at: string;
}
