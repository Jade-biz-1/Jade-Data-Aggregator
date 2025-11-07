'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  Trash2,
  Eye,
  FileText,
  Table,
  Code,
  Image as ImageIcon,
  File as FileIcon,
  Search,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import FileUpload from '@/components/upload/FileUpload';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface FileRecord {
  id: string;
  filename: string;
  file_size: number;
  file_type: string;
  status: string;
  uploaded_at: string;
  validation_status: string;
  preview_available: boolean;
}

interface FilePreview {
  preview_type: 'data' | 'image' | 'text';
  data?: any[];
  columns?: string[];
  text_content?: string;
  image_url?: string;
  row_count?: number;
  column_count?: number;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const { features, loading: permissionsLoading } = usePermissions();
  const { toasts, error, success, warning } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/files/uploads', {
        params: { limit: 100, status: filterType !== 'all' ? filterType : undefined }
      });
      setFiles(response.data.uploads || []);
    } catch (err: any) {
      console.error('Failed to load files:', err);
      error(err.message || 'Failed to load files', 'Error');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    success('File uploaded successfully', 'Success');
    loadFiles();
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/files/uploads/${fileId}`);
      success('File deleted successfully', 'Success');
      loadFiles();
    } catch (err: any) {
      console.error('Failed to delete file:', err);
      error(err.message || 'Failed to delete file', 'Error');
    }
  };

  const viewPreview = async (file: FileRecord) => {
    setSelectedFile(file);
    try {
      const response = await api.get(`/files/uploads/${file.id}/preview`);
      setPreview(response.data);
    } catch (err: any) {
      console.error('Failed to load preview:', err);
      error(err.message || 'Failed to load preview', 'Error');
      setPreview(null);
    }
  };

  const downloadFile = async (file: FileRecord) => {
    try {
      const response = await api.get(`/files/uploads/${file.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('File downloaded successfully', 'Success');
    } catch (err: any) {
      console.error('Failed to download file:', err);
      error(err.message || 'Failed to download file', 'Error');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('csv')) return <Table className="w-6 h-6 text-green-600" />;
    if (fileType.includes('json')) return <Code className="w-6 h-6 text-blue-600" />;
    if (fileType.includes('image')) return <ImageIcon className="w-6 h-6 text-purple-600" />;
    if (fileType.includes('text')) return <FileText className="w-6 h-6 text-gray-600" />;
    return <FileIcon className="w-6 h-6 text-gray-400" />;
  };

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (!features?.files?.view) {
    return (
      <DashboardLayout>
        <AccessDenied message="You don't have permission to view file management." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">File Management</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Upload, manage, and preview your data files
            </p>
          </div>
          {features?.files?.upload && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Upload className="w-5 h-5" />
              Upload Files
            </button>
          )}
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upload New Files
            </h2>
            <FileUpload
              onUploadComplete={handleUploadComplete}
              maxFileSize={100}
              acceptedFileTypes={['.csv', '.json', '.xlsx', '.txt', '.xml']}
              multiple={true}
            />
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                loadFiles();
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Files</option>
              <option value="COMPLETED">Completed</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* File List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Upload className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No files uploaded yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload your first file to get started
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFiles.map(file => (
                  <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.file_type)}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {file.filename}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {file.file_type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          file.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : file.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {file.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {file.preview_available && (
                          <button
                            onClick={() => viewPreview(file)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {features?.files?.download && (
                          <button
                            onClick={() => downloadFile(file)}
                            className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {features?.files?.delete && (
                          <button
                            onClick={() => deleteFile(file.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Preview Modal */}
        {selectedFile && preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedFile.filename}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {preview.preview_type === 'data' &&
                      `${preview.row_count} rows × ${preview.column_count} columns`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <span className="text-2xl text-gray-400">&times;</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto p-6">
                {preview.preview_type === 'data' && preview.data && preview.columns && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                        <tr>
                          {preview.columns.map((col, idx) => (
                            <th
                              key={idx}
                              className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {preview.data.slice(0, 100).map((row, idx) => (
                          <tr key={idx}>
                            {preview.columns!.map((col, colIdx) => (
                              <td
                                key={colIdx}
                                className="px-4 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap"
                              >
                                {row[col]?.toString() || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {preview.preview_type === 'text' && preview.text_content && (
                  <pre className="text-sm text-gray-900 dark:text-white font-mono whitespace-pre-wrap">
                    {preview.text_content}
                  </pre>
                )}

                {preview.preview_type === 'image' && preview.image_url && (
                  <img
                    src={preview.image_url}
                    alt={selectedFile.filename}
                    className="max-w-full h-auto"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
