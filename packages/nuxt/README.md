# @qookie/nuxt

GDPR and NDPR cookie consent for Nuxt 3 and Nuxt 4. Drop-in banner and preference modal, fully themeable, no third-party runtime dependencies.

> Not on Nuxt? The same banner, modal and store work in Astro, Vite + Vue and any Vue 3 app via [`@qookie/vue`](../vue).

- SSR-safe — the store is provided during SSR; consent hydrates from localStorage after mount, so there's no hydration mismatch
- Proof of consent — every decision is recorded with a UUID, timestamp, and config hash
- Cookie scanner — detects cookies on your site that aren't in your declared list
- Stale detection — re-prompts users automatically when your category config changes
- Headless-ready — use the composable directly if you want your own UI

---

## How it works — read this first

Installing and configuring this module gives you:

- A **consent banner** that appears on first visit
- A **preferences modal** where users manage their choices per category
- A **composable** (`useCookieConsent`) that exposes the current consent state

**What the module does not do automatically:**

- It does not block or gate any scripts, cookies, or network requests on its own
- It does not load or prevent third-party tools from running

**Gating is your responsibility.** The module surfaces consent state — you decide what to do with it. The typical pattern is:

```ts
const { isEnabled } = useCookieConsent()

if (isEnabled('analytics')) {
  loadGoogleAnalytics() // your code — runs only if the user consented
}
```

This is intentional. Cookie consent tools that intercept scripts automatically tend to break SSR, create race conditions, and are fragile. Explicit gating in your own code is more reliable and easier to debug.

---

## Installation

```bash
npm install @qookie/nuxt
# or
pnpm add @qookie/nuxt
```

Register the module in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@qookie/nuxt'],
})
```

Add `<QookieBanner />` to your root layout:

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <slot />
    <QookieBanner />
  </div>
</template>
```

The banner will appear on first visit. That's the minimum setup.

---

## Realistic end-to-end example

This is what a real integration looks like: install, configure categories, style it, and gate a third-party script.

**1. Configure your categories in `nuxt.config.ts`**

```ts
export default defineNuxtConfig({
  modules: ['@qookie/nuxt'],

  qookie: {
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
        description: 'Help us understand how visitors use the site.',
      },
      {
        key: 'marketing',
        label: 'Marketing',
        description: 'Used to deliver relevant advertisements.',
      },
    ],
  },
})
```

**2. Add the banner to your layout**

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <slot />
    <QookieBanner />
  </div>
</template>
```

**3. Style it to match your brand**

Add these CSS variables to your global stylesheet. Only set the ones you want to change — all have defaults.

```css
/* assets/main.css */
:root {
  --qookie-accent: #your-brand-color;
  --qookie-bg: #ffffff;
  --qookie-radius: 8px;
}
```

Make sure this file is loaded globally. In `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  css: ['~/assets/main.css'],
  // ...
})
```

**4. Gate a third-party script behind consent**

```vue
<!-- app.vue or a layout -->
<script setup lang="ts">
const { decided, isEnabled } = useCookieConsent()

watch(decided, (hasDecided) => {
  if (hasDecided && isEnabled('analytics')) {
    useHead({
      script: [{ src: 'https://www.googletagmanager.com/gtag/js', async: true }],
    })
  }
}, { immediate: true })
</script>
```

The `watch` with `{ immediate: true }` means it also runs on page load for returning users who have already decided. `decided` becomes `true` once the user has made any choice — either from this session or from localStorage on a previous visit.

---

## Configuration

All options go under the `qookie` key in `nuxt.config.ts`. Everything has defaults so you only set what you need.

### Options reference

| Option | Type | Default | Description |
|---|---|---|---|
| `storageKey` | `string` | `'qookie:consent'` | localStorage key where consent is stored |
| `privacyPolicyPath` | `string` | `'/privacy-policy'` | Banner is hidden on this route |
| `categories` | `CategoryConfig[]` | 4 defaults (see below) | Cookie categories shown in the modal |
| `declaredCookies` | `DeclaredCookie[]` | `[]` | Known cookies on your site — enables the scanner |
| `auditEndpoint` | `string` | `undefined` | POST endpoint that receives the consent record after every decision |
| `labels` | `QookieLabels` | `{}` | Override any UI string — see [Language / i18n](#language--i18n) |
| `loadPoppins` | `boolean` | `true` | Auto-inject Poppins from Google Fonts |
| `fontFamily` | `string` | `"'Poppins', sans-serif"` | CSS font-family applied via `--qookie-font` |

### Default categories

When `categories` is not set, these four are used:

| Key | Label | Required |
|---|---|---|
| `necessary` | Necessary | ✅ yes |
| `analytics` | Analytics | no |
| `functional` | Functional | no |
| `marketing` | Marketing | no |

---

## Theming

The UI is driven entirely by CSS custom properties. Set them in your global stylesheet — there is no theme config object or prop system.

```css
/* assets/main.css */
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

