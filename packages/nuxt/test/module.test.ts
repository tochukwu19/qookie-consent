import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock @nuxt/kit so defineNuxtModule returns the definition verbatim and the
// registration helpers become spies we can assert on.
const addPlugin = vi.fn()
const addComponent = vi.fn()
const addImports = vi.fn()

vi.mock('@nuxt/kit', () => ({
  defineNuxtModule: (def: unknown) => def,
  createResolver: () => ({ resolve: (p: string) => p }),
  addPlugin,
  addComponent,
  addImports,
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mod = (await import('../src/module')).default as any

interface NuxtStub {
  options: {
    app: { head: { style?: unknown[]; link?: unknown[] } }
    runtimeConfig: { public: Record<string, unknown> }
    build: { transpile: string[] }
  }
}

function makeNuxt(): NuxtStub {
  return {
    options: {
      app: { head: {} },
      runtimeConfig: { public: {} },
      build: { transpile: [] },
    },
  }
}

function runSetup(overrides: Record<string, unknown> = {}) {
  const nuxt = makeNuxt()
  mod.setup({ ...mod.defaults, ...overrides }, nuxt)
  return nuxt
}

beforeEach(() => {
  addPlugin.mockClear()
  addComponent.mockClear()
  addImports.mockClear()
})

describe('module meta + defaults', () => {
  it('uses the qookie config key and supports Nuxt 3 + 4', () => {
    expect(mod.meta.configKey).toBe('qookie')
    expect(mod.meta.compatibility.nuxt).toContain('^3.0.0')
    expect(mod.meta.compatibility.nuxt).toContain('^4.0.0')
  })

  it('ships four default categories with necessary required', () => {
    expect(mod.defaults.categories).toHaveLength(4)
    expect(mod.defaults.categories[0]).toMatchObject({ key: 'necessary', required: true })
  })
})

describe('runtime config', () => {
  it('writes public.qookie with moduleVersion and default labels', () => {
    const nuxt = runSetup()
    const cfg = nuxt.options.runtimeConfig.public.qookie as Record<string, unknown>
    expect(cfg.storageKey).toBe('qookie:consent')
    expect(cfg.moduleVersion).toBeTruthy()
    expect(cfg.labels).toEqual({})
  })

  it('does not leak the build-only font options into runtime config', () => {
    const nuxt = runSetup()
    const cfg = nuxt.options.runtimeConfig.public.qookie as Record<string, unknown>
    expect(cfg.fontFamily).toBeUndefined()
    expect(cfg.loadPoppins).toBeUndefined()
  })
})

describe('font head injection', () => {
  it('sets --qookie-font and loads Poppins by default', () => {
    const nuxt = runSetup()
    expect(nuxt.options.app.head.style).toHaveLength(1)
    expect(nuxt.options.app.head.link?.length).toBeGreaterThan(0)
  })

  it('skips the Poppins <link> when loadPoppins is false', () => {
    const nuxt = runSetup({ loadPoppins: false })
    expect(nuxt.options.app.head.link).toBeUndefined()
  })
})

describe('registration wires to @qookie/vue', () => {
  it('transpiles the framework-agnostic packages', () => {
    const nuxt = runSetup()
    expect(nuxt.options.build.transpile).toContain('@qookie/vue')
    expect(nuxt.options.build.transpile).toContain('@qookie/core')
  })

  it('registers the universal plugin', () => {
    runSetup()
    expect(addPlugin).toHaveBeenCalledOnce()
    expect(addPlugin.mock.calls[0][0]).toContain('runtime/plugins/cookie')
  })

  it('registers the components from @qookie/vue', () => {
    runSetup()
    const names = addComponent.mock.calls.map(c => c[0])
    expect(names).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'QookieBanner', filePath: '@qookie/vue', export: 'QookieBanner' }),
        expect.objectContaining({ name: 'QookieModal', filePath: '@qookie/vue', export: 'QookieModal' }),
      ]),
    )
  })

  it('auto-imports useCookieConsent from @qookie/vue', () => {
    runSetup()
    expect(addImports).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'useCookieConsent', from: '@qookie/vue' }),
    )
  })
})
