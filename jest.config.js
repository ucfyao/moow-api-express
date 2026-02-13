module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  globalSetup: '<rootDir>/tests/setup.js',
  globalTeardown: '<rootDir>/tests/teardown.js',
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  // Transform ESM-only packages (uuid v13+, etc.)
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  transform: {
    '^.+\\.js$': ['babel-jest', { plugins: ['@babel/plugin-transform-modules-commonjs'] }],
  },
  collectCoverageFrom: [
    'app/**/*.js',
    '!app/utils/logger.js',
    '!app/utils/swagger.js',
    '!app/schedulers/**',
    '!app/views/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
};
