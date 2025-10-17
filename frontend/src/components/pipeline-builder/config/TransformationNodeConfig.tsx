'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TransformationNodeConfigProps {
  config: any;
  onChange: (config: any) => void;
  subtype: string;
}

export function TransformationNodeConfig({ config, onChange, subtype }: TransformationNodeConfigProps) {
  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  // Filter Transformation
  if (subtype === 'filter') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="condition">Filter Condition</Label>
          <Textarea
            id="condition"
            value={config.condition || ''}
            onChange={(e) => updateConfig('condition', e.target.value)}
            placeholder="age > 18 AND status == 'active'"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Expression to filter records (Python-like syntax)
          </p>
        </div>

        <div>
          <Label htmlFor="filter_type">Filter Type</Label>
          <select
            id="filter_type"
            value={config.filter_type || 'include'}
            onChange={(e) => updateConfig('filter_type', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="include">Include matching records</option>
            <option value="exclude">Exclude matching records</option>
          </select>
        </div>
      </div>
    );
  }

  // Map Transformation
  if (subtype === 'map') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Field Mappings</Label>
          <Textarea
            value={config.mappings || ''}
            onChange={(e) => updateConfig('mappings', e.target.value)}
            placeholder={'{\n  "new_field": "old_field",\n  "full_name": "first_name + last_name"\n}'}
            rows={6}
          />
          <p className="text-xs text-gray-500 mt-1">
            JSON object mapping target fields to source fields or expressions
          </p>
        </div>

        <div>
          <Label htmlFor="drop_unmapped">
            <input
              id="drop_unmapped"
              type="checkbox"
              checked={config.drop_unmapped || false}
              onChange={(e) => updateConfig('drop_unmapped', e.target.checked)}
              className="mr-2"
            />
            Drop unmapped fields
          </Label>
        </div>
      </div>
    );
  }

  // Aggregate Transformation
  if (subtype === 'aggregate') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="group_by">Group By Fields</Label>
          <Input
            id="group_by"
            type="text"
            value={config.group_by || ''}
            onChange={(e) => updateConfig('group_by', e.target.value)}
            placeholder="customer_id, region"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated field names</p>
        </div>

        <div>
          <Label>Aggregations</Label>
          <Textarea
            value={config.aggregations || ''}
            onChange={(e) => updateConfig('aggregations', e.target.value)}
            placeholder={'{\n  "total_sales": "SUM(amount)",\n  "avg_price": "AVG(price)",\n  "count": "COUNT(*)"\n}'}
            rows={6}
          />
          <p className="text-xs text-gray-500 mt-1">
            JSON object of aggregation functions
          </p>
        </div>
      </div>
    );
  }

  // Sort Transformation
  if (subtype === 'sort') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="sort_by">Sort By Field</Label>
          <Input
            id="sort_by"
            type="text"
            value={config.sort_by || ''}
            onChange={(e) => updateConfig('sort_by', e.target.value)}
            placeholder="created_at"
          />
        </div>

        <div>
          <Label htmlFor="order">Sort Order</Label>
          <select
            id="order"
            value={config.order || 'asc'}
            onChange={(e) => updateConfig('order', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    );
  }

  // Join Transformation
  if (subtype === 'join') {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="join_key">Join Key</Label>
          <Input
            id="join_key"
            type="text"
            value={config.join_key || ''}
            onChange={(e) => updateConfig('join_key', e.target.value)}
            placeholder="id"
          />
        </div>

        <div>
          <Label htmlFor="join_type">Join Type</Label>
          <select
            id="join_type"
            value={config.join_type || 'inner'}
            onChange={(e) => updateConfig('join_type', e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="inner">Inner Join</option>
            <option value="left">Left Join</option>
            <option value="right">Right Join</option>
            <option value="outer">Outer Join</option>
          </select>
        </div>
      </div>
    );
  }

  return <div className="text-gray-500">Unknown transformation type: {subtype}</div>;
}
