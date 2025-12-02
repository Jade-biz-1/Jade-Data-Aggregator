import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import type {
  AuthTokens,
  User,
  LoginCredentials,
  RegisterData,
  Connector,
  ConnectorCreate,
  ConnectorUpdate,
  ConnectionTestResult,
  SchemaResponse,
  Transformation,
  TransformationCreate,
  TransformationUpdate,
  TransformationTestResult,
  Pipeline,
  PipelineCreate,
  PipelineUpdate,
  PipelineExecutionRequest,
  PipelineExecutionResult,
  PipelineStatus,
  APIError,
  APIResponse,
} from './types';

export class TutorialAPIClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  constructor(baseURL: string = 'http://localhost:8001/api/v1') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load tokens from localStorage if available
    if (typeof window !== 'undefined') {
      this.loadTokens();
    }

    // Setup interceptors
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  // ==================== INTERCEPTORS ====================

  private setupRequestInterceptor(): void {
    this.client.interceptors.request.use(
      (config) => {
        // Add authorization header if token exists
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  private setupResponseInterceptor(): void {
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API Response] ${response.status} ${response.config.url}`);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh token
          try {
            await this.refreshAccessToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ==================== TOKEN MANAGEMENT ====================

  private saveTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;

    this.accessToken = tokens.access_token;
    localStorage.setItem('access_token', tokens.access_token);

    if (tokens.expires_in) {
      this.tokenExpiry = Date.now() + tokens.expires_in * 1000;
      localStorage.setItem('token_expiry', this.tokenExpiry.toString());
    }
  }

  private loadTokens(): void {
    if (typeof window === 'undefined') return;

    this.accessToken = localStorage.getItem('access_token');
    const expiry = localStorage.getItem('token_expiry');
    this.tokenExpiry = expiry ? parseInt(expiry) : null;

    // Check if token is expired
    if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
      this.clearTokens();
    }
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') return;

    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expiry');
  }

  private async refreshAccessToken(): Promise<void> {
    // For now, we'll just clear tokens and require re-login
    // In a production app, you'd implement proper token refresh
    this.clearTokens();
    throw new Error('Session expired. Please login again.');
  }

  // ==================== ERROR HANDLING ====================

  private async handleRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<APIResponse<T>> {
    try {
      const data = await requestFn();
      return { data, success: true };
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        await this.delay(this.retryDelay);
        return this.handleRequest(requestFn, retries - 1);
      }

      const apiError = this.parseError(error);
      return { error: apiError, success: false };
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseError(error: any): APIError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return {
        message: (axiosError.response?.data as any)?.detail || axiosError.message || 'An error occurred',
        status: axiosError.response?.status,
        details: axiosError.response?.data,
      };
    }
    return {
      message: error.message || 'An unknown error occurred',
    };
  }

  // ==================== AUTHENTICATION ====================

  async login(credentials: LoginCredentials): Promise<APIResponse<AuthTokens>> {
    return this.handleRequest(async () => {
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await this.client.post<AuthTokens>('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      this.saveTokens(response.data);
      return response.data;
    });
  }

  async register(data: RegisterData): Promise<APIResponse<User>> {
    return this.handleRequest(async () => {
      const response = await this.client.post<User>('/auth/register', data);
      return response.data;
    });
  }

  logout(): void {
    this.clearTokens();
    // Optionally call backend logout endpoint
    this.client.post('/auth/logout').catch(() => {
      // Ignore errors on logout
    });
  }

  async getCurrentUser(): Promise<APIResponse<User>> {
    return this.handleRequest(async () => {
      const response = await this.client.get<User>('/auth/me');
      return response.data;
    });
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && (!this.tokenExpiry || Date.now() < this.tokenExpiry);
  }

  // ==================== CONNECTORS ====================

  async getConnectors(): Promise<APIResponse<Connector[]>> {
    return this.handleRequest(async () => {
      const response = await this.client.get<Connector[]>('/connectors/');
      return response.data;
    });
  }

  async getConnector(id: number): Promise<APIResponse<Connector>> {
    return this.handleRequest(async () => {
      const response = await this.client.get<Connector>(`/connectors/${id}`);
      return response.data;
    });
  }

  async createConnector(connector: ConnectorCreate): Promise<APIResponse<Connector>> {
    return this.handleRequest(async () => {
      const response = await this.client.post<Connector>('/connectors/', connector);
      return response.data;
    });
  }

  async updateConnector(id: number, connector: ConnectorUpdate): Promise<APIResponse<Connector>> {
    return this.handleRequest(async () => {
      const response = await this.client.put<Connector>(`/connectors/${id}`, connector);
      return response.data;
    });
  }

  async deleteConnector(id: number): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      await this.client.delete(`/connectors/${id}`);
    });
  }

  async testConnection(id: number): Promise<APIResponse<ConnectionTestResult>> {
    return this.handleRequest(async () => {
      const response = await this.client.post<ConnectionTestResult>(`/connectors/${id}/test`);
      return response.data;
    });
  }

  async getConnectorSchema(id: number): Promise<APIResponse<SchemaResponse>> {
    return this.handleRequest(async () => {
      const response = await this.client.get<SchemaResponse>(`/connectors/${id}/schema`);
      return response.data;
    });
  }

  // ==================== TRANSFORMATIONS ====================

  async getTransformations(): Promise<APIResponse<Transformation[]>> {
    return this.handleRequest(async () => {
      const response = await this.client.get<Transformation[]>('/transformations/');
      return response.data;
    });
  }

  async getTransformation(id: number): Promise<APIResponse<Transformation>> {
    return this.handleRequest(async () => {
      const response = await this.client.get<Transformation>(`/transformations/${id}`);
      return response.data;
    });
  }

  async createTransformation(transformation: TransformationCreate): Promise<APIResponse<Transformation>> {
    return this.handleRequest(async () => {
      const response = await this.client.post<Transformation>('/transformations/', transformation);
      return response.data;
    });
  }

  async updateTransformation(id: number, transformation: TransformationUpdate): Promise<APIResponse<Transformation>> {
    return this.handleRequest(async () => {
      const response = await this.client.put<Transformation>(`/transformations/${id}`, transformation);
      return response.data;
    });
  }

  async deleteTransformation(id: number): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      await this.client.delete(`/transformations/${id}`);
    });
  }

  async testTransformation(id: number, sampleData?: any): Promise<APIResponse<TransformationTestResult>> {
    return this.handleRequest(async () => {
      const response = await this.client.post<TransformationTestResult>(
        `/transformations/${id}/test`,
        { sample_data: sampleData }
      );
      return response.data;
    });
  }

  // ==================== PIPELINES ====================

  async getPipelines(): Promise<APIResponse<Pipeline[]>> {
    return this.handleRequest(async () => {
      const response = await this.client.get<Pipeline[]>('/pipelines/');
      return response.data;
    });
  }

  async getPipeline(id: number): Promise<APIResponse<Pipeline>> {
    return this.handleRequest(async () => {
      const response = await this.client.get<Pipeline>(`/pipelines/${id}`);
      return response.data;
    });
  }

  async createPipeline(pipeline: PipelineCreate): Promise<APIResponse<Pipeline>> {
    return this.handleRequest(async () => {
      const response = await this.client.post<Pipeline>('/pipelines/', pipeline);
      return response.data;
    });
  }

  async updatePipeline(id: number, pipeline: PipelineUpdate): Promise<APIResponse<Pipeline>> {
    return this.handleRequest(async () => {
      const response = await this.client.put<Pipeline>(`/pipelines/${id}`, pipeline);
      return response.data;
    });
  }

  async deletePipeline(id: number): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      await this.client.delete(`/pipelines/${id}`);
    });
  }

  async executePipeline(request: PipelineExecutionRequest): Promise<APIResponse<PipelineExecutionResult>> {
    return this.handleRequest(async () => {
      const response = await this.client.post<PipelineExecutionResult>(
        `/pipeline-execution/execute`,
        request
      );
      return response.data;
    });
  }

  async getPipelineStatus(executionId: string): Promise<APIResponse<PipelineStatus>> {
    return this.handleRequest(async () => {
      const response = await this.client.get<PipelineStatus>(
        `/pipeline-execution/status/${executionId}`
      );
      return response.data;
    });
  }

  async cancelPipelineExecution(executionId: string): Promise<APIResponse<void>> {
    return this.handleRequest(async () => {
      await this.client.post(`/pipeline-execution/cancel/${executionId}`);
    });
  }

  // ==================== UTILITY METHODS ====================

  setBaseURL(url: string): void {
    this.client.defaults.baseURL = url;
  }

  setTimeout(timeout: number): void {
    this.client.defaults.timeout = timeout;
  }

  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }

  setRetryDelay(delay: number): void {
    this.retryDelay = delay;
  }
}

// Export singleton instance
export const apiClient = new TutorialAPIClient();