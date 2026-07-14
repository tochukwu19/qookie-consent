import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createQookie } from '../src/createQookie'
import { useCookieConsent } from '../src/useCookieConsent'
import { _resetStore } from '../src/context'
import { hashConfig, type CategoryConfig, type StoredConsent } from '@qookie/core'

const testCategories: CategoryConfig[] = [
  { key: 'necessary', label: 'Necessary', description: 'Required cookies', required: true },
  { key: 'analytics', label: 'Analytics', description: 'Analytics cookies', required: false },
]

const STORAGE_KEY = 'qookie:consent'
const LEGACY_KEY = 'cookieConsent'
const currentHash = hashConfig(testCategories)

function setup() {
  createQookie({ categories: testCategories, version: '0.1.1', autoBootstrap: false })
  return useCookieConsent()
}

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
  _resetStore()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })
})

describe('useCookieConsent resolves the active store', () => {
  it('returns the store created by createQookie (singleton fallback outside a component)', () => {
    const s = setup()
    expect(typeof s.hydrate).toBe('function')
    expect(s.categories).toEqual(testCategories)
  })

  it('throws a helpful error when no store exists', () => {
    _resetStore()
    expect(() => useCookieConsent()).toThrow(/No consent store found/)
  })
})

describe('hydrate() — first visit', () => {
  it('shows the banner, decided false, defaults to required-only, record null', () => {
    const { hydrate, showBanner, decided, preferences, record } = setup()
    hydrate()
    expect(showBanner.value).toBe(true)
    expect(decided.value).toBe(false)
    expect(preferences.value).toEqual({ necessary: true, analytics: false })
    expect(record.value).toBeNull()
  })
})

describe('hydrate() — returning user', () => {
  it('hides the banner and restores decision + preferences + record', () => {
    storeConsent()
    const { hydrate, showBanner, decided, preferences, record } = setup()
    hydrate()
    expect(showBanner.value).toBe(false)
    expect(decided.value).toBe(true)
    expect(preferences.value).toEqual({ necessary: true, analytics: true })
    expect(record.value?.id).toBe('test-uuid')
  })

  it('shows the banner when stored consent was not decided', () => {
    storeConsent({ decided: false })
    const { hydrate, showBanner } = setup()
    hydrate()
    expect(showBanner.value).toBe(true)
  })
})

describe('hydrate() — stale consent', () => {
  it('re-prompts and resets when the category config changed', () => {
    storeConsent({
      record: {
        id: 'old-id',
        timestamp: '2025-01-01T00:00:00.000Z',
        configHash: 'stale-hash-abc',
        bannerVersion: '0.1.0',
        preferences: { necessary: true, analytics: true },
      },
    })
    const { hydrate, showBanner, decided, preferences } = setup()
    hydrate()
    expect(showBanner.value).toBe(true)
    expect(decided.value).toBe(false)
    expect(preferences.value).toEqual({ necessary: true, analytics: false })
  })
})

describe('hydrate() — legacy migration', () => {
  it('migrates decided + preferences and removes the legacy key', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ decided: true, preferences: { necessary: true, analytics: true } }))
    const { hydrate, decided, preferences, showBanner } = setup()
    hydrate()
    expect(decided.value).toBe(true)
    expect(preferences.value).toEqual({ necessary: true, analytics: true })
    expect(showBanner.value).toBe(false)
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('does not migrate when the new key already exists', () => {
    storeConsent({ preferences: { necessary: true, analytics: false } })
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ decided: true, preferences: { necessary: true, analytics: true } }))
    const { hydrate, preferences } = setup()
    hydrate()
    expect(preferences.value).toEqual({ necessary: true, analytics: false })
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
  })
})

describe('saveConsent()', () => {
  it('sets decided, updates preferences, hides banner + modal, persists', () => {
    const s = setup()
    s.showBanner.value = true
    s.showModal.value = true
    s.saveConsent({ necessary: true, analytics: true })
    expect(s.decided.value).toBe(true)
    expect(s.preferences.value).toEqual({ necessary: true, analytics: true })
    expect(s.showBanner.value).toBe(false)
    expect(s.showModal.value).toBe(false)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.decided).toBe(true)
    expect(stored.preferences).toEqual({ necessary: true, analytics: true })
  })

  it('builds a record with the expected shape', () => {
    const { saveConsent, record } = setup()
    saveConsent({ necessary: true, analytics: false })
    expect(record.value).toMatchObject({
      id: expect.any(String),
      timestamp: expect.any(String),
      configHash: currentHash,
      bannerVersion: '0.1.1',
      preferences: { necessary: true, analytics: false },
    })
  })

  it('posts to auditEndpoint when configured', () => {
    _resetStore()
    localStorage.clear()
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)
    createQookie({ categories: testCategories, version: '0.1.1', autoBootstrap: false, auditEndpoint: 'https://audit.example.com/consent' })
    useCookieConsent().saveConsent({ necessary: true, analytics: false })
    expect(fetchSpy).toHaveBeenCalledOnce()
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://audit.example.com/consent',
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } }),
    )
  })

  it('does not post when auditEndpoint is unset', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    setup().saveConsent({ necessary: true, analytics: false })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('acceptAll() / rejectAll()', () => {
  it('acceptAll enables every category and sets decided', () => {
    const { acceptAll, preferences, decided } = setup()
    acceptAll()
    expect(preferences.value).toEqual({ necessary: true, analytics: true })
    expect(decided.value).toBe(true)
  })

  it('rejectAll keeps only required categories and sets decided', () => {
    const { rejectAll, preferences, decided } = setup()
    rejectAll()
    expect(preferences.value).toEqual({ necessary: true, analytics: false })
    expect(decided.value).toBe(true)
  })
})

describe('isEnabled()', () => {
  it('reflects preferences and returns false for unknown keys', () => {
    const s = setup()
    s.saveConsent({ necessary: true, analytics: true })
    expect(s.isEnabled('analytics')).toBe(true)
    expect(s.isEnabled('nonexistent')).toBe(false)
  })
})

describe('openModal() / closeModal()', () => {
  it('toggles showModal', () => {
    const { openModal, closeModal, showModal } = setup()
    expect(showModal.value).toBe(false)
    openModal()
    expect(showModal.value).toBe(true)
    closeModal()
    expect(showModal.value).toBe(false)
  })
})
