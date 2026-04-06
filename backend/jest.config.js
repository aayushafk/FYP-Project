export default {
  testEnvironment: 'node',
  clearMocks: true,
  testMatch: ['**/tests/**/*.test.js'],
  transform: {},
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middlewares/**/*.js',
    'utils/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**'
  ]
};
