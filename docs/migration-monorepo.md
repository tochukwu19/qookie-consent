# Qookie → framework-agnostic monorepo (Option A)

Migration plan to split the current single Nuxt module into a layered set of
packages so Qookie can run in **Nuxt, Astro/Vue, plain Vite+Vue** (and later
React/Svelte) from one shared core.

## Goal

```
@qookie/core   pure TS, zero framework deps   → runs anywhere
@qookie/vue    Vue reactivity + SFC components → Astro islands, Vite+Vue, Nuxt
@qookie/nuxt   thin module wrapper            → Nuxt only (auto-imports, config, plugin)
```

Consumers on Astro install `@qookie/vue` + `@astrojs/vue`, drop
`<QookieBanner client:load />` in a layout, and call `createQookie(config)` once.

## Key architectural decision — the store

Today state lives in Nuxt's `useState` and config comes from `useRuntimeConfig`.
Both get replaced by a **framework-neutral store** created from an explicit config
object.

- `@qookie/core` exposes `createConsentStore(config, { ref })` — a factory that
  takes a reactivity primitive (`ref`) so core stays dep-free, plus all the pure
  logic (hydrate / saveConsent / accept / reject / scanner wiring).
- `@qookie/vue` calls it with Vue's `ref`, holds the result as a **module-level
  singleton**, and exposes `useCookieConsent()` over it.

Why a module singleton rather than Nuxt's per-request `useState`:

- **Astro** renders every `client:*` component as its *own* Vue app instance, so
  `provide`/`inject` does **not** share state across islands (banner island vs a
  separate "manage cookies" button). A module singleton in the shared JS bundle
  does share, which is what we want.
- **SSR safety**: the usual risk of a server-side singleton is cross-request state
  leakage. Here it's a non-issue — consent state is only ever mutated client-side
  after mount (localStorage), so the server-side store stays at defaults for every
  request. Config is static per deployment.
- `provide`/`inject` is still wired as an *optional override* so the Nuxt adapter
  can hand components a `useState`-backed store if we ever want strict per-request
  isolation.

## Target layout

```
qookie/
  pnpm-workspace.yaml            packages/*, playgrounds/*
  packages/
    core/                        @qookie/core  (no framework deps)
      src/
        types.ts                 ← from runtime/types (drop nuxt/schema aug)
        storage.ts               ← moved as-is
        record.ts                ← moved as-is
        migrate.ts               ← moved as-is
        scanner.ts               ← from scanner/index.ts, moved as-is
        store.ts                 ← NEW  createConsentStore(config, { ref })
        index.ts                 ← barrel
    vue/                         @qookie/vue  (peer: vue)
      src/
        components/
          QookieBanner.vue       ← de-Nuxted (inject config + currentPath)
          QookieModal.vue        ← de-Nuxted (inject config)
        useCookieConsent.ts      ← Vue ref singleton over core store
        createQookie.ts          ← createQookie(config): inits store, returns Vue plugin
        index.ts
    nuxt/                        @qookie/nuxt  (deps: @qookie/vue, @qookie/core)
      src/
        module.ts                ← @nuxt/kit wiring (mostly unchanged)
        runtime/
          plugin.client.ts       ← createQookie(runtimeConfig) + hydrate + scanner
          composables.ts         ← re-export useCookieConsent
  playgrounds/
    nuxt/                        ← existing playground, moved
    astro/                       ← NEW: Astro + @astrojs/vue smoke test
```

## What changes in each de-Nuxting

**`useCookieConsent` (moves to `@qookie/vue`)**
- Remove `import { useState, useRuntimeConfig } from '#app'`.
- Config no longer read from `useRuntimeConfig`; it's baked into the store at
  `createQookie(config)` time.
- Each `useState<T>('qookie:x', fn)` → a `ref` created once inside the core store.

**`QookieBanner.vue`**
- Remove `useRuntimeConfig` → read `privacyPolicyPath` / `labels` from the store.
- Remove `useRoute` → replace route check with a framework-neutral `currentPath`
  (client: `window.location.pathname`, updated on `popstate`; overridable by prop
  so Nuxt/router users can pass the reactive route path).

**`QookieModal.vue`**
- Remove `useRuntimeConfig` → labels from the store.

