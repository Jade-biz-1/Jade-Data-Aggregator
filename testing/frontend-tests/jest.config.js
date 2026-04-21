const nextJest = require('next/jest')
const path = require('path')

// Keep dir relative — using an absolute path triggers wrong workspace-root
// detection caused by a stale /Users/Deepak/Public/package-lock.json file.
const createJestConfig = nextJest({
  dir: '../../frontend',
})

const frontendSrc = path.resolve(__dirname, '../../frontend/src')

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/../../frontend/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../frontend/src/$1',
    // Pin react to the test-runner copy to avoid the dual-React useState crash.
    '^react$': path.resolve(__dirname, 'node_modules/react'),
    '^react-dom$': path.resolve(__dirname, 'node_modules/react-dom'),
    '^react-dom/(.*)$': path.resolve(__dirname, 'node_modules/react-dom') + '/$1',
  },
  collectCoverageFrom: [
    frontendSrc + '/components/**/*.{js,jsx,ts,tsx}',
    frontendSrc + '/hooks/**/*.{js,jsx,ts,tsx}',
    frontendSrc + '/lib/**/*.{js,jsx,ts,tsx}',
    frontendSrc + '/services/**/*.{js,jsx,ts,tsx}',
    frontendSrc + '/contexts/**/*.{js,jsx,ts,tsx}',
    '!' + frontendSrc + '/**/*.d.ts',
    '!' + frontendSrc + '/**/*.stories.{js,jsx,ts,tsx}',
  ],
  // v8 coverage works from a subdirectory; babel instrumentation does not.
  coverageProvider: 'v8',
  coverageDirectory: path.resolve(__dirname, '../reports/coverage/frontend-unit'),
  coveragePathIgnorePatterns: ['/node_modules/', '/.next/'],
  testPathIgnorePatterns: ['/node_modules/', path.resolve(__dirname, 'e2e')],
}

module.exports = createJestConfig(customJestConfig)
