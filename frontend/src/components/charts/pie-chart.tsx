'use client';

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BaseChartContainer } from './base-chart';

interface PieChartProps {
  data: any[];
  nameKey: string;
  valueKey: string;
  colors: string[];
  isLoading?: boolean;
  error?: string | null;
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
}

export function PieChart({
  data,
  nameKey,
  valueKey,
  colors,
  isLoading = false,
  error = null,
  height = 300,
  showLegend = true,
  innerRadius = 0
}: PieChartProps) {
  return (
    <BaseChartContainer isLoading={isLoading} error={error} minHeight={`${height}px`}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={80}
            paddingAngle={2}
            label={(entry) => `${entry[nameKey]}: ${entry[valueKey]}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          {showLegend && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </BaseChartContainer>
  );
}
