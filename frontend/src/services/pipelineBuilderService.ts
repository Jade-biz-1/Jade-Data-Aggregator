/**
 * Pipeline Builder Service
 * Handles API calls for visual pipeline builder functionality
 */

import { Node, Edge } from 'reactflow';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

/**
 * Get authentication token from cookies
 */
function getAuthToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  return document.cookie
    .split('; ')
    .find(row => row.startsWith('access_token='))
    ?.split('=')[1];
}

/**
 * Get auth headers
 */
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Convert React Flow nodes/edges to backend pipeline definition
 */
function convertToBackendFormat(
  nodes: Node[],
  edges: Edge[],
  metadata: {
    name: string;
    description?: string;
    pipelineId?: number;
  }
) {
  // Extract source and destination configs from nodes
  const sourceNodes = nodes.filter(n =>
    n.type === 'source' ||
    (n.data as any).sourceType
  );
  const destNodes = nodes.filter(n =>
    n.type === 'destination' ||
    (n.data as any).destinationType
  );

  // Build source_config from source nodes
  const source_config = sourceNodes.length > 0
    ? {
        type: (sourceNodes[0].data as any).sourceType || 'unknown',
        config: (sourceNodes[0].data as any).config || {},
        ...(sourceNodes[0].data as any)
      }
    : { type: 'manual' };

  // Build destination_config from destination nodes
  const destination_config = destNodes.length > 0
    ? {
        type: (destNodes[0].data as any).destinationType || 'unknown',
        config: (destNodes[0].data as any).config || {},
        ...(destNodes[0].data as any)
      }
    : { type: 'manual' };

  return {
    name: metadata.name,
    description: metadata.description || '',
    pipeline_type: 'visual',
    visual_definition: {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type || 'default',
        position: n.position,
        data: n.data,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    },
    node_definitions: nodes,
    edge_definitions: edges,
    source_config,
    destination_config,
    is_active: true,
  };
}

/**
 * Convert backend pipeline to React Flow format
 */
function convertFromBackendFormat(pipeline: any): {
  nodes: Node[];
  edges: Edge[];
  metadata: {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
  };
} {
  const visualDef = pipeline.visual_definition || { nodes: [], edges: [] };

  return {
    nodes: (visualDef.nodes || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: n.data,
    })),
    edges: (visualDef.edges || []).map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
    metadata: {
      id: pipeline.id,
      name: pipeline.name,
      description: pipeline.description,
      is_active: pipeline.is_active,
      created_at: pipeline.created_at,
    },
  };
}

export const pipelineBuilderService = {
  /**
   * Save a new pipeline
   */
  async savePipeline(
    nodes: Node[],
    edges: Edge[],
    metadata: { name: string; description?: string }
  ): Promise<any> {
    const data = convertToBackendFormat(nodes, edges, metadata);

    const response = await fetch(`${API_URL}/pipelines`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to save pipeline' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Load a pipeline by ID
   */
  async loadPipeline(pipelineId: number): Promise<{
    nodes: Node[];
    edges: Edge[];
    metadata: {
      id: number;
      name: string;
      description?: string;
      is_active: boolean;
      created_at: string;
    };
  }> {
    const response = await fetch(`${API_URL}/pipelines/${pipelineId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to load pipeline' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    const pipeline = await response.json();
    return convertFromBackendFormat(pipeline);
  },

  /**
   * Update an existing pipeline
   */
  async updatePipeline(
    pipelineId: number,
    nodes: Node[],
    edges: Edge[],
    metadata: { name: string; description?: string }
  ): Promise<any> {
    const data = convertToBackendFormat(nodes, edges, { ...metadata, pipelineId });

    const response = await fetch(`${API_URL}/pipelines/${pipelineId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update pipeline' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Validate a pipeline definition
   */
  async validatePipeline(nodes: Node[], edges: Edge[]): Promise<{
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    const definition = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type || 'default',
        position: n.position,
        data: n.data,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    };

    const response = await fetch(`${API_URL}/pipeline-builder/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(definition),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Validation failed' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Dry-run a pipeline (test without real data)
   */
  async dryRunPipeline(pipelineId: number, nodes: Node[], edges: Edge[]): Promise<any> {
    const definition = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type || 'default',
        position: n.position,
        data: n.data,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    };

    const response = await fetch(`${API_URL}/pipeline-builder/dry-run/${pipelineId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(definition),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Dry-run failed' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Execute a pipeline
   */
  async executePipeline(pipelineId: number, nodes: Node[], edges: Edge[]): Promise<any> {
    const definition = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type || 'default',
        position: n.position,
        data: n.data,
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    };

    const response = await fetch(`${API_URL}/pipeline-builder/execute/${pipelineId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(definition),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Execution failed' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get execution state of a running pipeline
   */
  async getExecutionState(pipelineId: number): Promise<any> {
    const response = await fetch(`${API_URL}/pipeline-builder/execution-state/${pipelineId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to get execution state' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Cancel a running pipeline execution
   */
  async cancelExecution(pipelineId: number): Promise<any> {
    const response = await fetch(`${API_URL}/pipeline-builder/cancel/${pipelineId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to cancel execution' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get available pipeline templates
   */
  async getTemplates(): Promise<any[]> {
    const response = await fetch(`${API_URL}/pipeline-builder/templates`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to get templates' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Test a single node configuration
   */
  async testNode(nodeConfig: any): Promise<any> {
    const response = await fetch(`${API_URL}/pipeline-builder/test-node`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(nodeConfig),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Node test failed' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};
