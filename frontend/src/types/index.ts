export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  role?: 'admin' | 'developer' | 'designer' | 'executor' | 'executive' | 'viewer';
  created_at?: string;
}

export interface Pipeline {
  id: number;
  name: string;
  description?: string;
  source_config: Record<string, any>;
  destination_config: Record<string, any>;
  transformation_config?: Record<string, any>;
  schedule?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Connector {
  id: number;
  name: string;
  type: string;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface DashboardStats {
  pipelines: {
    total: number;
    active: number;
    running: number;
    failed: number;
  };
  connectors: {
    total: number;
    active: number;
  };
  data_processed: {
    today: number;
    this_week: number;
    this_month: number;
  };
}