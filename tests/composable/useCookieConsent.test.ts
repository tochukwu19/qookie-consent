import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import type { CategoryConfig, StoredConsent } from '../../src/runtime/types'
import { hashConfig } from '../../src/runtime/utils/record'

// Use the real composable — setup.ts mocks it globally, this overrides for this file
vi.mock('../../src/runtime/composables/useCookieConsent', async () =>
  vi.importActual('../../src/runtime/composables/useCookieConsent'),
)

const testCategories: CategoryConfig[] = [
  { key: 'necessary', label: 'Necessary', description: 'Required cookies', required: true },
  { key: 'analytics', label: 'Analytics', description: 'Analytics cookies', required: false },
]

// Mutable — tests set auditEndpoint etc. before calling the composable
const qookieConfig = {
  storageKey: 'qookie:consent',
  privacyPolicyPath: '/privacy-policy',
  categories: testCategories,
  declaredCookies: [] as never[],
  auditEndpoint: undefined as string | undefined,
  moduleVersion: '0.1.1',
  labels: {},
}

// Real useState — same key returns same ref within a test, reset between tests
const stateStore = new Map<string, Ref<unknown>>()

vi.mock('#app', () => ({
  useState: <T>(key: string, init?: () => T): Ref<T> => {
    if (!stateStore.has(key)) stateStore.set(key, ref(init?.()))
    return stateStore.get(key)! as Ref<T>
  },
  useRuntimeConfig: () => ({ public: { qookie: qookieConfig } }),
  useRoute: () => ({ path: '/' }),
  defineNuxtPlugin: (fn: () => unknown) => fn,
}))

// Helpers
const STORAGE_KEY = 'qookie:consent'
const LEGACY_KEY = 'cookieConsent'
const currentHash = hashConfig(testCategories)

function storeConsent(overrides: Partial<StoredConsent> = {}) {
  const base: StoredConsent = {
    decided: true,
    preferences: { necessary: true, analytics: true },
    record: {
      id: 'test-uuid',
      timestamp: '2025-01-01T00:00:00.000Z',
      configHash: currentHash,
      bannerVersion: '0.1.1',
      preferences: { necessary: true, analytics: true },
    },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...base, ...overrides }))
}

beforeEach(() => {
  stateStore.clear()
  localStorage.clear()
  qookieConfig.auditEndpoint = undefined
  vi.restoreAllMocks()
})

// Lazy import so the mock above is in place before the module loads
const { useCookieConsent } = await import('../../src/runtime/composables/useCookieConsent')

// ─── hydrate() ────────────────────────────────────────────────────────────────

describe('hydrate() — first visit', () => {
  it('shows the banner', () => {
    const { hydrate, showBanner } = useCookieConsent()
    hydrate()
    expect(showBanner.value).toBe(true)
  })

  it('decided remains false', () => {
    const { hydrate, decided } = useCookieConsent()
    hydrate()
    expect(decided.value).toBe(false)
  })

  it('preferences default to required-only', () => {
    const { hydrate, preferences } = useCookieConsent()
    hydrate()
    expect(preferences.value).toEqual({ necessary: true, analytics: false })
  })

  it('record stays null', () => {
    const { hydrate, record } = useCookieConsent()
    hydrate()
    expect(record.value).toBeNull()
  })
})

describe('hydrate() — returning user, valid consent', () => {
  it('hides the banner', () => {
    storeConsent()
    const { hydrate, showBanner } = useCookieConsent()
    hydrate()
    expect(showBanner.value).toBe(false)
  })

  it('restores decided', () => {
    storeConsent({ decided: true })
    const { hydrate, decided } = useCookieConsent()
    hydrate()
    expect(decided.value).toBe(true)
  })

  it('restores preferences', () => {
    storeConsent({ preferences: { necessary: true, analytics: true } })
    const { hydrate, preferences } = useCookieConsent()
    hydrate()
    expect(preferences.value).toEqual({ necessary: true, analytics: true })
  })

  it('restores the consent record', () => {
    storeConsent()
    const { hydrate, record } = useCookieConsent()
    hydrate()
    expect(record.value).not.toBeNull()
    expect(record.value?.id).toBe('test-uuid')
  })

  it('shows banner when decided is false in stored consent', () => {
    storeConsent({ decided: false })
    const { hydrate, showBanner } = useCookieConsent()
    hydrate()
    expect(showBanner.value).toBe(true)
  })
})

describe('hydrate() — stale consent (category config changed)', () => {
  it('re-shows the banner', () => {
    storeConsent({
      record: {
        id: 'old-id',
        timestamp: '2025-01-01T00:00:00.000Z',
        configHash: 'stale-hash-abc',
        bannerVersion: '0.1.0',
        preferences: { necessary: true, analytics: true },
      },
    })
    const { hydrate, showBanner } = useCookieConsent()
    hydrate()
    expect(showBanner.value).toBe(true)
  })

  it('resets decided to false', () => {
    storeConsent({
      record: {
        id: 'old-id',
        timestamp: '2025-01-01T00:00:00.000Z',
        configHash: 'stale-hash-abc',
        bannerVersion: '0.1.0',
        preferences: { necessary: true, analytics: true },
      },
    })
    const { hydrate, decided } = useCookieConsent()
    hydrate()
    expect(decided.value).toBe(false)
  })

  it('resets preferences to defaults', () => {
    storeConsent({
      record: {
        id: 'old-id',
        timestamp: '2025-01-01T00:00:00.000Z',
        configHash: 'stale-hash-abc',
        bannerVersion: '0.1.0',
        preferences: { necessary: true, analytics: true },
      },
    })
    const { hydrate, preferences } = useCookieConsent()
    hydrate()
    expect(preferences.value).toEqual({ necessary: true, analytics: false })
  })
})

