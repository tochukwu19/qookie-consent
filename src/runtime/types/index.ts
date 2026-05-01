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
  /** CSS font-family value applied via --qookie-font. Defaults to 'Poppins', sans-serif. */
  fontFamily?: string
  /**
   * Inject Poppins (400/500/600) from Google Fonts automatically.
   * Set to false when using a self-hosted font or a different provider.
   * Defaults to true.
   */
  loadPoppins?: boolean
}

/** Options exposed to runtime code — font settings are build-time only. */
export type RuntimeModuleOptions = Required<Omit<ModuleOptions, 'fontFamily' | 'loadPoppins'>>

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    qookie: RuntimeModuleOptions
  }
}
