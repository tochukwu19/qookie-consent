import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { ref } from 'vue'
import { createConsentStore } from '@qookie/core'
import { QOOKIE_KEY, bootstrapStore } from '@qookie/vue'
import type { RuntimeModuleOptions } from '../types'

// Universal plugin: the store must be provided during SSR (components render
// server-side) as well as on the client. State is only mutated after mount, so
// the per-request store stays at defaults on the server — no cross-request leak.
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.qookie as RuntimeModuleOptions

  const store = createConsentStore(
    {
      categories: config.categories,
      storageKey: config.storageKey,
      moduleVersion: config.moduleVersion,
      auditEndpoint: config.auditEndpoint,
      privacyPolicyPath: config.privacyPolicyPath,
      labels: config.labels,
      declaredCookies: config.declaredCookies,
      debug: import.meta.dev,
    },
    ref,
  )

  // Provide the per-request store so useCookieConsent() / the components resolve
  // it via inject rather than the module singleton.
  nuxtApp.vueApp.provide(QOOKIE_KEY, store)

  // Defer hydrate + scanner until after Vue's hydration pass to avoid mismatches.
  if (import.meta.client) {
    nuxtApp.hook('app:mounted', () => bootstrapStore(store))
  }
})
