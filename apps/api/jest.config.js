// Birim testleri: src icindeki .spec.ts dosyalari.
// e2e testleri ayri yapilandirmada: test/jest-e2e.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testEnvironment: 'node',
  testRegex: '\.spec\.ts$',
  transform: {
    '^.+\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
};
