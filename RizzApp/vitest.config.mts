import { defineConfig } from 'vitest/config';
export default defineConfig({ test: {
  include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 15000, hookTimeout: 30000, maxWorkers: 2,
  // React Native screen simulation uses the renderer matched to the installed React version.
  // Preserve all actual runtime warnings/errors; suppress this repeated package notice only.
  onConsoleLog: (log) => log.startsWith('react-test-renderer is deprecated.') ? false : undefined,
} });
