import { describe, it, expect, beforeEach, vi } from 'vitest'
import { migrateLegacyConsent } from '../src/migrate'

const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
}

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k])
  vi.stubGlobal('localStorage', localStorageMock)
})

describe('migrateLegacyConsent', () => {
  it('returns null when no legacy key exists', () => {
    expect(migrateLegacyConsent('qookie:consent')).toBeNull()
  })

  it('returns legacy preferences when found and new key is absent', () => {
    const legacy = { decided: true, preferences: { necessary: true, analytics: true } }
    store['cookieConsent'] = JSON.stringify(legacy)

    const result = migrateLegacyConsent('qookie:consent')
    expect(result).toEqual(legacy)
  })

  it('removes the legacy key after reading', () => {
    store['cookieConsent'] = JSON.stringify({ decided: true, preferences: {} })
    migrateLegacyConsent('qookie:consent')
    expect(store['cookieConsent']).toBeUndefined()
  })

  it('returns null without overwriting when new key already exists', () => {
    store['cookieConsent'] = JSON.stringify({ decided: true, preferences: { necessary: true } })
    store['qookie:consent'] = JSON.stringify({ decided: true, preferences: { necessary: true } })

    const result = migrateLegacyConsent('qookie:consent')
    expect(result).toBeNull()
  })

  it('removes legacy key on malformed JSON', () => {
    store['cookieConsent'] = '{bad json'
    migrateLegacyConsent('qookie:consent')
    expect(store['cookieConsent']).toBeUndefined()
  })
})