**Plugin / bootstrap**
- `@qookie/vue` `createQookie(config)` runs hydrate + starts the scanner on the
  client (guard with `typeof window !== 'undefined'`), replacing `import.meta.dev`
  with a `debug` config flag.
- `@qookie/nuxt` keeps a `plugin.client.ts` that calls `createQookie` with values
  from `useRuntimeConfig`, preserving the `app:mounted` deferral.

**Types**
- `nuxt/schema` module augmentation moves to `@qookie/nuxt`; core types stay pure.

## Phased execution (each phase independently shippable/testable)

1. **Scaffold workspace** — `packages/*`, `playgrounds/*`, root `pnpm-workspace.yaml`,
   shared tsconfig base. Move existing playground under `playgrounds/nuxt`. No logic
   change; `pnpm -r test` still green.
2. **Extract `@qookie/core`** — move storage/record/migrate/scanner/types verbatim +
   add `createConsentStore`. Port the existing unit tests (they're already pure).
   Ship when core builds + tests pass in isolation.
3. **Build `@qookie/vue`** — de-Nuxt the composable + components, add
   `createQookie` + Vue plugin. Port composable/component tests. **This is the phase
   that unblocks Astro.**
4. **Astro playground** — new `playgrounds/astro` with `@astrojs/vue`, validate
   banner + modal + persistence + scanner end-to-end in a real Astro build.
5. **Refactor `@qookie/nuxt`** — reduce module to a thin wrapper over `@qookie/vue`;
   Nuxt playground green; parity with current behavior.
6. **Release plumbing** — per-package versions, update CI matrix, changesets or
   equivalent, README per package.

Sequencing note: 1→2→3 gets Astro working (phases 3–4); Nuxt refactor (5) is last so
the current shipping package keeps working throughout.

## Phase 4 findings (Astro playground, validated in-browser)

`playgrounds/astro` (Astro 5 + `@astrojs/vue`) wires the shared store once in
`src/qookie.ts` and installs it for every island via the `appEntrypoint`
(`src/_app.ts` → `app.use(qookie)`). Verified live:

- ✅ Astro builds + SSRs `@qookie/vue`; both pages render.
- ✅ Banner + a **separate** `ConsentStatus` island both resolve the *same*
  store — accepting in the banner updates the status island live (cross-island
  shared state confirmed).
- ✅ `Accept all` writes a correct `ConsentRecord` (UUID + timestamp +
  configHash + prefs) to `localStorage`.
- ✅ Banner auto-hides on `/privacy-policy` via the `window.location.pathname`
  check. No console errors.

Environment artifacts (not code bugs), noted so they aren't chased later:
- The headless preview tab runs **backgrounded** (`visibilityState: hidden`), so
  `requestAnimationFrame` is throttled and Vue's leave-`<Transition>` freezes at
  `leave-from`. In a visible tab the banner slides out normally.
- The preview browser **wipes localStorage on navigation**, so the return-visit
  "no banner" path can't be observed live here — it's covered by the
  `storage`/hydrate returning-user unit + composable tests, and the write itself
  was verified.

Known follow-up (Phase 6 build polish): the consumer build emits a Rollup
circular-chunk warning for the SFC default re-exported through the barrel while
sharing the `context` module. Runtime execution was verified correct; revisit by
restructuring the barrel / subpath exports.

## Decisions (settled 2026-07-14)

- **Package scope**: publish under the `@qookie/*` npm org → `@qookie/core`,
  `@qookie/vue`, `@qookie/nuxt`. `@qookie/nuxt` supersedes the current unscoped
  `qookie-nuxt`. (Requires claiming the `qookie` org on npm before first publish.)
- **Versioning**: `@qookie/core` and `@qookie/vue` start at `0.1.0`; `@qookie/nuxt`
  carries forward from its existing `0.2.1` for upgrade continuity.
- **Release tooling**: adopt **Changesets** for independent per-package versioning +
  changelogs.
- **Font handling**: `loadPoppins`/`fontFamily` stay a **Nuxt-only convenience**
  (Nuxt has `app.head`). `@qookie/vue` ships a documented CSS snippet
  (`:root { --qookie-font: ... }` + optional `<link>`) instead of an injector —
  keeps the Vue core lean.
```
