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