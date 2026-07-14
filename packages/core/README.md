# @qookie-consent/core

The framework-agnostic core of [Qookie](../../README.md) — types, `localStorage`
persistence, the proof-of-consent record, legacy migration, the cookie scanner,
and a reactive-agnostic consent **store factory**. No framework, no dependencies.

Most people don't install this directly:

- **Nuxt** → [`@qookie-consent/nuxt`](../nuxt)
- **Astro / Vite + Vue / Vue 3** → [`@qookie-consent/vue`](../vue)

Reach for `@qookie-consent/core` when you're building an adapter for another framework
(React, Svelte, Solid, vanilla) or wiring the store into custom state management.

## Installation

```bash
pnpm add @qookie-consent/core
```

## The store factory

`createConsentStore(config, ref)` builds a framework-neutral store. You pass a
reactive `ref` factory — anything matching `<T>(value: T) => { value: T }`, which
is structurally compatible with Vue's `ref`, Vue `reactive` wrappers, or a tiny
shim for another framework.

```ts
import { createConsentStore } from '@qookie-consent/core'
import { ref } from 'vue' // or any compatible ref factory

const store = createConsentStore(
  {
    categories: [
      { key: 'necessary', label: 'Necessary', description: '…', required: true },
      { key: 'analytics', label: 'Analytics', description: '…' },
    ],
    storageKey: 'qookie:consent',
    moduleVersion: '1.0.0',
    privacyPolicyPath: '/privacy',
    declaredCookies: [{ name: '_ga', category: 'analytics' }],
  },
  ref,
)

store.hydrate()        // read localStorage / migrate legacy / decide banner state
store.startScanner()   // begin cookie scanning (returns a cleanup fn)

store.acceptAll()
store.isEnabled('analytics') // true
```

The returned store exposes reactive `decided`, `preferences`, `record`,
`showBanner`, `showModal`, plus `hydrate`, `saveConsent`, `acceptAll`,
`rejectAll`, `openModal`, `closeModal`, `isEnabled`, and `startScanner`.

## Also exported

Standalone helpers if you'd rather compose your own: `readConsent` /
`writeConsent` / `clearConsent`, `buildConsentRecord` / `isConsentStale` /
`hashConfig`, `migrateLegacyConsent`, `parseCookieNames` / `scanCookies` /
`runScanner`, and all types (`CategoryConfig`, `ConsentRecord`, `ConsentPreferences`,
`DeclaredCookie`, `QookieLabels`, `ConsentStore`, …).

## License

MIT
