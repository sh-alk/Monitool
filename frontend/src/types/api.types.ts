/**
 * API Types and Interfaces
 */

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Technician {
  id: string;
  nfc_card_uid: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  status: string;
  created_at: string;
}

export interface Toolbox {
  id: string;
  name: string;
  zone?: string;
  location_description?: string;
  raspberry_pi_serial?: string;
  status: string;
  total_items: number;
  image_url?: string;
  created_at: string;
}

export interface AccessLog {
  id: string;
  toolbox_id: string;
  technician_id: string;
  action_type: string;
  timestamp: string;
  condition_image_url?: string;
  items_before?: number;
  items_after?: number;
  items_missing: number;
  missing_items_list?: string;
  notes?: string;
}

export interface DashboardStats {
  total_checkouts_today: number;
  missing_items: number;
  active_technicians: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
}