If you don't have a global CSS file yet, create `assets/main.css` and register it:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['~/assets/main.css'],
})
```

### Using a different font

Turn off the automatic Poppins injection and provide your own font-family:

```ts
qookie: {
  loadPoppins: false,
  fontFamily: "'Inter', sans-serif",
}
```

Then load the font yourself — via `nuxt.config.ts` head links, a CSS `@import`, or however your project manages fonts.

---

## Language / i18n

All UI strings have English defaults and can be overridden via the `labels` option in `nuxt.config.ts`. None of the keys are required — only set the ones you want to change.

```ts
qookie: {
  labels: {
    banner: {
      message: 'Nous utilisons des cookies pour améliorer votre expérience.',
      learnMore: 'En savoir plus',
      acceptAll: 'Tout accepter',
      rejectAll: 'Tout refuser',
      manage: 'Gérer',
    },
    modal: {
      title: 'Préférences de cookies',
      close: 'Fermer',
      savePreferences: 'Sauvegarder',
      rejectAll: 'Tout refuser',
    },
  },
}
```

### Custom banner HTML (`#message` slot)

For full control over banner message markup — rich text, inline links, or a custom privacy notice — use the `#message` slot on `<QookieBanner />`. When the slot is provided, the `labels.banner.message` and `labels.banner.learnMore` options are ignored.

```vue
<QookieBanner>
  <template #message>
    We use cookies to improve your experience.
    Read our <a href="/privacy-policy">privacy policy</a> and
    <a href="/cookie-policy">cookie policy</a>.
  </template>
</QookieBanner>
```

---

## Composable API

`useCookieConsent()` is auto-imported everywhere in your Nuxt app. This is how you read consent state and trigger actions from your own code.

```ts
const {
  // State — all are Ref<T>, use .value outside templates
  decided,      // Ref<boolean> — true once the user has made any choice
  preferences,  // Ref<{ [categoryKey]: boolean }>
  record,       // Ref<ConsentRecord | null> — the proof-of-consent object
  showBanner,   // Ref<boolean>
  showModal,    // Ref<boolean>
  categories,   // CategoryConfig[] from your nuxt.config (not a Ref)

  // Actions
  acceptAll,          // () => void — accept every category
  rejectAll,          // () => void — reject all optional categories
  saveConsent,        // (prefs: ConsentPreferences) => void — save specific prefs
  openModal,          // () => void
  closeModal,         // () => void
  isEnabled,          // (key: string) => boolean — check a single category
} = useCookieConsent()
```

### Check if a category is enabled

```ts
const { isEnabled } = useCookieConsent()

isEnabled('analytics')  // true or false
```

### Gate a UI element

```vue
<template>
  <div v-if="isEnabled('analytics')">
    <!-- only rendered if the user consented to analytics -->
  </div>
</template>

<script setup lang="ts">
const { isEnabled } = useCookieConsent()
</script>
```

### Gate a script for returning users and new decisions

```ts
const { decided, isEnabled } = useCookieConsent()

watch(decided, (hasDecided) => {
  if (hasDecided && isEnabled('analytics')) {
    useHead({ script: [{ src: 'https://www.googletagmanager.com/gtag/js' }] })
  }
}, { immediate: true })
```

### Open the preferences modal from anywhere

```vue
<button @click="openModal">Manage cookie preferences</button>

<script setup lang="ts">
const { openModal } = useCookieConsent()
</script>
```

