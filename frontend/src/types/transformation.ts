export interface Transformation {
  id: number;
  name: string;
  description?: string;
  transformation_type: string;
  source_fields: string[];
  target_fields: string[];
  transformation_rules: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TransformationMetric {
  transformationId: number;
  name: string;
  isActive: boolean;
  recordsProcessed: number;
  successRate: number;
  lastRun: string;
}

export interface TransformationMetricsSummary {
  total: number;
  active: number;
  inactive: number;
  recordsProcessed: number;
  lastUpdated: string;
}

export interface TransformationMetricsResponse {
  summary: TransformationMetricsSummary;
  metrics: TransformationMetric[];
}