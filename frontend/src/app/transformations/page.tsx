'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Play,
  Trash2,
  Edit,
  Code,
  Settings,
  Database,
  Filter,
  Columns,
  Shuffle,
  Shield,
  BookOpen
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Transformation } from '@/types/transformation';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

export default function TransformationsPage() {
  const router = useRouter();
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [filteredTransformations, setFilteredTransformations] = useState<Transformation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { features, loading: permissionsLoading } = usePermissions();
  const { toasts, error, success, warning } = useToast();

  useEffect(() => {
    const fetchTransformations = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getTransformations();
        setTransformations(data);
        setFilteredTransformations(data);
      } catch (err: any) {
        console.error('Error fetching transformations:', err);
        error(err.message || 'Failed to load transformations', 'Error');
        setTransformations([]);
        setFilteredTransformations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransformations();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = transformations.filter(transformation => 
        transformation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transformation.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transformation.transformation_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTransformations(filtered);
    } else {
      setFilteredTransformations(transformations);
    }
  }, [searchTerm, transformations]);

  const handleRunTransformation = async (id: number) => {
    try {
      await apiClient.testTransformation(id, {});
      success('Transformation test started', 'Success');
    } catch (err: any) {
      error(err.message || 'Failed to run transformation', 'Error');
    }
  };

  const handleEditTransformation = (id: number) => {
    // Navigate to transformation edit page when implemented
    console.log(`Editing transformation ${id}`);
    warning('Edit functionality coming soon', 'Info');
  };

  const handleDeleteTransformation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transformation?')) {
      return;
    }

    try {
      await apiClient.deleteTransformation(id);
      setTransformations(transformations.filter(t => t.id !== id));
      setFilteredTransformations(filteredTransformations.filter(t => t.id !== id));
      success('Transformation deleted successfully', 'Success');
    } catch (err: any) {
      console.error('Error deleting transformation:', err);
      error(err.message || 'Failed to delete transformation', 'Error');
    }
  };

  const getTransformationIcon = (type: string) => {
    switch (type) {
      case 'Data Normalization':
        return <Columns className="h-4 w-4" />;
      case 'Currency Conversion':
        return <Shuffle className="h-4 w-4" />;
      case 'Deduplication':
        return <Filter className="h-4 w-4" />;
      case 'Data Validation':
        return <Settings className="h-4 w-4" />;
      default:
        return <Code className="h-4 w-4" />;
    }
  };

  // Mock status field since the backend model doesn't have it
  const getTransformationStatus = (transformation: Transformation) => {
    return transformation.is_active ? 'active' : 'inactive';
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

  if (!features?.transformations?.view) {
    return (
      <DashboardLayout>
        <AccessDenied
          message="You don't have permission to view transformations"
          requiredRole="designer"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Transformations</h1>
            <p className="mt-2 text-gray-600">
              Configure and manage data transformation rules
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push('/transformations/functions')}
              variant="outline"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Function Library
            </Button>
            {features?.transformations?.create && (
              <Button onClick={() => router.push('/transformations/functions')}>
                <Plus className="h-4 w-4 mr-2" />
                New Transformation
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search transformations..."
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
              <CardTitle className="text-sm font-medium">Total Transformations</CardTitle>
              <Code className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transformations.length}</div>
              <p className="text-xs text-gray-500">All transformations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Play className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transformations.filter(t => t.is_active).length}
              </div>
              <p className="text-xs text-gray-500">Active transformations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
              <Database className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                0 {/* Replace with actual records processed when available */ }
              </div>
              <p className="text-xs text-gray-500">Processed in latest runs</p>
            </CardContent>
          </Card>
        </div>

        {/* Transformations List */}
        <Card>
          <CardHeader>
            <CardTitle>Transformation Rules</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredTransformations.length === 0 ? (
              <div className="text-center py-12">
                <Code className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transformations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new transformation rule.
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push('/transformations/functions')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Transformation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransformations.map((transformation) => (
                  <div 
                    key={transformation.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getTransformationIcon(transformation.transformation_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline">
                          <h3 className="text-base font-medium text-gray-900 truncate">
                            {transformation.name}
                          </h3>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getTransformationStatus(transformation) === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getTransformationStatus(transformation).charAt(0).toUpperCase() + getTransformationStatus(transformation).slice(1)}
                          </span>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {transformation.transformation_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 truncate">{transformation.description}</p>
                        
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <div className="bg-gray-100 rounded px-2 py-1">
                            <span className="text-gray-600">Input:</span> 
                            <span className="ml-1">{transformation.source_fields.join(', ')}</span>
                          </div>
                          <div className="bg-gray-100 rounded px-2 py-1">
                            <span className="text-gray-600">Output:</span> 
                            <span className="ml-1">{transformation.target_fields.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                      <div className="text-right mr-4 hidden md:block">
                        <p className="text-sm font-medium text-gray-900">
                          0 {/* Replace with actual records processed when available */} records
                        </p>
                        <p className="text-xs text-gray-500">
                          {/* Last run date when available */}
                        </p>
                      </div>
                      
                      <div className="flex space-x-1">
                        {features?.transformations?.execute && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRunTransformation(transformation.id)}
                            disabled={!transformation.is_active}
                            title={!transformation.is_active ? 'Transformation is not active' : 'Run now'}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {features?.transformations?.edit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTransformation(transformation.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {features?.transformations?.delete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTransformation(transformation.id)}
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