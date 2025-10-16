/**
 * Test Data Fixtures for E2E Tests
 * Phase 9B-1: E2E Testing Infrastructure
 */

export const TEST_USERS = {
  admin: {
    username: 'admin',
    password: 'admin123',  // Update with actual test password
    email: 'admin@dataaggregator.local',
    role: 'admin',
  },
  developer: {
    username: 'dev_user',
    password: 'dev123',
    email: 'dev@dataaggregator.local',
    role: 'developer',
  },
  viewer: {
    username: 'viewer_user',
    password: 'viewer123',
    email: 'viewer@dataaggregator.local',
    role: 'viewer',
  },
  executor: {
    username: 'exec_user',
    password: 'exec123',
    email: 'exec@dataaggregator.local',
    role: 'executor',
  },
  designer: {
    username: 'designer_user',
    password: 'designer123',
    email: 'designer@dataaggregator.local',
    role: 'designer',
  },
  executive: {
    username: 'exec_lead',
    password: 'executive123',
    email: 'executive@dataaggregator.local',
    role: 'executive',
  },
};

export const TEST_PIPELINE = {
  name: 'E2E Test Pipeline',
  description: 'Pipeline created during E2E testing',
  source_connector_id: 1,
  destination_connector_id: 2,
  transformation_id: 1,
  schedule: '0 0 * * *',  // Daily at midnight
  is_active: true,
};

export const TEST_CONNECTOR = {
  name: 'E2E Test Connector',
  connector_type: 'postgres',
  description: 'Connector created during E2E testing',
  config: {
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    username: 'testuser',
    password: 'testpass',
  },
  is_active: true,
};

export const TEST_TRANSFORMATION = {
  name: 'E2E Test Transformation',
  transformation_type: 'python',
  description: 'Transformation created during E2E testing',
  transformation_code: 'def transform(data):\n    return data',
  config: {},
};

export const NEW_USER_DATA = {
  username: 'new_test_user',
  email: 'newuser@dataaggregator.local',
  first_name: 'Test',
  last_name: 'User',
  password: 'newuser123',
  role: 'viewer',
  is_active: true,
};
