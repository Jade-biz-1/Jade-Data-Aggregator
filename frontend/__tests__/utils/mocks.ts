// Mock data for testing
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

export const mockPermissions = [
  'read:users',
  'write:users',
  'delete:users',
  'read:pipelines',
  'write:pipelines',
  'execute:pipelines',
  'read:connectors',
  'write:connectors',
  'read:transformations',
  'write:transformations',
  'admin:system',
]

export const mockSessionInfo = {
  user: mockUser,
  permissions: mockPermissions,
  role: 'admin',
}

// Mock Axios
export const createMockAxios = () => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
      },
    },
  }
}

// Mock Cookie
export const mockCookies = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}

// Helper to mock successful API responses
export const mockApiSuccess = (data: any) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
})

// Helper to mock API errors
export const mockApiError = (message: string, status = 400) => ({
  response: {
    data: { detail: message },
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  },
})
