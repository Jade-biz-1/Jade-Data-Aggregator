export interface SchemaField {
  name: string;
  data_type: string;
  nullable?: boolean;
  primary_key?: boolean;
  foreign_key?: string | null;
  description?: string;
}

export interface SchemaTable {
  name: string;
  fields: SchemaField[];
  description?: string;
}

export interface SchemaData {
  tables?: SchemaTable[];
  fields?: SchemaField[];
  schema_name?: string;
  source_type?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SchemaDefinition {
  id: number;
  name: string;
  source_type: string;
  schema_data: SchemaData;
  description?: string;
  created_at?: string;
}

export interface SchemaSummaryResponse {
  schemas: SchemaDefinition[];
  total_count?: number;
}

export interface SchemaFieldMapping {
  source_field?: string;
  destination_field: string;
  mapping_type: string;
  transformation?: Record<string, unknown> | null;
  condition?: Record<string, unknown> | null;
  description?: string;
}

export interface SchemaMapping {
  id: number;
  name: string;
  source_schema_id: number;
  destination_schema_id: number;
  field_mappings: SchemaFieldMapping[];
  is_validated?: boolean;
  validation_errors?: string[] | null;
  created_at?: string;
}

export interface SchemaMappingCreateResponse {
  id: number;
  name: string;
  source_schema_id: number;
  destination_schema_id: number;
  field_mappings: SchemaFieldMapping[];
  created_at?: string;
}

export interface SchemaMappingValidationResult {
  is_valid: boolean;
  errors: string[] | null;
}

export interface SchemaMappingCodeResponse {
  language: 'python' | 'sql';
  code: string;
  generated_at: string;
}
