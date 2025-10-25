'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { apiClient } from '@/lib/api';
import type { LoginCredentials, ConnectorCreate, TransformationCreate, PipelineCreate } from '@/lib/api';

export default function APIDemoPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Auth state
  const [username, setUsername] = useState('demo_user');
  const [password, setPassword] = useState('demo_password');

  // Generic API call handler
  const handleAPICall = async (fn: () => Promise<any>, label: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`[${label}] Starting...`);
      const response = await fn();

      if (response.success) {
        setResult(response.data);
        console.log(`[${label}] Success:`, response.data);
      } else {
        setError(response.error?.message || 'Request failed');
        console.error(`[${label}] Error:`, response.error);
      }
    } catch (err: any) {
      setError(err.message);
      console.error(`[${label}] Exception:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Authentication Demos
  const handleLogin = () => {
    const credentials: LoginCredentials = { username, password };
    handleAPICall(() => apiClient.login(credentials), 'Login');
  };

  const handleGetCurrentUser = () => {
    handleAPICall(() => apiClient.getCurrentUser(), 'Get Current User');
  };

  const handleLogout = () => {
    apiClient.logout();
    setResult({ message: 'Logged out successfully' });
  };

  // Connector Demos
  const handleGetConnectors = () => {
    handleAPICall(() => apiClient.getConnectors(), 'Get Connectors');
  };

  const handleCreateConnector = () => {
    const connector: ConnectorCreate = {
      name: 'Demo CSV Connector',
      description: 'A demo connector for testing',
      connector_type: 'csv',
      config: {
        file_path: '/path/to/demo.csv',
        delimiter: ',',
        has_header: true,
      },
    };
    handleAPICall(() => apiClient.createConnector(connector), 'Create Connector');
  };

  // Transformation Demos
  const handleGetTransformations = () => {
    handleAPICall(() => apiClient.getTransformations(), 'Get Transformations');
  };

  const handleCreateTransformation = () => {
    const transformation: TransformationCreate = {
      name: 'Demo Transformation',
      description: 'A demo transformation for testing',
      transformation_type: 'python',
      config: {
        operation: 'filter',
      },
      transformation_code: 'def transform(data):\n    return [item for item in data if item["value"] > 0]',
    };
    handleAPICall(() => apiClient.createTransformation(transformation), 'Create Transformation');
  };

  // Pipeline Demos
  const handleGetPipelines = () => {
    handleAPICall(() => apiClient.getPipelines(), 'Get Pipelines');
  };

  const handleCreatePipeline = () => {
    const pipeline: PipelineCreate = {
      name: 'Demo Pipeline',
      description: 'A demo pipeline for testing',
      config: {
        steps: [
          { type: 'extract', connector_id: 1 },
          { type: 'transform', transformation_id: 1 },
          { type: 'load', connector_id: 2 },
        ],
      },
      schedule: '0 */6 * * *', // Every 6 hours
    };
    handleAPICall(() => apiClient.createPipeline(pipeline), 'Create Pipeline');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Client Demo</h1>
          <p className="text-gray-600">
            Test the TutorialAPIClient with various endpoints
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${apiClient.isAuthenticated() ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {apiClient.isAuthenticated() ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => apiClient.setBaseURL('http://localhost:8001/api/v1')}>
              Use Local API
            </Button>
          </div>
        </div>

        <Tabs defaultValue="auth">
          <TabsList>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="connectors">Connectors</TabsTrigger>
            <TabsTrigger value="transformations">Transformations</TabsTrigger>
            <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          </TabsList>

          {/* Authentication Tab */}
          <TabsContent value="auth">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Authentication Methods</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleLogin} disabled={loading}>
                    Login
                  </Button>
                  <Button onClick={handleGetCurrentUser} disabled={loading}>
                    Get Current User
                  </Button>
                  <Button onClick={handleLogout} variant="outline" disabled={loading}>
                    Logout
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Connectors Tab */}
          <TabsContent value="connectors">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Connector Methods</h3>
              <div className="flex gap-2">
                <Button onClick={handleGetConnectors} disabled={loading}>
                  Get All Connectors
                </Button>
                <Button onClick={handleCreateConnector} disabled={loading}>
                  Create Demo Connector
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Transformations Tab */}
          <TabsContent value="transformations">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Transformation Methods</h3>
              <div className="flex gap-2">
                <Button onClick={handleGetTransformations} disabled={loading}>
                  Get All Transformations
                </Button>
                <Button onClick={handleCreateTransformation} disabled={loading}>
                  Create Demo Transformation
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Pipelines Tab */}
          <TabsContent value="pipelines">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pipeline Methods</h3>
              <div className="flex gap-2">
                <Button onClick={handleGetPipelines} disabled={loading}>
                  Get All Pipelines
                </Button>
                <Button onClick={handleCreatePipeline} disabled={loading}>
                  Create Demo Pipeline
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Loading State */}
        {loading && (
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="error" className="mt-6">
            <strong>Error:</strong> {error}
          </Alert>
        )}

        {/* Result Display */}
        {result && !loading && (
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Response</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}

        {/* Documentation */}
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">API Client Features</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ Automatic authentication token management</li>
            <li>✓ Request/response interceptors</li>
            <li>✓ Automatic retry logic for failed requests (3 retries)</li>
            <li>✓ Error handling with detailed error messages</li>
            <li>✓ LocalStorage token persistence</li>
            <li>✓ Token expiry checking</li>
            <li>✓ TypeScript type safety</li>
            <li>✓ Configurable base URL and timeouts</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
