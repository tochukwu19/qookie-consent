import type { ConsentStore } from '@qookie/core'
import { resolveStore } from './context'

/**
 * Returns the active consent store: reactive state (`decided`, `preferences`,
 * `record`, `showBanner`, `showModal`) plus actions (`hydrate`, `saveConsent`,
 * `acceptAll`, `rejectAll`, `openModal`, `closeModal`, `isEnabled`).
 */
export function useCookieConsent(): ConsentStore {
  return resolveStore()
}
