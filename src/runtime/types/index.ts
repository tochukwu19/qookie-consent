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

export interface ModuleOptions {
  storageKey?: string
  categories?: CategoryConfig[]
  privacyPolicyPath?: string
  auditEndpoint?: string
  declaredCookies?: DeclaredCookie[]
}

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    qookie: Required<ModuleOptions>
  }
}
