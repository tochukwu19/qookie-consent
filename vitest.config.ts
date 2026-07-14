import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Nuxt path aliases — resolved to stubs so vite doesn't reject the import.
      // Component tests mock these modules entirely via vi.mock in setup.ts.
      '#app': fileURLToPath(new URL('./tests/stubs/app.ts', import.meta.url)),
      '#imports': fileURLToPath(new URL('./tests/stubs/imports.ts', import.meta.url)),
    },
  },
  test: {
    // Scope to this package's own tests — each workspace package runs its own suite.
    include: ['tests/**/*.{test,spec}.ts'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/runtime/**/*.ts']
    }
  }
})
