import { defineNuxtModule, addPlugin, addComponent, addImports, createResolver } from '@nuxt/kit'
import pkg from '../package.json'
import type { ModuleOptions, RuntimeModuleOptions } from './runtime/types'

export type { ModuleOptions, RuntimeModuleOptions } from './runtime/types'
export type {
  CategoryConfig,
  DeclaredCookie,
  ConsentPreferences,
  ConsentRecord,
  QookieLabels,
} from '@qookie-consent/core'

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;1,400&display=swap'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'qookie-nuxt',
    configKey: 'qookie',
    compatibility: { nuxt: '^3.0.0 || ^4.0.0' },
  },
  defaults: {
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
        required: false,
      },
      {
        key: 'functional',
        label: 'Functional',
        description: 'Enable enhanced functionality like live chat.',
        required: false,
      },
      {
        key: 'marketing',
        label: 'Marketing',
        description: 'Used to deliver relevant advertisements.',
        required: false,
      },
    ],
    declaredCookies: [],
    auditEndpoint: undefined,
    fontFamily: "'Poppins', sans-serif",
    loadPoppins: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // --- Font setup (build-time only, not passed to runtime config) ---
    const fontFamily = options.fontFamily ?? "'Poppins', sans-serif"
    const loadPoppins = options.loadPoppins ?? true

    nuxt.options.app.head.style ??= []
    nuxt.options.app.head.style.push({
      innerHTML: `:root { --qookie-font: ${fontFamily}; }`,
    })

    if (loadPoppins) {
      nuxt.options.app.head.link ??= []
      nuxt.options.app.head.link.push(
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: GOOGLE_FONTS_URL },
      )
    }

    // --- Runtime config (font options excluded — they're already applied above) ---
    const { fontFamily: _f, loadPoppins: _l, ...runtimeOptions } = options
    nuxt.options.runtimeConfig.public.qookie = {
      ...runtimeOptions,
      labels: runtimeOptions.labels ?? {},
      moduleVersion: pkg.version,
    } as RuntimeModuleOptions

    // Ensure the framework-agnostic packages (which ship .vue SFCs) are
    // transpiled by Nuxt rather than treated as pre-built externals.
    nuxt.options.build.transpile.push('@qookie-consent/vue', '@qookie-consent/core')

    // --- Plugin (universal: provides the store on server + client) ---
    addPlugin(resolver.resolve('./runtime/plugins/cookie'))

    // --- Components + composable re-exported from @qookie-consent/vue ---
    addComponent({ name: 'QookieBanner', filePath: '@qookie-consent/vue', export: 'QookieBanner' })
    addComponent({ name: 'QookieModal', filePath: '@qookie-consent/vue', export: 'QookieModal' })

    addImports({ name: 'useCookieConsent', as: 'useCookieConsent', from: '@qookie-consent/vue' })
  },
})
