import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    // The published `@tightknitai/slack-block-kit-validator@0.1.0-alpha.0`
    // ships ESM with extensionless re-exports (`./helpers/foo` rather
    // than `./helpers/foo.js`). Inlining it through Vite's transformer
    // gets Vite's resolver to add the missing extensions. Drop once the
    // validator ships a fixed build.
    server: {
      deps: {
        inline: [/@tightknitai\/slack-block-kit-validator/]
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx']
    }
  }
});
