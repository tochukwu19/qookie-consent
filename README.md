# @qookie/nuxt

GDPR and NDPR cookie consent for Nuxt 3. Drop-in banner and preference modal, fully themeable, zero runtime dependencies.

- SSR-safe — state is serialised into the HTML payload, no hydration flicker
- Proof of consent — every decision is recorded with a UUID, timestamp, and config hash
- Cookie scanner — detects cookies on your site that aren't in your declared list
- Stale detection — re-prompts users automatically when your category config changes
- Headless-ready — use the composable directly if you want your own UI

---

## Installation

```bash
npm install @qookie/nuxt
# or
pnpm add @qookie/nuxt
```

Register the module in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@qookie/nuxt'],
})
```

That's it. The banner appears automatically on first visit.

---

## Quick start

Add `<QookieBanner />` to your root layout. It auto-hides on your privacy policy page.

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <slot />
    <QookieBanner />
  </div>
</template>
```

---

## Configuration

All options are set under the `qookie` key in `nuxt.config.ts`. Everything has sensible defaults so you only need to set what you want to change.

```ts
export default defineNuxtConfig({
  modules: ['@qookie/nuxt'],

  qookie: {
    storageKey: 'qookie:consent',
    privacyPolicyPath: '/privacy-policy',
    categories: [
      {
        key: 'necessary',
        label: 'Necessary',
        description: 'Essential cookies required for the site to function.',
        required: true,
      },
      {
        key: 'analytics',
        label: 'Analytics',
        description: 'Help us understand how visitors interact with the site.',
      },
      {
        key: 'marketing',
        label: 'Marketing',
        description: 'Used to deliver relevant advertisements.',
      },
    ],
    declaredCookies: [
      { name: '_ga', category: 'analytics', description: 'Google Analytics' },
      { name: '_gid', category: 'analytics', description: 'Google Analytics session' },
    ],
    auditEndpoint: 'https://your-api.com/consent-audit',
    loadPoppins: true,
    fontFamily: "'Poppins', sans-serif",
  },
})
```

### Options reference

| Option | Type | Default | Description |
|---|---|---|---|
| `storageKey` | `string` | `'qookie:consent'` | localStorage key where consent is stored |
| `privacyPolicyPath` | `string` | `'/privacy-policy'` | Banner is hidden on this route |
| `categories` | `CategoryConfig[]` | 4 defaults (see below) | Cookie categories shown in the modal |
| `declaredCookies` | `DeclaredCookie[]` | `[]` | Known cookies on your site — enables the scanner |
| `auditEndpoint` | `string` | `undefined` | POST endpoint that receives the consent record after every decision |
| `loadPoppins` | `boolean` | `true` | Auto-inject Poppins from Google Fonts |
| `fontFamily` | `string` | `"'Poppins', sans-serif"` | CSS font-family applied via `--qookie-font` |

### Default categories

If you don't set `categories`, these four are used:

| Key | Label | Required |
|---|---|---|
| `necessary` | Necessary | ✅ yes |
| `analytics` | Analytics | no |
| `functional` | Functional | no |
| `marketing` | Marketing | no |

---

## Theming

The UI is driven entirely by CSS custom properties on `:root`. Override any of them in your global stylesheet to match your brand.

```css
:root {
  --qookie-font: 'Inter', sans-serif;   /* font family */
  --qookie-accent: #0f766e;             /* buttons, toggles, links */
  --qookie-accent-fg: #ffffff;          /* text on accent-coloured buttons */
  --qookie-bg: #ffffff;                 /* banner and modal background */
  --qookie-text: #111827;               /* primary text */
  --qookie-muted: #6b7280;              /* descriptions and secondary text */
  --qookie-border: #e5e7eb;             /* dividers and button borders */
  --qookie-radius: 6px;                 /* border radius for buttons and modal */
}
```

### Using a different font

To turn off the automatic Poppins injection and use your own font:

```ts
qookie: {
  loadPoppins: false,
  fontFamily: "'Inter', sans-serif",
}
```

Then load the font yourself however you prefer (local, Google Fonts, etc.).

---

## Composable API

`useCookieConsent()` is auto-imported everywhere in your Nuxt app. You can use it to build your own UI, gate features behind consent, or read the current state.

```ts
const {
  // State (Ref)
  decided,      // boolean — true once the user has made any choice
  preferences,  // { [categoryKey]: boolean }
  record,       // ConsentRecord | null — the proof-of-consent object
  showBanner,   // boolean
  showModal,    // boolean
  categories,   // CategoryConfig[] from your nuxt.config

  // Actions
  acceptAll,    // accept every category
  rejectAll,    // reject all optional categories
  saveConsent,  // save a specific preferences object
  openModal,
  closeModal,
  isEnabled,    // (key: string) => boolean — check a single category
  hydrate,      // called automatically by the plugin — rarely needed directly
} = useCookieConsent()
```

