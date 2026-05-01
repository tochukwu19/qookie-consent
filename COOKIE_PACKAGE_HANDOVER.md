# Cookie Consent — Package Extraction Handover

## What exists today

A fully working GDPR/NDPR cookie consent system built for this Nuxt 2 project. It gates Google Analytics and Tidio live chat behind user consent and supports four categories: **necessary**, **analytics**, **functional**, **marketing**.

### Files that make up the system

| File | Role |
|---|---|
| `components/ CookieNotification.vue` | Banner + customisation modal UI (note leading space in filename — rename it) |
| `plugins/cookie.client.js` | Hydrates Vuex store from localStorage on app init |
| `plugins/gtag.js` | Inits vue-gtag disabled by default; reads prior consent from localStorage |
| `plugins/mixins.js` | Global mixin exposing `cookieDecided` and `cookiePreferences` to all components |
| `store/index.js` | State (`cookieConsent`), getters (`getCookieDecided`, `getCookiePreferences`, `getCookieConsent`), mutation (`setCookieConsent`) |
| `layouts/default.vue` | **Enforcement layer** — loads Tidio / opts GA in/out when consent changes |

### The localStorage shape

```json
{
  "decided": true,
  "preferences": {
    "necessary": true,
    "analytics": true,
    "functional": false,
    "marketing": false
  }
}
```

Key name: `cookieConsent`

---

## Architecture to understand before packaging

### Two layers that must stay in sync

1. **Label layer** (`CookieNotification.vue`) — what the user sees. The category names and descriptions in the modal are display-only. They must accurately describe which services run under each toggle.

2. **Enforcement layer** (`layouts/default.vue` `onConsentUpdated` + `mounted`) — what actually runs. This is where "analytics consent → opt into GA" and "functional consent → load Tidio" are hard-coded. If you add a new third-party service, you register it here and update the modal description.

### Three enforcement points for analytics (special case)

