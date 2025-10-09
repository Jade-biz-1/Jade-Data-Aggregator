'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { api } from '@/lib/api';

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
  multiple?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'completed' | 'error' | 'validating';
  progress: number;
  error?: string;
  file_url?: string;
}

export default function FileUpload({
  onUploadComplete,
  maxFileSize = 100, // 100MB default
  acceptedFileTypes = ['*'],
  multiple = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }, []);

  const handleFiles = async (selectedFiles: File[]) => {
    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    for (let i = 0; i < selectedFiles.length; i++) {
      await uploadFile(selectedFiles[i], newFiles[i].id);
    }
  };

  const uploadFile = async (file: File, fileId: string) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        updateFileStatus(fileId, {
          status: 'error',
          error: `File exceeds maximum size of ${maxFileSize}MB`,
        });
        return;
      }

      // Create upload record
      const createResponse = await api.post('/files/upload/create', {
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        total_chunks: totalChunks,
      });

      const uploadId = createResponse.data.upload_id;

      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunk_index', chunkIndex.toString());
        formData.append('upload_id', uploadId);

        await api.post('/files/upload/chunk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // Update progress
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        updateFileStatus(fileId, { progress });
      }

      // Mark as validating
      updateFileStatus(fileId, { status: 'validating', progress: 100 });

      // Complete upload and validate
      const completeResponse = await api.post(`/files/upload/${uploadId}/complete`);

      if (completeResponse.data.validation_passed) {
        updateFileStatus(fileId, {
          status: 'completed',
          progress: 100,
          file_url: completeResponse.data.file_url,
        });
      } else {
        updateFileStatus(fileId, {
          status: 'error',
          error: completeResponse.data.validation_errors?.join(', ') || 'Validation failed',
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      updateFileStatus(fileId, {
        status: 'error',
        error: error.response?.data?.detail || 'Upload failed',
      });
    }
  };

  const updateFileStatus = (fileId: string, updates: Partial<UploadedFile>) => {
    setFiles(prev =>
      prev.map(file => (file.id === fileId ? { ...file, ...updates } : file))
    );
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'validating':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusText = (file: UploadedFile): string => {
    switch (file.status) {
      case 'uploading':
        return `Uploading... ${file.progress}%`;
      case 'validating':
        return 'Validating...';
      case 'completed':
        return 'Upload complete';
      case 'error':
        return file.error || 'Upload failed';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="text-center">
          <Upload className={`mx-auto h-12 w-12 ${
            isDragging ? 'text-blue-600' : 'text-gray-400'
          }`} />
          <div className="mt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Click to upload
            </button>
            <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Maximum file size: {maxFileSize}MB
          </p>
          {acceptedFileTypes.length > 0 && acceptedFileTypes[0] !== '*' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Accepted types: {acceptedFileTypes.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Files ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(file.status)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {formatFileSize(file.size)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {(file.status === 'uploading' || file.status === 'validating') && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Status Text */}
                  <p className={`text-xs ${
                    file.status === 'error'
                      ? 'text-red-600'
                      : file.status === 'completed'
                      ? 'text-green-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {getStatusText(file)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  disabled={file.status === 'uploading'}
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
