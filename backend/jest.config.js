module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/database/{migrate,seed}.js'],
  coverageDirectory: 'coverage',
  clearMocks: true,
};

