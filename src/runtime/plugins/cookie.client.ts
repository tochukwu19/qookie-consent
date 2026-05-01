import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { useCookieConsent } from '../composables/useCookieConsent'
import { runScanner } from '../scanner'
import type { DeclaredCookie } from '../types'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.qookie
  const declared = (config.declaredCookies ?? []) as DeclaredCookie[]

  // Defer until after Vue's SSR hydration pass completes.
  // Calling hydrate() before this causes state to diverge from what the
  // server serialised, producing hydration text mismatches.
  nuxtApp.hook('app:mounted', () => {
    const { hydrate } = useCookieConsent()
    hydrate()

    if (declared.length > 0) {
      const stopScanner = runScanner(declared, (undeclared) => {
        if (import.meta.dev) {
          console.warn('[Qookie] Undeclared cookies detected:', undeclared)
          console.warn('[Qookie] Add these to the declaredCookies option in nuxt.config.ts')
        }
        window.dispatchEvent(new CustomEvent('qookie:undeclared', { detail: { undeclared } }))
      })
      window.addEventListener('beforeunload', stopScanner, { once: true })
    }
  })
})
