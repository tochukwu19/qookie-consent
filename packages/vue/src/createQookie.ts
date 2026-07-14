import type { App } from 'vue'
import type {
  CategoryConfig,
  ConsentStore,
  ConsentStoreConfig,
  DeclaredCookie,
  QookieLabels,
} from '@qookie/core'
import { bootstrapStore, createStore, QOOKIE_KEY } from './context'

/** Default GDPR/NDPR category set, mirrored from the Nuxt module defaults. */
export const defaultCategories: CategoryConfig[] = [
  { key: 'necessary', label: 'Necessary', description: 'Essential cookies required for the site to function.', required: true },
  { key: 'analytics', label: 'Analytics', description: 'Help us understand how visitors interact with the site.', required: false },
  { key: 'functional', label: 'Functional', description: 'Enable enhanced functionality like live chat.', required: false },
  { key: 'marketing', label: 'Marketing', description: 'Used to deliver relevant advertisements.', required: false },
]

export interface QookieOptions {
  categories?: CategoryConfig[]
  storageKey?: string
  privacyPolicyPath?: string
  auditEndpoint?: string
  declaredCookies?: DeclaredCookie[]
  labels?: QookieLabels
  /** Log undeclared-cookie warnings to the console. */
  debug?: boolean
  /** Recorded as the consent record's bannerVersion. */
  version?: string
  /** Run hydrate + scanner on the client immediately. Default true. */
  autoBootstrap?: boolean
}

export interface Qookie {
  store: ConsentStore
  install(app: App): void
}

export function resolveConfig(options: QookieOptions = {}): ConsentStoreConfig {
  return {
    categories: options.categories ?? defaultCategories,
    storageKey: options.storageKey ?? 'qookie:consent',
    privacyPolicyPath: options.privacyPolicyPath ?? '/privacy-policy',
    auditEndpoint: options.auditEndpoint,
    declaredCookies: options.declaredCookies ?? [],
    labels: options.labels ?? {},
    debug: options.debug ?? false,
    moduleVersion: options.version ?? '0.1.0',
  }
}

/**
 * Creates the Qookie consent store and returns a Vue plugin.
 *
 * ```ts
 * app.use(createQookie({ privacyPolicyPath: '/privacy' }))
 * ```
 */
export function createQookie(options: QookieOptions = {}): Qookie {
  const store = createStore(resolveConfig(options))
  if (options.autoBootstrap !== false) bootstrapStore(store)
  return {
    store,
    install(app: App) {
      app.provide(QOOKIE_KEY, store)
    },
  }
}
