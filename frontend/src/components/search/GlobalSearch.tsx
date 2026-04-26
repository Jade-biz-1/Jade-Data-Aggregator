'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, BookmarkIcon, TrendingUp, FileText, Database, Zap } from 'lucide-react';

interface SearchResult {
  id: string | number;
  entity_type: string;
  title: string;
  description?: string;
  match_score: number;
  metadata?: Record<string, any>;
}

interface SearchSuggestion {
  query: string;
  frequency: number;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setsuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Search with debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Use the Next.js API proxy to avoid cross-origin fetch issues
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const response = await res.json();
      // Backend returns {results: {pipelines: [...], connectors: [...], ...}}
      const raw = response.results || {};
      const flat: SearchResult[] = Object.entries(raw).flatMap(
        ([entityType, items]: [string, any]) =>
          (items as any[]).map((item: any) => ({
            id: item.id,
            entity_type: item.type || entityType.replace(/s$/, ''),
            title: item.name || item.title || item.username || String(item.id),
            description: item.description || item.connector_type || '',
            match_score: 0.9,
            metadata: item,
          }))
      );
      setResults(flat.slice(0, 10));
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Load suggestions when opened with a query
  useEffect(() => {
    if (isOpen && query.trim().length >= 2) {
      loadSuggestions(query);
    } else if (!query) {
      setsuggestions([]);
    }
  }, [isOpen, query]);

  const loadSuggestions = async (partialQuery: string) => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(partialQuery)}&limit=5`);
      if (!res.ok) return;
      const data = await res.json();
      // Reuse the search proxy — show matching result titles as suggestions
      const raw = data.results || {};
      const titles = Object.values(raw).flatMap((items: any) =>
        (items as any[]).map((item: any) => ({ query: item.name || item.title || '' }))
      ).filter((s: any) => s.query).slice(0, 5);
      setsuggestions(titles);
    } catch {
      // suggestions are best-effort
    }
  };

  // Navigate to result — use routes that actually exist
  const handleSelect = (result: SearchResult) => {
    let path: string;
    switch (result.entity_type) {
      case 'pipeline':
        // Open in pipeline builder with the pipeline pre-loaded
        path = `/pipeline-builder?id=${result.id}`;
        break;
      case 'connector':
        path = `/connectors/configure?edit=${result.id}`;
        break;
      case 'transformation':
        path = '/transformations';
        break;
      case 'user':
        path = '/users';
        break;
      default:
        path = '/dashboard';
    }
    router.push(path);
    setIsOpen(false);
    setQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  // Get icon for entity type
  const getEntityIcon = (entityType: string) => {
    const icons: Record<string, any> = {
      pipeline: Zap,
      connector: Database,
      transformation: FileText,
      user: TrendingUp,
    };
    const Icon = icons[entityType] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">Search pipelines, connectors…</span>
        <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-semibold text-gray-800 bg-white dark:text-gray-200 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded flex-shrink-0">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div
        ref={searchRef}
        className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pipelines, connectors, transformations..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No results found for &quot;{query}&quot;
            </div>
          )}

          {!loading && query && results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.entity_type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    index === selectedIndex ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-1 text-gray-400">
                    {getEntityIcon(result.entity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {result.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                        {result.entity_type}
                      </span>
                    </div>
                    {result.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                        {result.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {Math.round(result.match_score * 100)}%
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions when no query */}
          {!query && suggestions.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Recent Searches
              </div>
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(suggestion.query)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {suggestion.query}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
              Select
            </span>
          </div>
          <button
            onClick={() => router.push('/search')}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <BookmarkIcon className="w-3 h-3" />
            Advanced Search
          </button>
        </div>
      </div>
    </div>
  );
}