GA must be gated at plugin init time before the app mounts, so it has its own enforcement point in `plugins/gtag.js` that reads localStorage directly (the store isn't hydrated yet when the plugin runs).

### Adding a second service to one category

Multiple services can share a category. In `default.vue` add both calls inside the same `if` block:

```js
if (preferences.functional) {
  this.loadTidio()
  this.loadIntercom()   // second functional service
}
```

Update the modal description in `CookieNotification.vue` to list both services so the user knows what they're consenting to.

---

## Option A — Copy/paste into another Nuxt 2 project

### Step-by-step

1. **Rename the component file** — the current filename has a leading space (`components/ CookieNotification.vue`). Rename it to `CookieNotification.vue` before copying.

2. **Copy these files verbatim:**
   - `components/CookieNotification.vue`
   - `plugins/cookie.client.js`

3. **Merge into the target project's store** — add to `store/index.js`:
   ```js
   // state
   cookieConsent: {
     decided: false,
     preferences: { necessary: true, analytics: false, functional: false, marketing: false }
   }

   // getters
   getCookieConsent: (state) => state.cookieConsent,
   getCookieDecided: (state) => state.cookieConsent.decided,
   getCookiePreferences: (state) => state.cookieConsent.preferences,

   // mutation
   setCookieConsent: (state, payload) => { state.cookieConsent = payload }
   ```

4. **Merge into the target project's mixins** — add to whatever global mixin exists:
   ```js
   computed: {
     cookieDecided() { return this.$store.getters.getCookieDecided },
     cookiePreferences() { return this.$store.getters.getCookiePreferences }
   }
   ```
   If no global mixin exists, create `plugins/mixins.js` with a `Vue.mixin({})` call and register it in `nuxt.config.js`.

5. **Register the plugin** in `nuxt.config.js` plugins array:
   ```js
   '@/plugins/cookie.client.js',
   // any analytics plugins (gtag etc) MUST come after this line
   ```

6. **Wire up enforcement in the layout** — in `layouts/default.vue`:
   ```vue
   <CookieNotification @consentUpdated="onConsentUpdated" />
   ```
   Add the `mounted` hook and `onConsentUpdated` method that load your specific third-party services. The services themselves are project-specific — don't copy the Tidio/GA calls blindly.

7. **Handle analytics plugin init** — if the target project uses `vue-gtag`, copy `plugins/gtag.js` and swap the GA measurement ID (`G-QEF21NSBL2`). Register it after `cookie.client.js` in `nuxt.config.js`.

8. **Hide the banner on the privacy policy page** — the current component hides the full-screen overlay when `$route.path.includes('privacy-policy')`. Update that path check to match the target project's privacy policy URL.

### What you must customise per project

- GA measurement ID in `plugins/gtag.js`
- Tidio script URL in `layouts/default.vue`
- Third-party service load logic in `onConsentUpdated` and `mounted`
- Modal descriptions in `CookieNotification.vue` (list which services run under each category)
- Privacy policy page path in the `cookie-overlay-hide` class binding

---

## Option B — Extract as an npm package

### What the package can own

- The `CookieNotification.vue` component (banner + modal UI, category definitions, toggle CSS)
- The `cookie.client.js` plugin (localStorage → store hydration)
- The Vuex store module (state, getters, mutation)
- The mixin (computed helpers)

### What must stay in the consuming app

- Analytics plugin init (too project-specific — different GA IDs, different analytics providers)
- The enforcement layer in `default.vue` (which services load for which category is always app-specific)
- The Tidio / chat script URL

### Package structure

```
nuxt-cookie-consent/
  src/
    plugin.js          # registers store module + cookie.client hydration + mixin
    store/module.js    # Vuex module (namespaced)
    components/
      CookieNotification.vue
  index.js             # Nuxt module entry point
  package.json
```

### Nuxt module entry point (`index.js`)

```js
const path = require('path')

module.exports = function (moduleOptions) {
  const options = { storageKey: 'cookieConsent', ...moduleOptions }

  // Add the Vuex store module
  this.addPlugin({
    src: path.resolve(__dirname, 'src/plugin.js'),
    fileName: 'cookie-consent.client.js',
    options,
    mode: 'client'
  })

  // Auto-register the component
  this.nuxt.hook('components:dirs', (dirs) => {
    dirs.push({ path: path.resolve(__dirname, 'src/components') })
  })
}

module.exports.meta = require('./package.json')
```

### Store module (`src/store/module.js`)

Convert the flat store keys to a namespaced Vuex module:

```js
export const cookieConsent = {
  namespaced: true,
  state: () => ({
    decided: false,
    preferences: { necessary: true, analytics: false, functional: false, marketing: false }
  }),
  getters: {
    decided: (s) => s.decided,
    preferences: (s) => s.preferences
  },
  mutations: {
    setConsent(state, payload) { Object.assign(state, payload) }
  }
}
```

The consuming app registers it:
```js
store.registerModule('cookieConsent', cookieConsent)
```

### Props/events surface for `CookieNotification.vue`

The component should accept props so consuming apps can customise it without forking the source:

```js
props: {
  privacyPolicyPath: { type: String, default: '/privacy-policy' },
  categories: {
    type: Array,
    default: () => ['analytics', 'functional', 'marketing']
    // each entry: { key, label, description }
  }
}
// emits: 'consentUpdated' with the preferences object
```

### package.json (minimum)

```json
{
  "name": "nuxt-cookie-consent",
  "version": "1.0.0",
  "main": "index.js",
  "peerDependencies": {
    "nuxt": "^2.0.0",
    "vue": "^2.0.0",
    "vuex": "^3.0.0"
  }
}
```

### Key packaging decisions

**Namespacing the store** — the current implementation uses flat store keys (`getCookieDecided` etc.). A package should use a namespaced Vuex module so it doesn't collide with the consuming app's store. This means updating the mixin to use `this.$store.getters['cookieConsent/decided']`.

**Making categories configurable** — the four hardcoded categories (necessary, analytics, functional, marketing) are NNPC-specific in their descriptions. A package should accept a `categories` prop array so consuming apps can define their own labels and descriptions.

**Not bundling service loaders** — the package must not include Tidio or GA loading logic. Export a `consentUpdated` event and let the consuming app handle what that means for its own services.

**CSS isolation** — the scoped styles in `CookieNotification.vue` use brand colours (`#f9e745`, `#226845`). Expose CSS custom properties (`--cookie-accent`, `--cookie-confirm-color`) so consuming apps can theme it without forking.

---

## Current known issues / tech debt

- The component filename has a leading space: `components/ CookieNotification.vue`. This works on macOS (HFS+) but will cause issues on case-sensitive Linux filesystems (most CI/CD and production servers). **Rename it before shipping.**
- There is no opt-in/opt-out for marketing cookies yet — the UI toggle exists and the consent is stored, but `default.vue` has no `if (preferences.marketing)` block. Add one when a marketing script (e.g. Meta Pixel) is introduced.
- `plugins/gtag.js` reads `localStorage` directly instead of waiting for the store because the store isn't hydrated at plugin registration time. This is correct but fragile if the storage key ever changes — the key (`cookieConsent`) is duplicated between `cookie.client.js` and `gtag.js`. Extract it to a shared constant if packaging.
