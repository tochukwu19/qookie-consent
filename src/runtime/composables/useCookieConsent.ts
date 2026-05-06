import { useState, useRuntimeConfig } from '#app'
import type { ConsentPreferences, ConsentRecord, CategoryConfig } from '../types'
import { readConsent, writeConsent } from '../utils/storage'
import { buildConsentRecord, isConsentStale } from '../utils/record'
import { migrateLegacyConsent } from '../utils/migrate'

export function useCookieConsent() {
  const config = useRuntimeConfig().public.qookie
  const categories = config.categories as CategoryConfig[]
  const storageKey = config.storageKey as string
  const auditEndpoint = config.auditEndpoint as string | undefined
  const moduleVersion = config.moduleVersion as string

  const decided = useState<boolean>('qookie:decided', () => false)
  const preferences = useState<ConsentPreferences>(
    'qookie:preferences',
    () => Object.fromEntries(categories.map(c => [c.key, c.required ?? false])),
  )
  const record = useState<ConsentRecord | null>('qookie:record', () => null)
  const showBanner = useState<boolean>('qookie:showBanner', () => false)
  const showModal = useState<boolean>('qookie:showModal', () => false)

  function hydrate() {
    const legacy = migrateLegacyConsent(storageKey)
    if (legacy) {
      decided.value = legacy.decided
      preferences.value = legacy.preferences
      const r = buildConsentRecord(legacy.preferences, categories, moduleVersion)
      record.value = r
      writeConsent(storageKey, { decided: legacy.decided, preferences: legacy.preferences, record: r })
      showBanner.value = !legacy.decided
      return
    }

    const stored = readConsent(storageKey)
    if (!stored) {
      _initDefaults()
      showBanner.value = true
      return
    }

    // Re-prompt if the category config changed since the last consent was given
    if (stored.record && isConsentStale(stored.record, categories)) {
      _initDefaults()
      showBanner.value = true
      return
    }

    decided.value = stored.decided
    preferences.value = stored.preferences
    record.value = stored.record ?? null
    showBanner.value = !stored.decided
  }

  function _initDefaults() {
    decided.value = false
    preferences.value = Object.fromEntries(categories.map(c => [c.key, c.required ?? false]))
    record.value = null
  }

  function saveConsent(prefs: ConsentPreferences) {
    const r = buildConsentRecord(prefs, categories, moduleVersion)

    decided.value = true
    preferences.value = prefs
    record.value = r
    showBanner.value = false
    showModal.value = false

    writeConsent(storageKey, { decided: true, preferences: prefs, record: r })

    if (auditEndpoint) {
      fetch(auditEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(r),
      }).catch(() => {})
    }
  }

  function acceptAll() {
    saveConsent(Object.fromEntries(categories.map(c => [c.key, true])))
  }

  function rejectAll() {
    saveConsent(Object.fromEntries(categories.map(c => [c.key, c.required ?? false])))
  }

  return {
    decided,
    preferences,
    record,
    showBanner,
    showModal,
    categories,
    hydrate,
    saveConsent,
    acceptAll,
    rejectAll,
    openModal: () => { showModal.value = true },
    closeModal: () => { showModal.value = false },
    isEnabled: (key: string) => preferences.value[key] ?? false,
  }
}