### Gating a feature behind consent

```vue
<script setup lang="ts">
const { isEnabled } = useCookieConsent()
</script>

<template>
  <div v-if="isEnabled('analytics')">
    <!-- analytics widget -->
  </div>
</template>
```

### Loading a third-party script only after consent

```ts
const { decided, isEnabled } = useCookieConsent()

watch(decided, (hasDecided) => {
  if (hasDecided && isEnabled('analytics')) {
    useHead({ script: [{ src: 'https://www.googletagmanager.com/gtag/js' }] })
  }
}, { immediate: true })
```

### Custom banner / headless usage

You can skip `<QookieBanner />` entirely and build your own UI from the composable:

```vue
<template>
  <div v-if="showBanner" class="my-banner">
    <p>We use cookies.</p>
    <button @click="rejectAll">Reject</button>
    <button @click="acceptAll">Accept</button>
  </div>
</template>

<script setup lang="ts">
const { showBanner, acceptAll, rejectAll } = useCookieConsent()
</script>
```

---

## Proof of consent

Every time a user makes a decision, a `ConsentRecord` is created and stored alongside their preferences.

```ts
interface ConsentRecord {
  id: string           // UUID — unique per decision
  timestamp: string    // ISO 8601
  configHash: string   // hash of your category config at the time of consent
  bannerVersion: string
  preferences: { [categoryKey]: boolean }
}
```

Access it at runtime:

```ts
const { record } = useCookieConsent()
console.log(record.value)
// {
//   id: "3f2a1b...",
//   timestamp: "2025-01-15T10:23:00.000Z",
//   configHash: "1a2b3c4d",
//   bannerVersion: "0.1.0",
//   preferences: { necessary: true, analytics: false }
// }
```

### Sending records to your backend

Set `auditEndpoint` and every consent decision will be POSTed there automatically as JSON:

```ts
qookie: {
  auditEndpoint: 'https://your-api.com/consent-audit',
}
```

The full `ConsentRecord` is sent as the request body. Store these records if you need a server-side audit trail.

---

## Cookie scanner

When you provide `declaredCookies`, the module polls `document.cookie` every 3 seconds and warns you about any cookies present that aren't in your list.

```ts
qookie: {
  declaredCookies: [
    { name: '_ga',      category: 'analytics',  description: 'Google Analytics' },
    { name: '_gid',     category: 'analytics',  description: 'Google Analytics session' },
    { name: 'session',  category: 'necessary',  description: 'Session identifier' },
  ],
}
```

In development, undeclared cookies are logged to the console:

```
[Qookie] Undeclared cookies detected: ['auth_token']
[Qookie] Add these to the declaredCookies option in nuxt.config.ts
```

In all environments a `qookie:undeclared` custom event is dispatched on `window`, so you can handle it however you like:

```ts
window.addEventListener('qookie:undeclared', (e) => {
  console.warn('Undeclared cookies:', e.detail.undeclared)
})
```

> **Note:** `HttpOnly` cookies are intentionally invisible to JavaScript and will not appear in the scanner. This is correct — those cookies are set by your server and do not require client-side consent management.

---

## Stale consent detection

When you add, remove, or rename a cookie category after users have already given consent, Qookie automatically detects this and re-shows the banner so users can update their preferences.

This is handled via the `configHash` in the consent record — a deterministic hash of your category keys and `required` flags. If it doesn't match the current config on load, the stored consent is discarded.

No action is needed from you — it works automatically.

---

## Privacy policy page

The banner is automatically hidden when the user is on your `privacyPolicyPath` (default: `/privacy-policy`). Change the path to match your app:

```ts
qookie: {
  privacyPolicyPath: '/legal/privacy',
}
```

---

## Migrating from a previous version

If your app previously stored consent under a different localStorage key (e.g. `cookieConsent` from an older integration), Qookie will detect this on first load, migrate the data to the new key format, and remove the old key. No configuration needed.

---

## TypeScript

All types are exported from the package:

```ts
import type {
  ModuleOptions,
  CategoryConfig,
  DeclaredCookie,
  ConsentPreferences,
  ConsentRecord,
} from '@qookie/nuxt'
```

The `qookie` key in `nuxt.config.ts` is fully typed — your IDE will autocomplete all options.

---

## Components

Both components are auto-imported — no manual import needed.

### `<QookieBanner />`

The bottom bar that appears on first visit. Contains Reject all, Manage, and Accept all buttons. Opens `<QookieModal />` when Manage is clicked. Hidden on the privacy policy page.

### `<QookieModal />`

Per-category toggle modal. Required categories are shown as locked. Has Reject all and Save preferences actions. Teleports to `<body>` to avoid z-index issues.

---

## License

MIT
