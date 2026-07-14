import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'

// appEntrypoint runs for every Vue island — we install the shared Qookie store
// there so all islands resolve the same consent state.
export default defineConfig({
  integrations: [vue({ appEntrypoint: '/src/_app.ts' })],
})
