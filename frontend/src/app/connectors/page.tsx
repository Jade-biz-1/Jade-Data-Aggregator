'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Database, 
  Plus, 
  Search, 
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Trash2,
  Edit,
  XCircle,
  Shield
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';

// Mock data - in real app this would come from API
const mockConnectors = [
  {
    id: 1,
    name: 'Salesforce CRM',
    type: 'SaaS',
    description: 'Connection to Salesforce CRM system',
    status: 'connected',
    lastSync: new Date('2025-09-29T10:30:00Z'),
    nextSync: new Date('2025-09-29T12:00:00Z'),
    totalSyncs: 1542,
    recordsPerSync: 2500,
  },
  {
    id: 2,
    name: 'MySQL Database',
    type: 'Database',
    description: 'Production MySQL database',
    status: 'connected',
    lastSync: new Date('2025-09-29T08:15:00Z'),
    nextSync: new Date('2025-09-29T08:45:00Z'),
    totalSyncs: 8650,
    recordsPerSync: 5000,
  },
  {
    id: 3,
    name: 'AWS S3 Bucket',
    type: 'File Storage',
    description: 'Primary backup storage for processed data',
    status: 'disconnected',
    lastSync: new Date('2025-09-28T18:00:00Z'),
    nextSync: null,
    totalSyncs: 230,
    recordsPerSync: 10000,
  },
  {
    id: 4,
    name: 'Google Analytics',
    type: 'SaaS',
    description: 'Google Analytics 4 property',
    status: 'connected',
    lastSync: new Date('2025-09-29T09:00:00Z'),
    nextSync: new Date('2025-09-29T10:00:00Z'),
    totalSyncs: 4200,
    recordsPerSync: 1500,
  },
  {
    id: 5,
    name: 'PostgreSQL',
    type: 'Database',
    description: 'Analytics data warehouse',
    status: 'connected',
    lastSync: new Date('2025-09-29T09:30:00Z'),
    nextSync: new Date('2025-09-29T10:30:00Z'),
    totalSyncs: 3780,
    recordsPerSync: 8000,
  },
];

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState(mockConnectors);
  const [filteredConnectors, setFilteredConnectors] = useState(mockConnectors);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { features, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false);
      setFilteredConnectors(connectors);
    }, 800);
    return () => clearTimeout(timer);
  }, [connectors]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = connectors.filter(connector => 
        connector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connector.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connector.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredConnectors(filtered);
    } else {
      setFilteredConnectors(connectors);
    }
  }, [searchTerm, connectors]);

  const handleEditConnector = (id: number) => {
    // Mock function to edit a connector
    console.log(`Editing connector ${id}`);
  };

  const handleDeleteConnector = (id: number) => {
    // Mock function to delete a connector
    console.log(`Deleting connector ${id}`);
    setConnectors(connectors.filter(c => c.id !== id));
  };

  const handleTestConnection = (id: number) => {
    // Mock function to test connection
    console.log(`Testing connection for connector ${id}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  // Check permission to view this page
  if (permissionsLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!features?.connectors?.view) {
    return (
      <DashboardLayout>
        <AccessDenied
          message="You don't have permission to view connectors"
          requiredRole="designer"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Connectors</h1>
            <p className="mt-2 text-gray-600">
              Manage connections to your data sources and destinations
            </p>
          </div>
          {features?.connectors?.create && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Connector
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search connectors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Connectors</CardTitle>
              <Database className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectors.length}</div>
              <p className="text-xs text-gray-500">All connectors</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connectors.filter(c => c.status === 'connected').length}
              </div>
              <p className="text-xs text-gray-500">Active connections</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Disconnected</CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connectors.filter(c => c.status === 'disconnected').length}
              </div>
              <p className="text-xs text-gray-500">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Connectors List */}
        <Card>
          <CardHeader>
            <CardTitle>Connector List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredConnectors.length === 0 ? (
              <div className="text-center py-12">
                <Database className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No connectors</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new connector.
                </p>
                <div className="mt-6">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Connector
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConnectors.map((connector) => (
                  <div 
                    key={connector.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getStatusIcon(connector.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline">
                          <h3 className="text-base font-medium text-gray-900 truncate">
                            {connector.name}
                          </h3>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            connector.status === 'connected' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {getStatusText(connector.status)}
                          </span>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {connector.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 truncate">{connector.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                            {connector.totalSyncs.toLocaleString()} syncs
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                            {connector.recordsPerSync.toLocaleString()} rec/sync
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                      <div className="text-right mr-4 hidden md:block">
                        <p className="text-sm font-medium text-gray-900">
                          Last sync: {new Date(connector.lastSync).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(connector.id)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        {features?.connectors?.edit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditConnector(connector.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {features?.connectors?.delete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteConnector(connector.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}