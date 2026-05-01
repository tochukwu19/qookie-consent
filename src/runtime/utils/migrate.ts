import type { ConsentPreferences } from '../types'

const LEGACY_KEY = 'cookieConsent'

export interface LegacyConsent {
  decided: boolean
  preferences: ConsentPreferences
}

/**
 * Checks for a consent record written by the old Nuxt 2 implementation.
 * If found and the new key is not yet set, returns the legacy data for migration.
 * Always removes the legacy key after reading.
 */
export function migrateLegacyConsent(newKey: string): LegacyConsent | null {
  if (typeof window === 'undefined') return null

  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return null

  try {
    const legacy = JSON.parse(raw) as LegacyConsent

    // Don't overwrite an already-migrated new key
    if (localStorage.getItem(newKey) !== null) {
      localStorage.removeItem(LEGACY_KEY)
      return null
    }

    localStorage.removeItem(LEGACY_KEY)
    return legacy
  } catch {
    localStorage.removeItem(LEGACY_KEY)
    return null
  }
}
