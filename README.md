# Qookie

GDPR- and NDPR-first cookie consent for the Vue ecosystem. A compliant banner and
preference modal, a proof-of-consent record on every decision, a cookie scanner,
and a headless store — with **no third-party runtime dependencies**.

Qookie is a small monorepo of layered packages so the same consent engine runs in
Nuxt, Astro, Vite + Vue, or any Vue 3 app.

## Packages

| Package | Install for | |
|---|---|---|
| [`@qookie-consent/nuxt`](packages/nuxt) | **Nuxt 3 / 4** — zero-config module, auto-imports, SSR | [README](packages/nuxt/README.md) |
| [`@qookie-consent/vue`](packages/vue) | **Astro, Vite + Vue, any Vue 3 app** | [README](packages/vue/README.md) |
| [`@qookie-consent/core`](packages/core) | **Framework-agnostic core** — build your own adapter | [README](packages/core/README.md) |

`@qookie-consent/nuxt` is a thin wrapper over `@qookie-consent/vue`, which is a Vue layer over
`@qookie-consent/core`. Pick the highest-level package that matches your framework.

## Which one do I install?

- **Nuxt** → `@qookie-consent/nuxt`
- **Astro (with `@astrojs/vue`)** → `@qookie-consent/vue`
- **Vite + Vue / plain Vue 3 SPA** → `@qookie-consent/vue`
- **React / Svelte / vanilla** → `@qookie-consent/core` (bring your own UI; a Vue-free
  reference is the store factory in core)

## What Qookie gives you

- **Compliant banner** with equal-prominence Accept / Reject (no dark patterns)
  and a per-category preferences modal.
- **Proof of consent** — every decision writes a `ConsentRecord` (UUID, timestamp,
  config hash, preferences) to `localStorage`, optionally POSTed to an audit
  endpoint.
- **Stale detection** — if you change your category config, returning users are
  re-prompted automatically (the config hash won't match).
- **Cookie scanner** — warns about cookies present on the page that aren't in your
  declared list.
- **Headless** — drive everything from `useCookieConsent()` / the core store if you
  want your own UI.

### Gating is your responsibility

Qookie surfaces consent state; it does **not** intercept or block scripts. That's
intentional — script-intercepting consent tools break SSR and create race
conditions. Gate in your own code:

```ts
const { isEnabled } = useCookieConsent()
if (isEnabled('analytics')) loadGoogleAnalytics()
```

## Repository layout

```
packages/
  core/         @qookie-consent/core   — types, storage, record, migrate, scanner, store
  vue/          @qookie-consent/vue    — createQookie, useCookieConsent, QookieBanner/Modal
  nuxt/         @qookie-consent/nuxt   — Nuxt module wrapping @qookie-consent/vue
playgrounds/
  nuxt/         Nuxt demo app
  astro/        Astro + @astrojs/vue demo app
```

## Development

```bash
pnpm install
pnpm build          # build all packages (topological order)
pnpm test           # run every package's suite
pnpm dev:playground # run the Nuxt playground
```

Releases are managed with [Changesets](.changeset/README.md): run `pnpm changeset`
to record a change; merging the generated "Version Packages" PR publishes.

## License

MIT
