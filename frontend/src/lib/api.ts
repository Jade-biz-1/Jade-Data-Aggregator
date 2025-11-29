import axios from 'axios';
import { Pipeline, Connector, User } from '@/types';
import {
  DashboardStats,
  DashboardRecentActivity,
  DashboardTimeSeriesPoint
} from '@/types';
import { Transformation, TransformationMetricsResponse } from '@/types/transformation';
import {
  SchemaDefinition,
  SchemaMappingCreateResponse,
  SchemaFieldMapping,
  SchemaMappingValidationResult,
  SchemaMappingCodeResponse
} from '@/types/schema';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get the token from cookies
    if (typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
        window.location.href = '/auth/login';
      }
    } else if (error.response?.status === 403) {
      // Handle forbidden - check if user is inactive
      const data = error.response?.data;
      if (data?.is_active === false) {
        // Redirect to inactive account page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/account-inactive')) {
          window.location.href = '/account-inactive';
        }
      }
    }
    return Promise.reject(error);
  }
);

interface ApiError {
  detail: string;
}

interface CreateSchemaMappingPayload {
  name: string;
  source_schema_id: number;
  destination_schema_id: number;
  auto_generate?: boolean;
}

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  responseType?: 'json' | 'blob' | 'text';
}

class ApiClient {
  public async request<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}${searchParams.toString()}`;
    }

    const { params, responseType, ...fetchOptions } = options || {};

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...(fetchOptions?.headers || {}),
      },
      ...fetchOptions,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    // Handle responses with no content (e.g., DELETE requests)
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return {} as T;
    }

    if (responseType === 'blob') {
      return response.blob() as unknown as T;
    }
    if (responseType === 'text') {
      return response.text() as unknown as T;
    }

    return response.json();
  }

  public async fetch<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, options);
  }

  public async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, options);
  }

  public async post<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  private getAuthHeaders(): Record<string, string> {
    // Get the token from cookies
    if (typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (token) {
        return {
          'Authorization': `Bearer ${token}`
        };
      }
    }
    return {};
  }

  // Auth methods
  async login(username: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  async register(userData: { username: string; email: string; password: string }): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // User methods
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Pipeline methods
  async getPipelines(): Promise<Pipeline[]> {
    return this.request<Pipeline[]>('/pipelines');
  }

  async createPipeline(pipelineData: Omit<Pipeline, 'id' | 'created_at' | 'updated_at'>): Promise<Pipeline> {
    return this.request<Pipeline>('/pipelines', {
      method: 'POST',
      body: JSON.stringify(pipelineData),
    });
  }

  async getPipeline(id: number): Promise<Pipeline> {
    return this.request<Pipeline>(`/pipelines/${id}`);
  }

  async updatePipeline(id: number, pipelineData: Partial<Pipeline>): Promise<Pipeline> {
    return this.request<Pipeline>(`/pipelines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pipelineData),
    });
  }

  async deletePipeline(id: number): Promise<void> {
    await this.request(`/pipelines/${id}`, {
      method: 'DELETE',
    });
  }

  // Connector methods
  async getConnectors(): Promise<Connector[]> {
    return this.request<Connector[]>('/connectors');
  }

  async createConnector(connectorData: Omit<Connector, 'id' | 'created_at' | 'updated_at'>): Promise<Connector> {
    return this.request<Connector>('/connectors', {
      method: 'POST',
      body: JSON.stringify(connectorData),
    });
  }

  async getConnector(id: number): Promise<Connector> {
    return this.request<Connector>(`/connectors/${id}`);
  }

  async updateConnector(id: number, connectorData: Partial<Connector>): Promise<Connector> {
    return this.request<Connector>(`/connectors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(connectorData),
    });
  }

  async deleteConnector(id: number): Promise<void> {
    await this.request(`/connectors/${id}`, {
      method: 'DELETE',
    });
  }

  // Transformation methods
  async getTransformations(): Promise<Transformation[]> {
    return this.request<Transformation[]>('/transformations');
  }

  async createTransformation(transformationData: Omit<Transformation, 'id' | 'created_at' | 'updated_at'>): Promise<Transformation> {
    return this.request<Transformation>('/transformations', {
      method: 'POST',
      body: JSON.stringify(transformationData),
    });
  }

  async getTransformation(id: number): Promise<Transformation> {
    return this.request<Transformation>(`/transformations/${id}`);
  }

  async updateTransformation(id: number, transformationData: Partial<Transformation>): Promise<Transformation> {
    return this.request<Transformation>(`/transformations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformationData),
    });
  }

  async deleteTransformation(id: number): Promise<void> {
    await this.request(`/transformations/${id}`, {
      method: 'DELETE',
    });
  }

  async testTransformation(id: number, payload: Record<string, unknown>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/transformations/${id}/test`, {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    });
  }

  async getTransformationMetrics(): Promise<TransformationMetricsResponse> {
    return this.request<TransformationMetricsResponse>('/transformations/metrics');
  }

  // Schema methods
  async getSchemas(): Promise<SchemaDefinition[]> {
    const response = await this.request<{ schemas: SchemaDefinition[] }>('/schema/schemas');
    return response.schemas || [];
  }

  async getSchema(schemaId: number): Promise<SchemaDefinition> {
    return this.request<SchemaDefinition>(`/schema/schemas/${schemaId}`);
  }

  async createSchemaMapping(payload: CreateSchemaMappingPayload): Promise<SchemaMappingCreateResponse> {
    return this.request<SchemaMappingCreateResponse>('/schema/mappings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateSchemaMappingFields(mappingId: number, fieldMappings: SchemaFieldMapping[]): Promise<{ message: string; field_count: number }> {
    return this.request<{ message: string; field_count: number }>(`/schema/mappings/${mappingId}/fields`, {
      method: 'PUT',
      body: JSON.stringify(fieldMappings),
    });
  }

  async validateSchemaMapping(mappingId: number): Promise<SchemaMappingValidationResult> {
    return this.request<SchemaMappingValidationResult>(`/schema/mappings/${mappingId}/validate`, {
      method: 'POST',
    });
  }

  async generateSchemaMappingCode(mappingId: number, language: 'python' | 'sql' = 'python'): Promise<SchemaMappingCodeResponse> {
    return this.request<SchemaMappingCodeResponse>(`/schema/mappings/${mappingId}/generate-code?language=${language}`, {
      method: 'POST',
    });
  }

  // Pipeline Execution methods - NEW
  async executePipeline(
    pipelineId: number,
    executionConfig?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.request(`/pipelines/${pipelineId}/execute`, {
      method: 'POST',
      body: JSON.stringify({
        pipeline_id: pipelineId,
        execution_config: executionConfig || {},
        triggered_by: 'manual'
      }),
    });
  }

  async getPipelineRuns(pipelineId: number): Promise<Record<string, unknown>[]> {
    return this.request(`/pipelines/${pipelineId}/runs`);
  }

  async getPipelineRun(runId: number): Promise<Record<string, unknown>> {
    return this.request(`/pipelines/runs/${runId}`);
  }

  async cancelPipelineRun(runId: number): Promise<Record<string, unknown>> {
    return this.request(`/pipelines/runs/${runId}/cancel`, {
      method: 'POST',
    });
  }

  async getAllRecentRuns(): Promise<Record<string, unknown>[]> {
    return this.request(`/pipelines/runs`);
  }

  // Monitoring methods - Now using real API endpoints
  async getPipelineStats(): Promise<Record<string, unknown>> {
    return this.request('/monitoring/pipeline-stats');
  }

  async getRecentAlerts(): Promise<Record<string, unknown>[]> {
    return this.request('/monitoring/alerts');
  }

  async getPipelinePerformance(): Promise<Record<string, unknown>[]> {
    return this.request('/monitoring/pipeline-performance');
  }

  // Analytics methods - Now using real API endpoints
  async getAnalyticsData(): Promise<Record<string, unknown>> {
    return this.request('/analytics/data');
  }

  async getTimeSeriesData(): Promise<DashboardTimeSeriesPoint[]> {
    return this.request('/analytics/timeseries');
  }

  async getTopPipelines(): Promise<Record<string, unknown>[]> {
    return this.request('/analytics/top-pipelines');
  }

  // Dashboard methods - New real API endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getRecentActivity(): Promise<DashboardRecentActivity[]> {
    return this.request('/dashboard/recent-activity');
  }

  async getSystemStatus(): Promise<Record<string, unknown>> {
    return this.request('/dashboard/system-status');
  }

  async getPerformanceMetrics(): Promise<Record<string, unknown>> {
    return this.request('/dashboard/performance-metrics');
  }

  // Users management methods - Now using real API endpoints
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<void> {
    await this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings methods
  async updateProfile(userId: number, profileData: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('current_password', currentPassword);
    formData.append('new_password', newPassword);

    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to change password');
    }

    return response.json();
  }

  // Admin: Reset user password
  async resetUserPassword(userId: number): Promise<{ message: string; temporary_password: string; note: string }> {
    return this.request(`/users/${userId}/reset-password`, {
      method: 'POST',
    });
  }

  // Admin: Activate user
  async activateUser(userId: number): Promise<{ message: string }> {
    return this.request(`/users/${userId}/activate`, {
      method: 'POST',
    });
  }

  // Admin: Deactivate user
  async deactivateUser(userId: number): Promise<{ message: string }> {
    return this.request(`/users/${userId}/deactivate`, {
      method: 'POST',
    });
  }

  // Admin: Get activity logs
  async getActivityLogs(params?: {
    skip?: number;
    limit?: number;
    action?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Record<string, unknown>[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.action) queryParams.append('action', params.action);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    return this.request(`/admin/activity-logs?${queryParams.toString()}`);
  }

  // Admin: Get user activity logs
  async getUserActivityLogs(userId: number, params?: {
    skip?: number;
    limit?: number;
    action?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Record<string, unknown>[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.action) queryParams.append('action', params.action);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    return this.request(`/admin/activity-logs/${userId}?${queryParams.toString()}`);
  }
}

export const apiClient = new ApiClient();
