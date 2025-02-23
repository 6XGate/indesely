import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    open: false,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup/database.ts'],
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    typecheck: {
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
      reporter: ['text', 'html', 'json-summary', 'json'],
      reportOnFailure: true,
      thresholds: {
        // Set the base thresholds to 90%, per-file.
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
        perFile: true,
        // Might enable one day, was already 100%
        // when thresholds were set.
        // autoUpdate: true,
      },
    },
  },
});
