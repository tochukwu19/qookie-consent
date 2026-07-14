import type { CategoryConfig, DeclaredCookie, QookieLabels } from '@qookie/core'

export type { CategoryConfig, DeclaredCookie, QookieLabels } from '@qookie/core'

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
