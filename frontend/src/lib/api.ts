import { Pipeline } from '@/types/pipeline';
import { Connector } from '@/types/connector';
import { User } from '@/types/user';
import { Transformation } from '@/types/transformation';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

interface ApiError {
  detail: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...(options?.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    // Handle responses with no content (e.g., DELETE requests)
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return {} as T;
    }

    return response.json();
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
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
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

  // Pipeline Execution methods - NEW
  async executePipeline(pipelineId: number, executionConfig?: any): Promise<any> {
    return this.request(`/pipelines/${pipelineId}/execute`, {
      method: 'POST',
      body: JSON.stringify({
        pipeline_id: pipelineId,
        execution_config: executionConfig || {},
        triggered_by: 'manual'
      }),
    });
  }

  async getPipelineRuns(pipelineId: number): Promise<any[]> {
    return this.request(`/pipelines/${pipelineId}/runs`);
  }

  async getPipelineRun(runId: number): Promise<any> {
    return this.request(`/pipelines/runs/${runId}`);
  }

  async cancelPipelineRun(runId: number): Promise<any> {
    return this.request(`/pipelines/runs/${runId}/cancel`, {
      method: 'POST',
    });
  }

  async getAllRecentRuns(): Promise<any[]> {
    return this.request(`/pipelines/runs`);
  }

  // Monitoring methods - Now using real API endpoints
  async getPipelineStats(): Promise<any> {
    return this.request<any>('/monitoring/pipeline-stats');
  }

  async getRecentAlerts(): Promise<any[]> {
    return this.request<any[]>('/monitoring/alerts');
  }

  async getPipelinePerformance(): Promise<any[]> {
    return this.request<any[]>('/monitoring/pipeline-performance');
  }

  // Analytics methods - Now using real API endpoints
  async getAnalyticsData(): Promise<any> {
    return this.request<any>('/analytics/data');
  }

  async getTimeSeriesData(): Promise<any[]> {
    return this.request<any[]>('/analytics/timeseries');
  }

  async getTopPipelines(): Promise<any[]> {
    return this.request<any[]>('/analytics/top-pipelines');
  }

  // Dashboard methods - New real API endpoints
  async getDashboardStats(): Promise<any> {
    return this.request<any>('/dashboard/stats');
  }

  async getRecentActivity(): Promise<any[]> {
    return this.request<any[]>('/dashboard/recent-activity');
  }

  async getSystemStatus(): Promise<any> {
    return this.request<any>('/dashboard/system-status');
  }

  async getPerformanceMetrics(): Promise<any> {
    return this.request<any>('/dashboard/performance-metrics');
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

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<void> {
    // This would be the real API call:
    // return this.request<void>('/auth/change-password', {
    //   method: 'POST',
    //   body: JSON.stringify(passwordData),
    // });
    
    // For now, we'll just return a promise
    return Promise.resolve();
  }
}

export const apiClient = new ApiClient();