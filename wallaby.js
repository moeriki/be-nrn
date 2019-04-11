'use strict';

module.exports = function configureWallabyJs({ compilers }) {
  return {
    compilers: {
      '**/*.ts': compilers.typeScript({ isolatedModules: true }),
    },
    env: { runner: 'node', type: 'node' },
    files: ['tsconfig.json', 'src/**/*.ts', '!src/*.spec.ts'],
    testFramework: 'jest',
    tests: ['src/*.spec.ts'],
  };
};
