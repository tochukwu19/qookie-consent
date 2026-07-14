# @qookie/vue

GDPR/NDPR cookie consent for **Astro, Vite + Vue, and any Vue 3 app**. Provides the
`QookieBanner` / `QookieModal` components, a `useCookieConsent()` composable, and a
`createQookie()` factory over the framework-agnostic [`@qookie/core`](../core).

> On Nuxt? Use [`@qookie/nuxt`](../nuxt) instead — it wraps this package with
> auto-imports, runtime config and SSR wiring.

- No third-party runtime dependencies (Vue is a peer dependency)
- Proof of consent, stale-config detection, cookie scanner — all from core
- Works across Astro islands via a single shared store

## Installation

```bash
pnpm add @qookie/vue vue
```

## Quick start — Vite + Vue (SPA)

Install the plugin once, then drop the banner into your root component.

```ts
// main.ts
import { createApp } from 'vue'
import { createQookie } from '@qookie/vue'
import App from './App.vue'

createApp(App)
  .use(createQookie({ privacyPolicyPath: '/privacy' }))
  .mount('#app')
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { QookieBanner } from '@qookie/vue'
</script>

<template>
  <RouterView />
  <QookieBanner />
</template>
```

## Quick start — Astro

Astro renders each island as its own Vue app, so install the shared store through
the Vue integration's `appEntrypoint`. That way the banner and any other island
(a footer "Cookie settings" button, a live status panel, …) resolve the **same**
consent state.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'

export default defineConfig({
  integrations: [vue({ appEntrypoint: '/src/_app.ts' })],
})
```

```ts
// src/qookie.ts — create the store once (module singleton)
import { createQookie } from '@qookie/vue'

export const qookie = createQookie({
  privacyPolicyPath: '/privacy-policy',
  // hydrate + scanner run when <QookieBanner> mounts
  autoBootstrap: false,
})
```

```ts
// src/_app.ts — install it for every island
import type { App } from 'vue'
import { qookie } from './qookie'

export default (app: App) => {
  app.use(qookie)
}
```

```astro
---
// src/layouts/Layout.astro
import { QookieBanner } from '@qookie/vue'
---
<html>
  <body>
    <slot />
    <QookieBanner client:load />
  </body>
</html>
```

## `createQookie(options)`

Creates the consent store and returns a Vue plugin (`app.use(...)`).

| Option | Type | Default | Description |
|---|---|---|---|
| `categories` | `CategoryConfig[]` | 4 defaults | Cookie categories shown in the modal |
| `storageKey` | `string` | `'qookie:consent'` | localStorage key |
| `privacyPolicyPath` | `string` | `'/privacy-policy'` | Banner hides on this path |
| `auditEndpoint` | `string` | – | POST target for each `ConsentRecord` |
| `declaredCookies` | `DeclaredCookie[]` | `[]` | Enables the cookie scanner |
| `labels` | `QookieLabels` | `{}` | Override any UI string (i18n) |
| `debug` | `boolean` | `false` | Log undeclared-cookie warnings |
| `version` | `string` | – | Recorded as the consent record's `bannerVersion` |
| `autoBootstrap` | `boolean` | `true` | Run hydrate + scanner on the client immediately |

## `useCookieConsent()`

Resolves the active store from any component (or module) after the plugin is
installed.

```ts
const {
  decided,      // Ref<boolean>
  preferences,  // Ref<{ [key]: boolean }>
  record,       // Ref<ConsentRecord | null>
  showBanner,   // Ref<boolean>
  showModal,    // Ref<boolean>
  categories,   // CategoryConfig[]
  acceptAll, rejectAll, saveConsent,
  openModal, closeModal, isEnabled,
} = useCookieConsent()
```

Gate your own code on it:

```ts
if (useCookieConsent().isEnabled('analytics')) loadAnalytics()
```

## Components

- **`<QookieBanner>`** — fixed bottom bar with equal-weight Reject / Manage / Accept.
  Props: `currentPath` (override the route path used for the privacy-page check)
  and `bootstrap` (set `false` when a host owns hydrate timing). Supports a
  `#message` slot for custom copy.
- **`<QookieModal>`** — per-category toggle modal, teleported to `<body>`.

## Theming

The UI is driven by CSS custom properties — set the ones you want in a global
stylesheet:

```css
:root {
  --qookie-font: 'Inter', sans-serif;
  --qookie-accent: #0f766e;
  --qookie-accent-fg: #ffffff;
  --qookie-bg: #ffffff;
  --qookie-text: #111827;
  --qookie-muted: #6b7280;
  --qookie-border: #e5e7eb;
  --qookie-radius: 6px;
}
```

Unlike `@qookie/nuxt`, this package does **not** auto-load a font — set
`--qookie-font` and load the font yourself.

## License

MIT
