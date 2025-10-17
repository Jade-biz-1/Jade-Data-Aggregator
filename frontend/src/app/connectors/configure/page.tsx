'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { Database, Globe, Cloud, FileText, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface ConnectorType {
  type: string;
  name: string;
  description: string;
  icon: string;
}

const ConnectorConfigPage = () => {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [connectorTypes, setConnectorTypes] = useState<Record<string, ConnectorType[]>>({});
  const [loading, setLoading] = useState(true);
  const { features, loading: permissionsLoading } = usePermissions();
  const { toasts, error, success, warning } = useToast();

  useEffect(() => {
    fetchConnectorTypes();
  }, []);

  const fetchConnectorTypes = async () => {
    try {
      const response = await api.get('/configuration/connector-types');
      setConnectorTypes(response.data.categories || {});
    } catch (err: any) {
      console.error('Error fetching connector types:', err);
      error(err.message || 'Failed to load connector types', 'Error');
      setConnectorTypes({});
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      // Validate configuration
      const validateResponse = await api.post('/configuration/validate', {
        connector_type: selectedType,
        configuration: values
      });

      const validation = validateResponse.data;

      if (validation.is_valid) {
        // Save connector
        const response = await api.post('/connectors/', {
          name: values.name || `${selectedType} Connector`,
          connector_type: selectedType,
          config: values,
          is_active: true
        });

        success('Connector created successfully', 'Success');
        router.push('/connectors');
      } else {
        error(`Validation failed: ${validation.errors.join(', ')}`, 'Validation Error');
      }
    } catch (err: any) {
      console.error('Error saving connector:', err);
      error(err.message || 'An error occurred while saving connector', 'Error');
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'database':
        return Database;
      case 'globe':
        return Globe;
      case 'cloud':
        return Cloud;
      case 'file-text':
        return FileText;
      default:
        return Database;
    }
  };

  // Check permission to view this page
  if (permissionsLoading || loading) {
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

  if (!features?.connectors?.create) {
    return (
      <DashboardLayout>
        <AccessDenied message="You don't have permission to create connectors." />
      </DashboardLayout>
    );
  }

  if (selectedType) {
    return (
      <DashboardLayout>
        <ToastContainer toasts={toasts} />
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedType(null)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configure Connector</h1>
              <p className="text-gray-600 mt-1">
                Configure a new {selectedType} connector
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <DynamicForm
              connectorType={selectedType}
              onSubmit={handleSubmit}
              submitLabel="Create Connector"
              showTestButton={true}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Connector</h1>
          <p className="text-gray-600 mt-1">
            Select a connector type to configure
          </p>
        </div>

        <div className="space-y-8">
          {Object.entries(connectorTypes).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No connector types available</p>
            </div>
          ) : (
            Object.entries(connectorTypes).map(([category, types]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {types.map((connector) => {
                    const IconComponent = getIconComponent(connector.icon);

                    return (
                      <button
                        key={connector.type}
                        onClick={() => setSelectedType(connector.type)}
                        className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <IconComponent className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {connector.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {connector.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConnectorConfigPage;
