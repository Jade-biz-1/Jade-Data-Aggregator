/**
 * Tests for BarChart, LineChart, and PieChart components.
 * These wrap Recharts, so we mock Recharts to focus on our wrapper logic
 * (loading state, error state, height, legend, and grid pass-through).
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Recharts so we don't need a canvas environment
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="recharts-bar-chart">{children}</div>,
    Bar: ({ dataKey, name }: any) => <div data-testid={`bar-${dataKey}`} data-name={name} />,
    LineChart: ({ children }: any) => <div data-testid="recharts-line-chart">{children}</div>,
    Line: ({ dataKey, name }: any) => <div data-testid={`line-${dataKey}`} data-name={name} />,
    PieChart: ({ children }: any) => <div data-testid="recharts-pie-chart">{children}</div>,
    Pie: ({ data }: any) => <div data-testid="recharts-pie" data-length={data?.length} />,
    Cell: ({ fill }: any) => <div data-testid="recharts-cell" data-fill={fill} />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

import { BarChart } from '../bar-chart';
import { LineChart } from '../line-chart';
import { PieChart } from '../pie-chart';

const timeData = [
  { date: '2025-01', sales: 100, costs: 60 },
  { date: '2025-02', sales: 150, costs: 80 },
];

// ────────────────── BarChart ──────────────────
describe('BarChart', () => {
  const barProps = {
    data: timeData,
    xKey: 'date',
    bars: [
      { key: 'sales', name: 'Sales', color: '#3b82f6' },
      { key: 'costs', name: 'Costs', color: '#ef4444' },
    ],
  };

  it('renders a ResponsiveContainer', () => {
    render(<BarChart {...barProps} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders the Recharts BarChart element', () => {
    render(<BarChart {...barProps} />);
    expect(screen.getByTestId('recharts-bar-chart')).toBeInTheDocument();
  });

  it('renders a Bar element for each bar definition', () => {
    render(<BarChart {...barProps} />);
    expect(screen.getByTestId('bar-sales')).toBeInTheDocument();
    expect(screen.getByTestId('bar-costs')).toBeInTheDocument();
  });

  it('shows loading state when isLoading=true', () => {
    const { container } = render(<BarChart {...barProps} isLoading />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByTestId('recharts-bar-chart')).not.toBeInTheDocument();
  });

  it('shows error message when error prop is set', () => {
    render(<BarChart {...barProps} error="No bar data" />);
    expect(screen.getByText('No bar data')).toBeInTheDocument();
    expect(screen.queryByTestId('recharts-bar-chart')).not.toBeInTheDocument();
  });

  it('renders legend by default', () => {
    render(<BarChart {...barProps} />);
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('does not render legend when showLegend=false', () => {
    render(<BarChart {...barProps} showLegend={false} />);
    expect(screen.queryByTestId('legend')).not.toBeInTheDocument();
  });

  it('renders CartesianGrid by default', () => {
    render(<BarChart {...barProps} />);
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
  });

  it('does not render CartesianGrid when showGrid=false', () => {
    render(<BarChart {...barProps} showGrid={false} />);
    expect(screen.queryByTestId('cartesian-grid')).not.toBeInTheDocument();
  });
});

// ────────────────── LineChart ──────────────────
describe('LineChart', () => {
  const lineProps = {
    data: timeData,
    xKey: 'date',
    lines: [
      { key: 'sales', name: 'Sales', color: '#3b82f6' },
      { key: 'costs', name: 'Costs', color: '#ef4444' },
    ],
  };

  it('renders a ResponsiveContainer', () => {
    render(<LineChart {...lineProps} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders the Recharts LineChart element', () => {
    render(<LineChart {...lineProps} />);
    expect(screen.getByTestId('recharts-line-chart')).toBeInTheDocument();
  });

  it('renders a Line element for each line definition', () => {
    render(<LineChart {...lineProps} />);
    expect(screen.getByTestId('line-sales')).toBeInTheDocument();
    expect(screen.getByTestId('line-costs')).toBeInTheDocument();
  });

  it('shows loading state when isLoading=true', () => {
    const { container } = render(<LineChart {...lineProps} isLoading />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when error is set', () => {
    render(<LineChart {...lineProps} error="Line error" />);
    expect(screen.getByText('Line error')).toBeInTheDocument();
  });

  it('renders legend by default', () => {
    render(<LineChart {...lineProps} />);
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('does not render legend when showLegend=false', () => {
    render(<LineChart {...lineProps} showLegend={false} />);
    expect(screen.queryByTestId('legend')).not.toBeInTheDocument();
  });
});

// ────────────────── PieChart ──────────────────
describe('PieChart', () => {
  const pieProps = {
    data: [
      { status: 'active', count: 70 },
      { status: 'inactive', count: 30 },
    ],
    nameKey: 'status',
    valueKey: 'count',
    colors: ['#22c55e', '#ef4444'],
  };

  it('renders a ResponsiveContainer', () => {
    render(<PieChart {...pieProps} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders the Recharts PieChart element', () => {
    render(<PieChart {...pieProps} />);
    expect(screen.getByTestId('recharts-pie-chart')).toBeInTheDocument();
  });

  it('renders the Pie element', () => {
    render(<PieChart {...pieProps} />);
    expect(screen.getByTestId('recharts-pie')).toBeInTheDocument();
  });

  it('shows loading state when isLoading=true', () => {
    const { container } = render(<PieChart {...pieProps} isLoading />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error when error is set', () => {
    render(<PieChart {...pieProps} error="Pie error" />);
    expect(screen.getByText('Pie error')).toBeInTheDocument();
  });

  it('renders legend by default', () => {
    render(<PieChart {...pieProps} />);
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('does not render legend when showLegend=false', () => {
    render(<PieChart {...pieProps} showLegend={false} />);
    expect(screen.queryByTestId('legend')).not.toBeInTheDocument();
  });
});