This is useful for a "Cookie settings" link in your footer.

### Custom banner / headless usage

Skip `<QookieBanner />` entirely and drive everything from the composable:

```vue
<template>
  <div v-if="showBanner" class="my-banner">
    <p>We use cookies to improve your experience.</p>
    <button @click="rejectAll">Reject all</button>
    <button @click="acceptAll">Accept all</button>
  </div>
</template>

<script setup lang="ts">
const { showBanner, acceptAll, rejectAll } = useCookieConsent()
</script>
```

---

## Proof of consent

Every decision creates a `ConsentRecord` stored alongside preferences in localStorage.

```ts
interface ConsentRecord {
  id: string            // UUID — unique per decision
  timestamp: string     // ISO 8601
  configHash: string    // hash of your category config at time of consent
  bannerVersion: string  // tracks the installed package version
  preferences: { [categoryKey]: boolean }
}
```

Access it at runtime:

```ts
const { record } = useCookieConsent()
console.log(record.value)
// {
//   id: "3f2a1b4c-...",
//   timestamp: "2025-01-15T10:23:00.000Z",
//   configHash: "1a2b3c4d",
//   bannerVersion: "0.2.0",   // matches your installed package version
//   preferences: { necessary: true, analytics: false, marketing: false }
// }
```

### Sending records to your backend

Set `auditEndpoint` and every consent decision will be POSTed there automatically as JSON:

```ts
qookie: {
  auditEndpoint: 'https://your-api.com/consent-audit',
}
```

The full `ConsentRecord` is the request body. Use this if you need server-side audit trails for compliance.

---

## Cookie scanner

When you provide `declaredCookies`, the module polls `document.cookie` every 3 seconds and warns about any cookies present that are not in your list. This is a development and audit tool — it helps you discover cookies you haven't accounted for.

```ts
qookie: {
  declaredCookies: [
    { name: '_ga',     category: 'analytics', description: 'Google Analytics' },
    { name: '_gid',    category: 'analytics', description: 'Google Analytics session' },
    { name: 'session', category: 'necessary', description: 'Session identifier' },
  ],
}
```

In development, undeclared cookies are logged to the browser console:

```
[Qookie] Undeclared cookies detected: ['auth_token']
[Qookie] Add these to the declaredCookies option in nuxt.config.ts
```

In all environments a `qookie:undeclared` custom event fires on `window`:

```ts
window.addEventListener('qookie:undeclared', (e) => {
  console.warn('Undeclared cookies:', e.detail.undeclared)
})
```

> **Note:** `HttpOnly` cookies are invisible to JavaScript by design and will not appear in the scanner. This is correct — they are managed server-side and are outside the scope of client-side consent.

---

## Stale consent detection

If you add, remove, or rename a category after users have already consented, Qookie detects this on their next visit and re-shows the banner automatically.

Detection is based on a hash of your category keys and `required` flags stored in the consent record. If the hash doesn't match your current config, the old consent is discarded and the user is prompted again.

No action needed — it works automatically.

---

## Privacy policy page

The banner hides itself when the user is on the `privacyPolicyPath` route (default: `/privacy-policy`):

```ts
qookie: {
  privacyPolicyPath: '/legal/privacy',
}
```

---

## Migrating from a previous version

If your app previously stored consent under a different localStorage key (e.g. `cookieConsent`), Qookie detects this on first load, migrates the data to the new format, and removes the old key. No configuration needed.

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
  QookieLabels,
} from '@qookie/nuxt'
```

The `qookie` key in `nuxt.config.ts` is fully typed — your IDE will autocomplete all options and flag unknown keys.

---

## Components

Both components are auto-imported — no manual import needed anywhere.

### `<QookieBanner />`

Fixed bottom bar. Shows on first visit, hides after any decision, hides on the privacy policy page. Contains Reject all, Manage, and Accept all buttons. Clicking Manage opens `<QookieModal />`.

Supports a `#message` slot for custom banner copy or markup. See [Language / i18n](#language--i18n).

### `<QookieModal />`

Per-category toggle modal. Required categories are shown as disabled (locked on). Has Reject all and Save preferences actions. Teleports to `<body>` to avoid z-index conflicts with your own layout.

---

## License

MIT
