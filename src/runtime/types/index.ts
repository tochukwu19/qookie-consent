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

export interface ModuleOptions {
  storageKey?: string
  categories?: CategoryConfig[]
  privacyPolicyPath?: string
  auditEndpoint?: string
  declaredCookies?: DeclaredCookie[]
  labels?: QookieLabels
  /** CSS font-family value applied via --qookie-font. Defaults to 'Poppins', sans-serif. */
  fontFamily?: string
  /**
   * Inject Poppins (400/500/600) from Google Fonts automatically.
   * Set to false when using a self-hosted font or a different provider.
   * Defaults to true.
   */
  loadPoppins?: boolean
}

export interface RuntimeModuleOptions {
  storageKey: string
  categories: CategoryConfig[]
  privacyPolicyPath: string
  auditEndpoint: string | undefined
  declaredCookies: DeclaredCookie[]
  labels: QookieLabels
  moduleVersion: string
}

declare module 'nuxt/schema' {
  interface NuxtConfig {
    qookie?: ModuleOptions
  }
  interface PublicRuntimeConfig {
    qookie: RuntimeModuleOptions
  }
}
