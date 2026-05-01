import type { StoredConsent } from '../types'

export function readConsent(key: string): StoredConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as StoredConsent
  } catch {
    return null
  }
}

export function writeConsent(key: string, consent: StoredConsent): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(consent))
}

export function clearConsent(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}
