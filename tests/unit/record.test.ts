import { describe, it, expect, vi } from 'vitest'
import { buildConsentRecord, isConsentStale, hashConfig } from '../../src/runtime/utils/record'
import type { CategoryConfig } from '../../src/runtime/types'

vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-1234' })

const categories: CategoryConfig[] = [
  { key: 'necessary', label: 'Necessary', description: '', required: true },
  { key: 'analytics', label: 'Analytics', description: '', required: false },
]

describe('buildConsentRecord', () => {
  it('returns a record with all required fields', () => {
    const prefs = { necessary: true, analytics: false }
    const r = buildConsentRecord(prefs, categories, '0.1.0')

    expect(r.id).toBe('test-uuid-1234')
    expect(r.preferences).toEqual(prefs)
    expect(r.bannerVersion).toBe('0.1.0')
    expect(r.configHash).toBeTruthy()
    expect(r.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('produces the same configHash for identical categories', () => {
    const a = buildConsentRecord({}, categories, '0.1.0')
    const b = buildConsentRecord({}, categories, '0.1.0')
    expect(a.configHash).toBe(b.configHash)
  })
})

describe('hashConfig', () => {
  it('differs when a category is added', () => {
    const extended = [...categories, { key: 'marketing', label: 'Marketing', description: '', required: false }]
    expect(hashConfig(categories)).not.toBe(hashConfig(extended))
  })

  it('differs when a required flag changes', () => {
    const modified = categories.map(c => c.key === 'analytics' ? { ...c, required: true } : c)
    expect(hashConfig(categories)).not.toBe(hashConfig(modified))
  })
})

describe('isConsentStale', () => {
  it('returns false when categories are unchanged', () => {
    const r = buildConsentRecord({}, categories, '0.1.0')
    expect(isConsentStale(r, categories)).toBe(false)
  })

  it('returns true when a category is added after consent was given', () => {
    const r = buildConsentRecord({}, categories, '0.1.0')
    const updated = [...categories, { key: 'marketing', label: 'Marketing', description: '', required: false }]
    expect(isConsentStale(r, updated)).toBe(true)
  })

  it('returns true when a required flag changes', () => {
    const r = buildConsentRecord({}, categories, '0.1.0')
    const updated = categories.map(c => c.key === 'analytics' ? { ...c, required: true } : c)
    expect(isConsentStale(r, updated)).toBe(true)
  })
})
