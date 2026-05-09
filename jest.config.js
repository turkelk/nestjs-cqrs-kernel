/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^jwks-rsa$': '<rootDir>/../../__mocks__/jwks-rsa.js',
  },
  collectCoverageFrom: ['**/*.ts', '!**/index.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
