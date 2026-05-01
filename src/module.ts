import { defineNuxtModule, addPlugin, addComponent, addImports, createResolver } from '@nuxt/kit'
import type { ModuleOptions } from './runtime/types'

export type { ModuleOptions } from './runtime/types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@qookie/nuxt',
    configKey: 'qookie',
    compatibility: { nuxt: '^3.0.0' },
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
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Expose resolved options to all runtime code via public runtimeConfig
    nuxt.options.runtimeConfig.public.qookie = options as Required<ModuleOptions>

    addPlugin({
      src: resolver.resolve('./runtime/plugins/cookie.client'),
      mode: 'client',
    })

    addComponent({
      name: 'QookieBanner',
      filePath: resolver.resolve('./runtime/components/QookieBanner.vue'),
    })

    addComponent({
      name: 'QookieModal',
      filePath: resolver.resolve('./runtime/components/QookieModal.vue'),
    })

    addImports({
      name: 'useCookieConsent',
      as: 'useCookieConsent',
      from: resolver.resolve('./runtime/composables/useCookieConsent'),
    })
  },
})
