// API Types and Interfaces

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface Connector {
  id?: number;
  name: string;
  description?: string;
  connector_type: string;
  config: Record<string, any>;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ConnectorCreate {
  name: string;
  description?: string;
  connector_type: string;
  config: Record<string, any>;
}

export interface ConnectorUpdate {
  name?: string;
  description?: string;
  config?: Record<string, any>;
  is_active?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export interface SchemaResponse {
  tables?: string[];
  columns?: Record<string, any>;
  sample_data?: any[];
}

export interface Transformation {
  id?: number;
  name: string;
  description?: string;
  transformation_type: string;
  config: Record<string, any>;
  transformation_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TransformationCreate {
  name: string;
  description?: string;
  transformation_type: string;
  config: Record<string, any>;
  transformation_code?: string;
}

export interface TransformationUpdate {
  name?: string;
  description?: string;
  config?: Record<string, any>;
  transformation_code?: string;
}

export interface TransformationTestResult {
  success: boolean;
  output?: any;
  error?: string;
  execution_time?: number;
}

export interface Pipeline {
  id?: number;
  name: string;
  description?: string;
  config: Record<string, any>;
  is_active?: boolean;
  schedule?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineCreate {
  name: string;
  description?: string;
  config: Record<string, any>;
  schedule?: string;
}

export interface PipelineUpdate {
  name?: string;
  description?: string;
  config?: Record<string, any>;
  is_active?: boolean;
  schedule?: string;
}

export interface PipelineExecutionRequest {
  pipeline_id: number;
  parameters?: Record<string, any>;
}

export interface PipelineExecutionResult {
  execution_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface PipelineStatus {
  execution_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  result?: any;
  error?: string;
  started_at?: string;
  completed_at?: string;
  duration?: number;
}

export interface APIError {
  message: string;
  status?: number;
  details?: any;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  success: boolean;
}
