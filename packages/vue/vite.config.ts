import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'
import { fileURLToPath } from 'node:url'

// Library build: bundle everything reachable from src/index.ts into a SINGLE
// ESM file with the SFCs compiled in and their scoped CSS injected at runtime.
// Shipping one self-contained module (rather than raw .vue + per-file .mjs) is
// what guarantees a consumer's bundler instantiates the package — and therefore
// the shared store singleton / QOOKIE_KEY — exactly once.
export default defineConfig({
  plugins: [
    vue(),
    cssInjectedByJs(),
    dts({ include: ['src'], tsconfigPath: './tsconfig.json' }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      // Keep the reactive runtime and the core logic as peer/dep imports.
      external: ['vue', '@qookie-consent/core'],
    },
    minify: false,
    sourcemap: true,
  },
})
