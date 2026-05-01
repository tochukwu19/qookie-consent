import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { useCookieConsent } from '../composables/useCookieConsent'
import { runScanner } from '../scanner'
import type { DeclaredCookie } from '../types'

export default defineNuxtPlugin(() => {
  const { hydrate } = useCookieConsent()
  hydrate()

  const config = useRuntimeConfig().public.qookie
  const declared = (config.declaredCookies ?? []) as DeclaredCookie[]

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
