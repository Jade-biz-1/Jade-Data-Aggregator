'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { Database, Globe, Cloud, FileText, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {
    fetchConnectorTypes();
  }, []);

  const fetchConnectorTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(
        `${baseUrl}/api/v1/configuration/connector-types`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConnectorTypes(data.categories || {});
      }
    } catch (error) {
      console.error('Error fetching connector types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      // Validate configuration
      const validateResponse = await fetch(
        `${baseUrl}/api/v1/configuration/validate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            connector_type: selectedType,
            configuration: values
          })
        }
      );

      if (validateResponse.ok) {
        const validation = await validateResponse.json();

        if (validation.is_valid) {
          // Save connector
          const response = await fetch(`${baseUrl}/api/v1/connectors/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: values.name || `${selectedType} Connector`,
              connector_type: selectedType,
              config: values,
              is_active: true
            })
          });

          if (response.ok) {
            alert('Connector created successfully!');
            router.push('/connectors');
          } else {
            alert('Failed to create connector');
          }
        } else {
          alert(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Error saving connector:', error);
      alert('An error occurred while saving');
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

  if (selectedType) {
    return (
      <DashboardLayout>
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Connector</h1>
          <p className="text-gray-600 mt-1">
            Select a connector type to configure
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading connector types...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(connectorTypes).map(([category, types]) => (
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
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ConnectorConfigPage;
