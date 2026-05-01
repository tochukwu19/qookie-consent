import type { CategoryConfig, ConsentPreferences, ConsentRecord } from '../types'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Deterministic hash of category keys + required flags.
// Changes when the category config is updated so stale consent can be detected.
export function hashConfig(categories: CategoryConfig[]): string {
  const str = categories.map(c => `${c.key}:${String(c.required ?? false)}`).join(',')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return (hash >>> 0).toString(16)
}

export function buildConsentRecord(
  preferences: ConsentPreferences,
  categories: CategoryConfig[],
  version: string,
): ConsentRecord {
  return {
    id: uuid(),
    timestamp: new Date().toISOString(),
    configHash: hashConfig(categories),
    bannerVersion: version,
    preferences,
  }
}

export function isConsentStale(record: ConsentRecord, categories: CategoryConfig[]): boolean {
  return record.configHash !== hashConfig(categories)
}
