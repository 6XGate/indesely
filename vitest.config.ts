import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup/database.ts'],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.test.json',
      include: ['tests/**/*.ts'],
    },
    browser: {
      provider: 'playwright',
      enabled: true,
      headless: true,
      screenshotFailures: false,
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
    },
    coverage: {
      exclude: ['src/compat.ts', ...coverageConfigDefaults.exclude],
    },
  },
});
