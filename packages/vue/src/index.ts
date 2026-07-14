// @qookie-consent/vue — Vue 3 layer for Qookie cookie consent.

// Re-export core types + utilities so consumers need a single import.
export * from '@qookie-consent/core'

export { createQookie, resolveConfig, defaultCategories } from './createQookie'
export type { QookieOptions, Qookie } from './createQookie'
export { useCookieConsent } from './useCookieConsent'
export { QOOKIE_KEY, bootstrapStore, createStore, getActiveStore } from './context'

export { default as QookieBanner } from './components/QookieBanner.vue'
export { default as QookieModal } from './components/QookieModal.vue'
