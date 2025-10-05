'use client';

import React, { useState, useEffect } from 'react';
import { Layers, TrendingUp, Database, Filter, Zap, Star, Users } from 'lucide-react';

interface PipelineTemplate {
  id?: number;
  name: string;
  description: string;
  category: string;
  use_count?: number;
  tags?: string[];
  template_definition?: any;
}

interface PipelineTemplateBrowserProps {
  onSelectTemplate: (template: PipelineTemplate) => void;
  onClose?: () => void;
}

export const PipelineTemplateBrowser: React.FC<PipelineTemplateBrowserProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [templates, setTemplates] = useState<PipelineTemplate[]>([]);
  const [builtinTemplates, setBuiltinTemplates] = useState<PipelineTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'builtin' | 'popular'>('builtin');

  useEffect(() => {
    fetchTemplates();
    fetchBuiltinTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(
        `${baseUrl}/api/v1/pipeline-templates/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuiltinTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      const response = await fetch(
        `${baseUrl}/api/v1/pipeline-templates/builtin`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBuiltinTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching builtin templates:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'etl':
        return <Database className="w-5 h-5" />;
      case 'elt':
        return <Layers className="w-5 h-5" />;
      case 'quality':
        return <Filter className="w-5 h-5" />;
      case 'streaming':
        return <Zap className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  const displayTemplates = view === 'builtin' ? builtinTemplates : templates;
  const filteredTemplates = selectedCategory
    ? displayTemplates.filter(t => t.category === selectedCategory)
    : displayTemplates;

  const categories = Array.from(new Set(displayTemplates.map(t => t.category)));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pipeline Templates</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose a template to get started quickly
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            )}
          </div>

          {/* View Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setView('builtin')}
              className={`px-4 py-2 rounded-lg font-medium ${
                view === 'builtin'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Built-in Templates
            </button>
            <button
              onClick={() => setView('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                view === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Templates
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap capitalize ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template, index) => (
                <button
                  key={template.id || index}
                  onClick={() => onSelectTemplate(template)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      {getCategoryIcon(template.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                          {template.category}
                        </span>
                        {template.use_count !== undefined && template.use_count > 0 && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {template.use_count} uses
                          </span>
                        )}
                      </div>
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
