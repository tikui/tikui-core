module.exports = {
  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
    'ts',
    'tsx'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': require.resolve('ts-jest')
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,ts}', '!src/tikui-core.ts'],
  coverageReporters: ['html', 'json-summary', 'text-summary', 'lcov', 'clover'],
};
