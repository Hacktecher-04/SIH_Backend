
module.exports = {
  testEnvironment: 'node',
  preset: '@shelf/jest-mongodb',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 30000,
};
