/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        module: 'commonjs',
        moduleResolution: 'node',
      },
    }],
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
    '!src/app/page.tsx',
    '!src/app/*/page.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/api/**/*.ts',
    '!src/lib/useGame.ts',
    '!src/components/game/**/*.tsx',
    '!src/components/PlayerAvatar.tsx',
    '!src/components/PlayerList.tsx',
    '!src/components/ScoreList.tsx',
    '!src/components/TimerBar.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 45,
      lines: 45,
      statements: 45,
    },
  },
};

module.exports = config;
