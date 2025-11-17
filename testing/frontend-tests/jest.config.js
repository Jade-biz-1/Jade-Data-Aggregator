const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: '../../frontend',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/../../frontend/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/unit'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../frontend/src/$1',
  },
  collectCoverageFrom: [
    '../../frontend/src/**/*.{js,jsx,ts,tsx}',
    '!../../frontend/src/**/*.d.ts',
    '!../../frontend/src/**/*.stories.{js,jsx,ts,tsx}',
    '!../../frontend/src/app/**',
  ],
  coverageDirectory: '<rootDir>/../reports/coverage/frontend-unit',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/e2e/',
  ],
}

module.exports = createJestConfig(customJestConfig)
