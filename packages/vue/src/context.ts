import { getCurrentInstance, inject, ref, type InjectionKey } from 'vue'
import {
  createConsentStore,
  type ConsentStore,
  type ConsentStoreConfig,
  type Ref,
  type RefFactory,
} from '@qookie-consent/core'

/** Vue injection key for a per-app consent store (optional override of the singleton). */
export const QOOKIE_KEY: InjectionKey<ConsentStore> = Symbol('qookie')

// Vue's `ref` is structurally compatible with core's RefFactory contract.
const vueRef = (<T>(value: T) => ref(value)) as RefFactory

// Module-level singleton. In Astro every island is its own Vue app, so
// provide/inject can't share state across islands — a singleton in the shared
// bundle can. SSR-safe because state is only mutated client-side after mount.
let activeStore: ConsentStore | null = null

export function createStore(config: ConsentStoreConfig): ConsentStore {
  activeStore = createConsentStore(config, vueRef)
  return activeStore
}

export function getActiveStore(): ConsentStore | null {
  return activeStore
}

/**
 * Resolves the store for a consumer: a provided (per-app) store wins inside a
 * component, otherwise the module singleton. Throws if neither exists.
 */
export function resolveStore(): ConsentStore {
  if (getCurrentInstance()) {
    const injected = inject(QOOKIE_KEY, null)
    if (injected) return injected
  }
  if (activeStore) return activeStore
  throw new Error(
    '[Qookie] No consent store found. Call createQookie(options) (and app.use it) '
    + 'before using useCookieConsent() or the Qookie components.',
  )
}

// Ensures hydrate + scanner run at most once per store, regardless of whether
// createQookie or a mounted component triggers it first.
const bootstrapped = new WeakSet<ConsentStore>()

export function bootstrapStore(store: ConsentStore): void {
  if (typeof window === 'undefined') return
  if (bootstrapped.has(store)) return
  bootstrapped.add(store)
  store.hydrate()
  store.startScanner()
}

// Exposed for test isolation.
export function _resetStore(): void {
  activeStore = null
}

export type { Ref }
