'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TrendData {
  timestamp: string;
  value: number;
  predicted?: number;
}

interface TrendChartProps {
  data: TrendData[];
  title?: string;
  dataKey?: string;
  trendDirection?: 'up' | 'down' | 'stable';
  percentChange?: number;
  showPrediction?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title = 'Trend Analysis',
  dataKey = 'value',
  trendDirection = 'stable',
  percentChange = 0,
  showPrediction = false
}) => {
  const getTrendColor = () => {
    if (trendDirection === 'up') return '#10b981'; // green
    if (trendDirection === 'down') return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return '↑';
    if (trendDirection === 'down') return '↓';
    return '→';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium px-2 py-1 rounded"
            style={{
              backgroundColor: `${getTrendColor()}20`,
              color: getTrendColor()
            }}
          >
            {getTrendIcon()} {Math.abs(percentChange).toFixed(1)}%
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="timestamp"
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
          />
          <Legend />

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={getTrendColor()}
            strokeWidth={2}
            dot={{ fill: getTrendColor(), r: 4 }}
            activeDot={{ r: 6 }}
            name="Actual"
          />

          {showPrediction && (
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#9ca3af', r: 3 }}
              name="Predicted"
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          Trend: <span className="font-medium" style={{ color: getTrendColor() }}>
            {trendDirection.charAt(0).toUpperCase() + trendDirection.slice(1)}
          </span>
          {' '}with {Math.abs(percentChange).toFixed(1)}% change
        </p>
      </div>
    </div>
  );
};
