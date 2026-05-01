import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readConsent, writeConsent, clearConsent } from '../../src/runtime/utils/storage'
import type { StoredConsent } from '../../src/runtime/types'

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

const makeRecord = (): StoredConsent => ({
  decided: true,
  preferences: { necessary: true, analytics: false },
  record: {
    id: 'test-id',
    timestamp: '2026-01-01T00:00:00.000Z',
    configHash: 'abc123',
    bannerVersion: '0.1.0',
    preferences: { necessary: true, analytics: false },
  },
})

describe('readConsent', () => {
  it('returns null when key is absent', () => {
    expect(readConsent('qookie:consent')).toBeNull()
  })

  it('parses and returns stored data', () => {
    const data = makeRecord()
    store['qookie:consent'] = JSON.stringify(data)
    expect(readConsent('qookie:consent')).toEqual(data)
  })

  it('returns null on malformed JSON', () => {
    store['qookie:consent'] = '{bad json'
    expect(readConsent('qookie:consent')).toBeNull()
  })
})

describe('writeConsent', () => {
  it('serialises and stores the record', () => {
    const data = makeRecord()
    writeConsent('qookie:consent', data)
    expect(JSON.parse(store['qookie:consent'])).toEqual(data)
  })
})

describe('clearConsent', () => {
  it('removes the key from storage', () => {
    store['qookie:consent'] = '{}'
    clearConsent('qookie:consent')
    expect(store['qookie:consent']).toBeUndefined()
  })
})
