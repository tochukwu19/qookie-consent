import type {
  CategoryConfig,
  ConsentPreferences,
  ConsentRecord,
  DeclaredCookie,
  QookieLabels,
} from './types'
import { readConsent, writeConsent } from './storage'
import { buildConsentRecord, isConsentStale } from './record'
import { migrateLegacyConsent } from './migrate'
import { runScanner } from './scanner'

/**
 * Minimal reactive-ref contract. Structurally compatible with Vue's `ref`,
 * so `@qookie-consent/vue` can pass Vue's `ref` directly while core stays dep-free.
 */
export interface Ref<T> {
  value: T
}

export type RefFactory = <T>(value: T) => Ref<T>

/** Resolved, framework-neutral configuration the store operates on. */
export interface ConsentStoreConfig {
  categories: CategoryConfig[]
  storageKey: string
  moduleVersion: string
  auditEndpoint?: string
  privacyPolicyPath?: string
  labels?: QookieLabels
  declaredCookies?: DeclaredCookie[]
  /** When true, undeclared-cookie warnings are logged to the console. */
  debug?: boolean
}

export interface ConsentStore {
  // reactive state
  decided: Ref<boolean>
  preferences: Ref<ConsentPreferences>
  record: Ref<ConsentRecord | null>
  showBanner: Ref<boolean>
  showModal: Ref<boolean>
  // resolved config passthrough
  config: ConsentStoreConfig
  categories: CategoryConfig[]
  // actions
  hydrate: () => void
  saveConsent: (prefs: ConsentPreferences) => void
  acceptAll: () => void
  rejectAll: () => void
  openModal: () => void
  closeModal: () => void
  isEnabled: (key: string) => boolean
  /**
   * Starts the cookie scanner (no-op when no cookies are declared or when not
   * in a browser). Returns a cleanup function, or undefined if nothing started.
   */
  startScanner: (onUndeclared?: (names: string[]) => void) => (() => void) | undefined
}

function defaultPreferences(categories: CategoryConfig[]): ConsentPreferences {
  return Object.fromEntries(categories.map(c => [c.key, c.required ?? false]))
}

/**
 * Builds a framework-neutral consent store. Pass a reactive `ref` factory
 * (e.g. Vue's `ref`) so the returned state is reactive in the host framework.
 */
export function createConsentStore(config: ConsentStoreConfig, ref: RefFactory): ConsentStore {
  const { categories, storageKey, auditEndpoint, moduleVersion } = config

  const decided = ref<boolean>(false)
  const preferences = ref<ConsentPreferences>(defaultPreferences(categories))
  const record = ref<ConsentRecord | null>(null)
  const showBanner = ref<boolean>(false)
  const showModal = ref<boolean>(false)

  function initDefaults() {
    decided.value = false
    preferences.value = defaultPreferences(categories)
    record.value = null
  }

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
      initDefaults()
      showBanner.value = true
      return
    }

    // Re-prompt if the category config changed since the last consent was given
    if (stored.record && isConsentStale(stored.record, categories)) {
      initDefaults()
      showBanner.value = true
      return
    }

    decided.value = stored.decided
    preferences.value = stored.preferences
    record.value = stored.record ?? null
    showBanner.value = !stored.decided
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
    saveConsent(defaultPreferences(categories))
  }

  function startScanner(onUndeclared?: (names: string[]) => void): (() => void) | undefined {
    if (typeof window === 'undefined') return undefined
    const declared = config.declaredCookies ?? []
    if (declared.length === 0) return undefined

    return runScanner(declared, (undeclared) => {
      if (config.debug) {
        console.warn('[Qookie] Undeclared cookies detected:', undeclared)
        console.warn('[Qookie] Add these to the declaredCookies option')
      }
      window.dispatchEvent(new CustomEvent('qookie:undeclared', { detail: { undeclared } }))
      onUndeclared?.(undeclared)
    })
  }

  return {
    decided,
    preferences,
    record,
    showBanner,
    showModal,
    config,
    categories,
    hydrate,
    saveConsent,
    acceptAll,
    rejectAll,
    openModal: () => { showModal.value = true },
    closeModal: () => { showModal.value = false },
    isEnabled: (key: string) => preferences.value[key] ?? false,
    startScanner,
  }
}
