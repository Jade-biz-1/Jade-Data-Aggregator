'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Clock, Bookmark, X, Zap, Database, FileText, User } from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { usePermissions } from '@/hooks/usePermissions';
import { AccessDenied } from '@/components/common/AccessDenied';
import useToast from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/ToastContainer';

interface SearchResult {
  id: string | number;
  entity_type: string;
  title: string;
  description?: string;
  match_score: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

interface SearchHistory {
  query: string;
  timestamp: string;
  results_count: number;
}

interface SavedSearch {
  id: number;
  name: string;
  query: string;
  filters: Record<string, any>;
  created_at: string;
}

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { features, loading: permissionsLoading } = usePermissions();
  const { toasts, error, success, warning } = useToast();

  const entityTypes = [
    { value: 'pipeline', label: 'Pipelines', icon: Zap, color: 'text-blue-600' },
    { value: 'connector', label: 'Connectors', icon: Database, color: 'text-green-600' },
    { value: 'transformation', label: 'Transformations', icon: FileText, color: 'text-purple-600' },
    { value: 'user', label: 'Users', icon: User, color: 'text-orange-600' },
  ];

  // Load search history and saved searches
  useEffect(() => {
    loadSearchHistory();
    loadSavedSearches();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const response = await api.get('/search/history');
      setSearchHistory(response.data.history || []);
    } catch (err: any) {
      console.error('Failed to load search history:', err);
      error(err.message || 'Failed to load search history', 'Error');
    }
  };

  const loadSavedSearches = async () => {
    try {
      const response = await api.get('/search/saved');
      setSavedSearches(response.data.saved_searches || []);
    } catch (err: any) {
      console.error('Failed to load saved searches:', err);
      error(err.message || 'Failed to load saved searches', 'Error');
    }
  };

  const performSearch = async () => {
    if (!query.trim()) {
      warning('Please enter a search query', 'Warning');
      return;
    }

    setLoading(true);
    try {
      const params: any = { q: query };
      if (selectedTypes.length > 0) {
        params.entity_types = selectedTypes.join(',');
      }

      const response = await api.get('/search/global', { params });
      setResults(response.data.results || []);

      // Reload history after search
      loadSearchHistory();

      if (response.data.results.length === 0) {
        warning('No results found for your search', 'No Results');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      error(err.message || 'Failed to perform search', 'Error');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentSearch = async () => {
    const name = prompt('Enter a name for this search:');
    if (!name) return;

    try {
      await api.post('/search/saved', {
        name,
        query,
        filters: { entity_types: selectedTypes }
      });
      success('Search saved successfully', 'Success');
      loadSavedSearches();
    } catch (err: any) {
      console.error('Failed to save search:', err);
      error(err.message || 'Failed to save search', 'Error');
    }
  };

  const deleteSavedSearch = async (id: number) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return;

    try {
      await api.delete(`/search/saved/${id}`);
      success('Saved search deleted', 'Success');
      loadSavedSearches();
    } catch (err: any) {
      console.error('Failed to delete saved search:', err);
      error(err.message || 'Failed to delete saved search', 'Error');
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setQuery(search.query);
    setSelectedTypes(search.filters.entity_types || []);
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const getEntityIcon = (entityType: string) => {
    const entity = entityTypes.find(t => t.value === entityType);
    if (!entity) return FileText;
    return entity.icon;
  };

  const getEntityColor = (entityType: string) => {
    const entity = entityTypes.find(t => t.value === entityType);
    return entity?.color || 'text-gray-600';
  };

  // Check permission to view this page
  if (permissionsLoading) {
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

  if (!features?.search?.view) {
    return (
      <DashboardLayout>
        <AccessDenied message="You don't have permission to use search." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Search</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Search across all pipelines, connectors, transformations, and users
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h2>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={() => setSelectedTypes([])}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Entity Types
                </label>
                {entityTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => toggleType(type.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        selectedTypes.includes(type.value)
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-600'
                          : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${type.color}`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Bookmark className="w-5 h-5" />
                  Saved Searches
                </h2>
                <div className="space-y-2">
                  {savedSearches.map(search => (
                    <div
                      key={search.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <button
                        onClick={() => loadSavedSearch(search)}
                        className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600"
                      >
                        {search.name}
                      </button>
                      <button
                        onClick={() => deleteSavedSearch(search.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5" />
                  Recent Searches
                </h2>
                <div className="space-y-2">
                  {searchHistory.slice(0, 10).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(item.query)}
                      className="w-full text-left p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="text-sm text-gray-700 dark:text-gray-300">{item.query}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.results_count} results
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                    placeholder="Search for anything..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={performSearch}
                  disabled={!query.trim() || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
                {query && results.length > 0 && (
                  <button
                    onClick={saveCurrentSearch}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                )}
              </div>

              {selectedTypes.length > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Filtering by:</span>
                  {selectedTypes.map(type => (
                    <span
                      key={type}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                    >
                      {entityTypes.find(t => t.value === type)?.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or filters
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </div>
                {results.map(result => {
                  const Icon = getEntityIcon(result.entity_type);
                  const color = getEntityColor(result.entity_type);

                  return (
                    <div
                      key={`${result.entity_type}-${result.id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 ${color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {result.title}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded uppercase">
                              {result.entity_type}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {Math.round(result.match_score * 100)}% match
                            </span>
                          </div>
                          {result.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {result.description}
                            </p>
                          )}
                          {result.metadata && Object.keys(result.metadata).length > 0 && (
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              {Object.entries(result.metadata).slice(0, 3).map(([key, value]) => (
                                <span key={key}>
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
