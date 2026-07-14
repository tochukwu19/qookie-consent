export type CategoryKey = string

export interface CategoryConfig {
  key: CategoryKey
  label: string
  description: string
  required?: boolean
}

export interface DeclaredCookie {
  name: string
  category: CategoryKey
  description?: string
}

export interface ConsentPreferences {
  [key: CategoryKey]: boolean
}

export interface ConsentRecord {
  id: string
  timestamp: string
  configHash: string
  bannerVersion: string
  preferences: ConsentPreferences
}

export interface StoredConsent {
  decided: boolean
  preferences: ConsentPreferences
  record: ConsentRecord
}

export interface QookieLabels {
  banner?: {
    message?: string
    learnMore?: string
    acceptAll?: string
    rejectAll?: string
    manage?: string
  }
  modal?: {
    title?: string
    close?: string
    savePreferences?: string
    rejectAll?: string
  }
}
