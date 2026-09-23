/**
 * e2e jest yapilandirmasi.
 *
 * JSON degil JS: yapilandirmada regex var ve JSON'da ters bolu kacislari
 * ("\\.") sessizce bozuluyordu.
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testEnvironment: 'node',
  testRegex: '\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  // Uygulama modulleri yuklenmeden once .env.test'i devreye alir.
  setupFiles: ['<rootDir>/test/load-env.ts'],
  testTimeout: 30000,
  // Testler ayni veritabanini paylasiyor; paralel calisirlarsa
  // birbirlerinin kayitlarini gorup kararsiz sonuc verirler.
  maxWorkers: 1,
};
