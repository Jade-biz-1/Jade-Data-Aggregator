'use client';

import { useState } from 'react';
import { DataTable, Column } from './data-table';
import { Download, Trash2, Eye, EyeOff } from 'lucide-react';
import { exportToCSV } from '@/lib/chart-export';

interface EnhancedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  pageSize?: number;
  enableBulkActions?: boolean;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  onDelete?: (selected: T[]) => void;
  onRowClick?: (row: T) => void;
  tableName?: string;
}

export function EnhancedTable<T extends Record<string, any>>({
  data,
  columns: initialColumns,
  isLoading = false,
  pageSize = 10,
  enableBulkActions = true,
  enableColumnVisibility = true,
  enableExport = true,
  onDelete,
  onRowClick,
  tableName = 'table_data'
}: EnhancedTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(initialColumns.map(col => col.key))
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteKeyword, setDeleteKeyword] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Add checkbox column for bulk selection
  const columns: Column<T>[] = enableBulkActions
    ? [
      {
        key: '_select',
        header: (
          <input
            type="checkbox"
            checked={selectedRows.size === data.length && data.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRows(new Set(data.map((_, i) => i)));
              } else {
                setSelectedRows(new Set());
              }
            }}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        ) as any,
        render: (_value, _row, index) => (
          <input
            type="checkbox"
            checked={selectedRows.has(index as number)}
            onChange={(e) => {
              const newSelected = new Set(selectedRows);
              if (e.target.checked) {
                newSelected.add(index as number);
              } else {
                newSelected.delete(index as number);
              }
              setSelectedRows(newSelected);
            }}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        ),
        sortable: false,
        filterable: false,
        width: '50px'
      },
      ...initialColumns.filter(col => visibleColumns.has(col.key))
    ]
    : initialColumns.filter(col => visibleColumns.has(col.key));

  const handleExport = () => {
    const exportData = selectedRows.size > 0
      ? data.filter((_, i) => selectedRows.has(i))
      : data;

    const plainData = exportData.map(row => {
      const obj: any = {};
      initialColumns.forEach(col => {
        if (visibleColumns.has(col.key)) {
          const key = typeof col.header === 'string' ? col.header : col.key;
          obj[key] = row[col.key];
        }
      });
      return obj;
    });

    const filename = `${tableName}.csv`;
    exportToCSV(plainData, tableName);
    setExportNotice(`Downloaded as "${filename}" — check your Downloads folder.`);
    setTimeout(() => setExportNotice(null), 5000);
  };

  const handleBulkDelete = () => {
    if (onDelete && selectedRows.size > 0) {
      setDeleteKeyword('');
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (deleteKeyword !== 'delete') return;
    if (onDelete) {
      const rowsToDelete = data.filter((_, i) => selectedRows.has(i));
      onDelete(rowsToDelete);
      setSelectedRows(new Set());
    }
    setShowDeleteConfirm(false);
    setDeleteKeyword('');
  };

  const toggleColumn = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        {/* Bulk Actions */}
        {enableBulkActions && selectedRows.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              {selectedRows.size} selected
            </span>
            {onDelete && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            )}
          </div>
        )}

        <div className="flex-1" />

        {/* Column Visibility & Export */}
        <div className="flex items-center space-x-2">
          {enableColumnVisibility && (
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-1" />
                Columns
              </button>

              {showColumnMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowColumnMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                    {initialColumns.map((column) => (
                      <label
                        key={column.key}
                        className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(column.key)}
                          onChange={() => toggleColumn(column.key)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-2"
                        />
                        <span className="text-sm text-gray-900">{column.header}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {enableExport && (
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Export notice */}
      {exportNotice && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <Download className="h-4 w-4 flex-shrink-0" />
          {exportNotice}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        pageSize={pageSize}
        onRowClick={onRowClick}
      />

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <p className="text-sm text-gray-500">
                  {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} will be permanently deleted.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              This action <strong>cannot be undone</strong>. To confirm, type{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-red-600">delete</code> below:
            </p>
            <input
              type="text"
              value={deleteKeyword}
              onChange={e => setDeleteKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmDelete()}
              placeholder="type delete to confirm"
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteKeyword(''); }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteKeyword !== 'delete'}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
