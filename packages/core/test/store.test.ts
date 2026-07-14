import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createConsentStore } from '../src/store'
import type { ConsentStoreConfig, Ref } from '../src/store'
import type { CategoryConfig } from '../src/types'

// Minimal non-reactive ref factory — enough to exercise store logic.
const ref = <T>(value: T): Ref<T> => ({ value })

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
}

const categories: CategoryConfig[] = [
  { key: 'necessary', label: 'Necessary', description: '', required: true },
  { key: 'analytics', label: 'Analytics', description: '', required: false },
]

function makeConfig(overrides: Partial<ConsentStoreConfig> = {}): ConsentStoreConfig {
  return {
    categories,
    storageKey: 'qookie:consent',
    moduleVersion: '0.1.0',
    ...overrides,
  }
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k])
  vi.stubGlobal('localStorage', localStorageMock)
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })
})

describe('createConsentStore initial state', () => {
  it('defaults preferences to required flags and hides the banner', () => {
    const s = createConsentStore(makeConfig(), ref)
    expect(s.decided.value).toBe(false)
    expect(s.preferences.value).toEqual({ necessary: true, analytics: false })
    expect(s.showBanner.value).toBe(false)
  })
})

describe('hydrate', () => {
  it('shows the banner when nothing is stored', () => {
    const s = createConsentStore(makeConfig(), ref)
    s.hydrate()
    expect(s.showBanner.value).toBe(true)
    expect(s.decided.value).toBe(false)
  })

  it('restores a prior decision without showing the banner', () => {
    const s1 = createConsentStore(makeConfig(), ref)
    s1.saveConsent({ necessary: true, analytics: true })

    const s2 = createConsentStore(makeConfig(), ref)
    s2.hydrate()
    expect(s2.decided.value).toBe(true)
    expect(s2.preferences.value).toEqual({ necessary: true, analytics: true })
    expect(s2.showBanner.value).toBe(false)
  })

  it('re-prompts when the category config changed since consent (stale)', () => {
    const s1 = createConsentStore(makeConfig(), ref)
    s1.saveConsent({ necessary: true, analytics: true })

    const extended = [...categories, { key: 'marketing', label: 'Marketing', description: '', required: false }]
    const s2 = createConsentStore(makeConfig({ categories: extended }), ref)
    s2.hydrate()
    expect(s2.showBanner.value).toBe(true)
    expect(s2.decided.value).toBe(false)
  })

  it('migrates a legacy Nuxt 2 consent key', () => {
    store['cookieConsent'] = JSON.stringify({ decided: true, preferences: { necessary: true, analytics: true } })
    const s = createConsentStore(makeConfig(), ref)
    s.hydrate()
    expect(s.decided.value).toBe(true)
    expect(s.preferences.value).toEqual({ necessary: true, analytics: true })
    expect(store['cookieConsent']).toBeUndefined()
    expect(store['qookie:consent']).toBeTruthy()
  })
})

describe('actions', () => {
  it('saveConsent persists and updates state', () => {
    const s = createConsentStore(makeConfig(), ref)
    s.saveConsent({ necessary: true, analytics: false })
    expect(s.decided.value).toBe(true)
    expect(s.showBanner.value).toBe(false)
    expect(JSON.parse(store['qookie:consent']).preferences).toEqual({ necessary: true, analytics: false })
  })

  it('acceptAll enables every category', () => {
    const s = createConsentStore(makeConfig(), ref)
    s.acceptAll()
    expect(s.preferences.value).toEqual({ necessary: true, analytics: true })
  })

  it('rejectAll keeps only required categories', () => {
    const s = createConsentStore(makeConfig(), ref)
    s.rejectAll()
    expect(s.preferences.value).toEqual({ necessary: true, analytics: false })
  })

  it('isEnabled reflects current preferences', () => {
    const s = createConsentStore(makeConfig(), ref)
    s.acceptAll()
    expect(s.isEnabled('analytics')).toBe(true)
    expect(s.isEnabled('unknown')).toBe(false)
  })

  it('open/close modal toggles showModal', () => {
    const s = createConsentStore(makeConfig(), ref)
    s.openModal()
    expect(s.showModal.value).toBe(true)
    s.closeModal()
    expect(s.showModal.value).toBe(false)
  })

  it('posts to the audit endpoint on save when configured', () => {
    const fetchMock = vi.fn(() => Promise.resolve({} as Response))
    vi.stubGlobal('fetch', fetchMock)
    const s = createConsentStore(makeConfig({ auditEndpoint: 'https://audit.example/consent' }), ref)
    s.saveConsent({ necessary: true, analytics: true })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0][0]).toBe('https://audit.example/consent')
  })
})

describe('startScanner', () => {
  it('returns undefined when no cookies are declared', () => {
    const s = createConsentStore(makeConfig(), ref)
    expect(s.startScanner()).toBeUndefined()
  })

  it('returns a cleanup function when cookies are declared', () => {
    vi.stubGlobal('document', { cookie: '' })
    const s = createConsentStore(
      makeConfig({ declaredCookies: [{ name: '_ga', category: 'analytics' }] }),
      ref,
    )
    const stop = s.startScanner()
    expect(typeof stop).toBe('function')
    stop?.()
  })
})