describe('hydrate() — legacy migration', () => {
  it('migrates decided from legacy key', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ decided: true, preferences: { necessary: true, analytics: false } }))
    const { hydrate, decided } = useCookieConsent()
    hydrate()
    expect(decided.value).toBe(true)
  })

  it('migrates preferences from legacy key', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ decided: true, preferences: { necessary: true, analytics: true } }))
    const { hydrate, preferences } = useCookieConsent()
    hydrate()
    expect(preferences.value).toEqual({ necessary: true, analytics: true })
  })

  it('removes the legacy key after migration', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ decided: true, preferences: { necessary: true } }))
    const { hydrate } = useCookieConsent()
    hydrate()
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('hides banner when legacy consent was decided', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ decided: true, preferences: { necessary: true } }))
    const { hydrate, showBanner } = useCookieConsent()
    hydrate()
    expect(showBanner.value).toBe(false)
  })

  it('shows banner when legacy consent was not decided', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ decided: false, preferences: { necessary: true } }))
    const { hydrate, showBanner } = useCookieConsent()
    hydrate()
    expect(showBanner.value).toBe(true)
  })

  it('does not migrate when new key already exists', () => {
    storeConsent({ preferences: { necessary: true, analytics: false } })
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ decided: true, preferences: { necessary: true, analytics: true } }))
    const { hydrate, preferences } = useCookieConsent()
    hydrate()
    // Should use the new key, not the legacy one
    expect(preferences.value).toEqual({ necessary: true, analytics: false })
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
  })
})

// ─── saveConsent() ────────────────────────────────────────────────────────────

describe('saveConsent()', () => {
  it('sets decided to true', () => {
    const { saveConsent, decided } = useCookieConsent()
    saveConsent({ necessary: true, analytics: false })
    expect(decided.value).toBe(true)
  })

  it('updates preferences', () => {
    const { saveConsent, preferences } = useCookieConsent()
    saveConsent({ necessary: true, analytics: true })
    expect(preferences.value).toEqual({ necessary: true, analytics: true })
  })

  it('hides the banner', () => {
    const { saveConsent, showBanner } = useCookieConsent()
    showBanner.value = true
    saveConsent({ necessary: true, analytics: false })
    expect(showBanner.value).toBe(false)
  })

  it('hides the modal', () => {
    const { saveConsent, showModal } = useCookieConsent()
    showModal.value = true
    saveConsent({ necessary: true, analytics: false })
    expect(showModal.value).toBe(false)
  })

  it('creates a record with correct shape', () => {
    const { saveConsent, record } = useCookieConsent()
    saveConsent({ necessary: true, analytics: false })
    expect(record.value).toMatchObject({
      id: expect.any(String),
      timestamp: expect.any(String),
      configHash: currentHash,
      bannerVersion: '0.1.1',
      preferences: { necessary: true, analytics: false },
    })
  })

  it('persists consent to localStorage', () => {
    const { saveConsent } = useCookieConsent()
    saveConsent({ necessary: true, analytics: true })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.decided).toBe(true)
    expect(stored.preferences).toEqual({ necessary: true, analytics: true })
  })

  it('posts to auditEndpoint when set', async () => {
    qookieConfig.auditEndpoint = 'https://audit.example.com/consent'
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)

    const { saveConsent } = useCookieConsent()
    saveConsent({ necessary: true, analytics: false })

    expect(fetchSpy).toHaveBeenCalledOnce()
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://audit.example.com/consent',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('does not post when auditEndpoint is not set', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { saveConsent } = useCookieConsent()
    saveConsent({ necessary: true, analytics: false })

    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

// ─── acceptAll() ──────────────────────────────────────────────────────────────

describe('acceptAll()', () => {
  it('sets all categories to true', () => {
    const { acceptAll, preferences } = useCookieConsent()
    acceptAll()
    expect(preferences.value).toEqual({ necessary: true, analytics: true })
  })

  it('sets decided to true', () => {
    const { acceptAll, decided } = useCookieConsent()
    acceptAll()
    expect(decided.value).toBe(true)
  })
})

// ─── rejectAll() ──────────────────────────────────────────────────────────────

describe('rejectAll()', () => {
  it('sets only required categories to true', () => {
    const { rejectAll, preferences } = useCookieConsent()
    rejectAll()
    expect(preferences.value).toEqual({ necessary: true, analytics: false })
  })

  it('sets decided to true', () => {
    const { rejectAll, decided } = useCookieConsent()
    rejectAll()
    expect(decided.value).toBe(true)
  })
})

// ─── isEnabled() ──────────────────────────────────────────────────────────────

describe('isEnabled()', () => {
  it('returns true for an enabled category', () => {
    const { saveConsent, isEnabled } = useCookieConsent()
    saveConsent({ necessary: true, analytics: true })
    expect(isEnabled('analytics')).toBe(true)
  })

  it('returns false for a disabled category', () => {
    const { saveConsent, isEnabled } = useCookieConsent()
    saveConsent({ necessary: true, analytics: false })
    expect(isEnabled('analytics')).toBe(false)
  })

  it('returns false for an unknown key', () => {
    const { isEnabled } = useCookieConsent()
    expect(isEnabled('nonexistent')).toBe(false)
  })
})

// ─── openModal() / closeModal() ───────────────────────────────────────────────

describe('openModal() / closeModal()', () => {
  it('openModal sets showModal to true', () => {
    const { openModal, showModal } = useCookieConsent()
    expect(showModal.value).toBe(false)
    openModal()
    expect(showModal.value).toBe(true)
  })

  it('closeModal sets showModal to false', () => {
    const { openModal, closeModal, showModal } = useCookieConsent()
    openModal()
    closeModal()
    expect(showModal.value).toBe(false)
  })
})
